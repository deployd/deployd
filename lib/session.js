var Store = require('./db').Store
, util = require('util')
, Cookies = require('cookies')
, EventEmitter = require('events').EventEmitter
, crypto = require('crypto')
, debug = require('debug')('session')
, _ = require("underscore")
, async = require("async");

require("debug").enable("session:error");
var error = require('debug')('session:error');

/*!
* A simple index for storing sesssions in memory.
*/

var sessionIndex = {}
  , userSessionIndex = {};

/**
* A store for persisting sessions inbetween connection / disconnection.
* Automatically creates session IDs on inserted objects.
*/

function SessionStore(namespace, db, sockets, options) {
  var self = this;

  // unique id for this store in order to identify in a cluster
  this.id = this.createUniqueIdentifier();

  this.sockets = sockets;
  this.options = options || {};
  // sessions inactive for longer than this will be cleaned up:
  this.options.maxAge = this.options.maxAge || 30 * 24 * 60 * 60 * 1000;

  if (this.options.pubClient && this.options.subClient) {
    debug('using pub/sub mode');
    this.pubClient = this.options.pubClient;
    this.subClient = this.options.subClient;
  }

  // socket queue
  var socketQueue = this.socketQueue = new EventEmitter()
    , socketIndex = this.socketIndex = {};

  if (sockets) {
    if (this.subClient) {
      // subscribe to messages regarding sessions joining/leaving rooms
      // need to resync
      this.subClient.subscribe('dpd#session#refreshrooms');
      this.subClient.subscribe('dpd#session#remove');
      this.subClient.on('message', function(channel, message) {
        var data;
        switch (channel) {
          case 'dpd#session#refreshrooms': // another node changed rooms for a session
            data = JSON.parse(message);
            if (data.id !== self.id && data.sid && socketIndex[data.sid]) {
              // if we know about this session, refresh the rooms
              self.refreshSessionRooms(data.sid);
            }

            break;
          case 'dpd#session#remove': // another node removed a session
            data = JSON.parse(message);
            if (data.id !== self.id && data.sid && sessionIndex[data.sid]) {
              // if we know about this session, remove it from memory
              sessionIndex[data.sid]._leaveAllRooms();
              self.removeSessionFromMemory(data.sid);
            }

            break;
        }
      });
    }

    sockets.on('connection', function(client) {
      // NOTE: do not use set here ever, the `Cookies` api is meant to get a req, res
      // but we are just using it for a cookie parser
      var cookies = new Cookies(client.handshake)
        , sid = cookies.get('sid');

      var getSession = function(sid, fn) {
        // check if we already know about the session
        var session = sessionIndex[sid];
        if (session) { return fn(null, session); }
        // get the session from the store otherwise
        self.createSession(sid, function(err, session) {
          if (session.data.id === sid) return fn(null, session);
          return fn();
        });
      };

      var indexSocket = function(sid, client, session) {
        // index sockets against their session id
        socketIndex[sid] = socketIndex[sid] || {};
        socketIndex[sid][client.id] = client;
        socketQueue.emit('socket', client, session);

        // make sure the list of rooms to join is fresh
        self.refreshSessionRooms(sid, function() {
          client.emit('server:acksession');
        });
      };

      if (sid) {
        getSession(sid, function(err, session) {
          if (session) {
            indexSocket(sid, client, session);
          }
        });
      }

      // Alternative way of binding session to socket connection
      // for when the sid cookie is not yet available.
      // This expects that the client emits an event with the sid.
      function setSession(data) {
        if (!data || !data.sid || typeof data.sid !== 'string') { return; }
        var sid = data.sid;

        getSession(sid, function(err, session) {
          if (session) {
            // unassign socket from previous sessions
            _.each(socketIndex, function(val) {
              delete val[client.id];
            });

            indexSocket(sid, client, session);
          }
        });
      }

      client.on('server:setSession', setSession);
      client.on('server:setsession', setSession); // allow lowercase

      client.on('disconnect', function() {
        // unassign socket from previous sessions
        _.each(socketIndex, function(val, sid) {
          delete val[client.id];
        });
      });
    });

    var drainQueue = function drainQueue(method, rawSocket, session) {
      var key = '_' + method;
      if (session.socket._bindQueue && session.socket._bindQueue[key] && session.socket._bindQueue[key].length) {
        session.socket._bindQueue[key].forEach(function(args) {
          rawSocket[method].apply(rawSocket, args);
        });
      }
    };

    // resolve queue once a socket is ready
    socketQueue.on('socket', function(socket, session) {
      drainQueue('on', socket, session);
      drainQueue('emit', socket, session);
      drainQueue('join', socket, session);
      drainQueue('leave', socket, session);
    });
  }

  Store.apply(this, arguments);

  if (db) {
    // Cleanup inactive sessions from the db
    var store = this;
    process.nextTick(function() {
      store.cleanupInactiveSessions();
    });
  }
}
util.inherits(SessionStore, Store);
exports.SessionStore = SessionStore;

SessionStore.prototype.cleanupInactiveSessions = function() {
  var store = this;
  var inactiveSessions = [];

  _.each(sessionIndex, function(session, sid) {
    var timeago = Date.now() - 60 * 1000; // 1 minute
    if (session.data.lastActive < timeago && _.isEmpty(store.socketIndex[sid])) {
      inactiveSessions.push(sid);
    }
  });

  _.each(inactiveSessions, function(sid) {
    store.socketIndex[sid] = null;
    sessionIndex[sid] = null;
    delete sessionIndex[sid];
    delete store.socketIndex[sid];

    var inactiveUsers = [];
    _.each(userSessionIndex, function(sessions, uid) {
      delete sessions[sid];
      if (_.isEmpty(sessions)) {
        inactiveUsers.push(uid);
      }
    });

    _.each(inactiveUsers, function(uid) {
      delete userSessionIndex[uid];
    });
  });

  this.remove({
    $or: [
      { lastActive: { $lt: Date.now() - this.options.maxAge } },
      { lastActive: { $exists: false } }
    ]
  }, function(err, updated) {
    if (err) {
      error("Error removing old sessions: " + err);
    }
  });
  this.cleanupInactiveSessions.lastRun = Date.now();
};

SessionStore.prototype.createUniqueIdentifier = function() {
  return crypto.randomBytes(64).toString('hex');
};

SessionStore.prototype.publish = function(channel, data) {
  var store = this;
  if (store.pubClient) {
    store.pubClient.publish(channel, JSON.stringify(data));
  }
};


/**
* Create a new `Session` based on an optional `sid` (session id).
*
* @param {String} sid
* @param {Function} callback(err, session)
*/

SessionStore.prototype.createSession = function(sid, fn) {
  var socketIndex = this.socketIndex
    , store = this;

  if (typeof sid == 'function') {
    fn = sid;
    sid = undefined;
  }

  if (sid) {
    this.find({ id: sid }, function(err, s) {
      if (err) return fn(err);
      if (!s || s.lastActive < Date.now() - store.options.maxAge) {
        s = { anonymous: true };
        sid = null;
      }
      var sess = sessionIndex[sid] || new Session(s, store, socketIndex, store.sockets);
      if (sid) sessionIndex[sid] = sess;
      // index sessions by user
      if (s && s.uid) {
        userSessionIndex[s.uid] = userSessionIndex[s.uid] || {};
        userSessionIndex[s.uid][sess.data.id] = sess;
      }
      if (!sess.data.anonymous && (!sess.data.lastActive || sess.data.lastActive < Date.now() - 10 * 1000)) {
        // update last active date at max once every 10 seconds
        sess.data.lastActive = Date.now();
        sess.save(function() {
          fn(null, sess);
        });
      } else {
        fn(null, sess);
      }
    });
  } else {
    fn(null, new Session({ anonymous: true }, this, socketIndex, store.sockets));
  }

  // clean up inactive sessions once per minute
  if (store.cleanupInactiveSessions.lastRun < Date.now() - 60 * 1000) {
    process.nextTick(function() {
      store.cleanupInactiveSessions();
    });
  }
};


SessionStore.prototype.refreshSessionRooms = function(sid, fn) {
  var self = this;
  fn = fn || function() {};
  if (!self.socketIndex[sid]) return fn(null, false);

  // reload session
  self.createSession(sid, function(err, session) {
    if (err) return fn(err);
    if (!err && session.data && session.data.id === sid && session.data._rooms) {
      // make sure each room is joined
      session._leaveAllRooms(session.data._rooms, function() {
        _.each(self.socketIndex[sid], function(socket) {
          session.data._rooms.forEach(function(room) {
            socket.join(room);
          });
        });

        fn(null, true);
      });
    } else {
      fn(null, false);
    }
  });
};

/**
* Get the already created session
*/
SessionStore.prototype.getSession = function(uid, sid) {
  return userSessionIndex[uid][sid] || null;
};

SessionStore.prototype.removeSessionFromMemory = function(sid) {
  delete sessionIndex[sid];
  _.each(userSessionIndex, function(sessions) {
    delete sessions[sid];
  });

  delete this.socketIndex[sid];
};

/**
* An in memory representation of a client or user connection that can be saved to disk.
* Data will be passed around via a `Context` to resources.
*
* Example:
*
*    var session = new Session({id: 'my-sid', new SessionStore('sessions', db)});
*
*    session.set({uid: 'my-uid'}).save();
*
* @param {Object} data
* @param {Store} store
* @param {Socket} socket
*/

function Session(data, store, sockets, rawSockets) {
  var sid;
  this.data = _.clone(data);
  if (!this.data.createdOn) this.data.createdOn = Date.now();
  if (!this.data.lastActive) this.data.lastActive = Date.now();
  if (data && data.id) this.sid = sid = data.id;
  this.store = store;
  var self = this;

  function bindFauxSocket(method, queue) {
    return function() {
      var myArgs = arguments;
      if (sockets[self.sid]) {
        // clear all queue arrays once socket is available, since they will no longer be needed
        _.each(queue, function(val) {
          val.length = 0;
        });

        _.each(sockets[self.sid], function(s) {
          s[method].apply(s, myArgs);
        });
      } else {
        // otherwise add to bind queue
        var key = '_' + method;
        queue[key] = queue[key] || [];
        queue[key].push(myArgs);
      }
    };
  }

  // create faux socket, to queue any events until
  // a real socket is available

  this.socket = {
    _bindQueue: []
  };

  this.socket.on = bindFauxSocket('on', this.socket._bindQueue);
  this.socket.emit = bindFauxSocket('emit', this.socket._bindQueue);
  this.socket.join = bindFauxSocket('join', this.socket._bindQueue);
  this.socket.leave = bindFauxSocket('leave', this.socket._bindQueue);

  if (data && data.uid) this.setUid(data.uid);

  this.emitToUsers = function(collection, query, event, data) {
    collection.get(query, function(users) {
      if (users && users.id) {
        users = [users]; // convert single item to array
      }

      users.forEach(function(u) {
        rawSockets.to(self.getUserChannel(u.id)).emit(event, data);
      });
    });
  };

  this.emitToAll = function() {
    rawSockets.emit.apply(rawSockets, arguments);
  };

  this.emitToRoom = function(room, event, data) {
    rawSockets.to(room).emit(event, data);
  };

  function saveRooms() {
    self.save(function(err, data) {
      if (!err) {
        // publish to other nodes that we need to refresh rooms for this session
        store.publish('dpd#session#refreshrooms', { id: self.id, sid: self.sid });
      }
    });
  }

  // join a room and store it in the session so when
  // this session reconnects, the room is automatically rejoined
  this.joinRoom = this.joinRooms = function(rooms) {
    var currentRooms = (self.data._rooms = self.data._rooms || []);
    if (typeof rooms === 'string') rooms = [rooms];
    _.each(rooms, function(room) {
      if (currentRooms.indexOf(room) === -1) currentRooms.push(room);
      self.socket.join(room);
    });

    saveRooms();
  };

  this.leaveRoom = this.leaveRooms = function(rooms) {
    var currentRooms = (self.data._rooms = self.data._rooms || []);
    if (typeof rooms === 'string') rooms = [rooms];
    _.each(rooms, function(room) {
      var index = currentRooms.indexOf(room);
      if (index !== -1) currentRooms.splice(index, 1);
      self.socket.leave(room);
    });

    saveRooms();
  };

  this._leaveAllRooms = function(except, fn) {
    if (typeof except === 'function') {
      fn = except;
      except = [];
    }

    var userChannel = self.getUserChannel();

    async.forEachOf(self.store.socketIndex[self.sid], function(socket, id, outer) {
      async.each(_.difference(_.without(socket.rooms, socket.id, userChannel), except), function(room, inner) {
        socket.leave(room, inner);
      }, outer);
    }, fn);
  };

  this.leaveAllRooms = function() {
    self._leaveAllRooms();
    self.data._rooms = [];
    saveRooms();
  };
}


/**
* Set properties on the in memory representation of a session.
*
* @param {Object} changes
* @return {Session} this for chaining
*/

Session.prototype.set = function(object) {
  var session = this
    , data = session.data || (session.data = {});

  Object.keys(object).forEach(function(key) {
    data[key] = object[key];
  });

  if (object && object.uid) {
    session.setUid(object.uid);
  }

  return this;
};

Session.prototype.getUserChannel = function(uid) {
  if (uid || this.data.uid) {
    return 'dpd_uid:' + (uid || this.data.uid);
  }
};

/**
* Set the user id for this session.
*
* @param {String} uid
* @return {Session} this for chaining
*/

Session.prototype.setUid = function(uid) {
  var session = this;
  if (session.data.uid != uid) {
    // remove from previous room
    session.socket.leave(session.getUserChannel(session.data.uid));
  }

  if (uid) {
    session.data.uid = uid;
    session.socket.join(session.getUserChannel(uid));
  }

  return this;
};

/**
* Save the in memory representation of a session to its store.
*
* @param {Function} callback(err, data)
* @return {Session} this for chaining
*/

Session.prototype.save = function(fn) {
  var session = this
    , data = _.clone(this.data)
    , anonymous = false
    , sid = null;

  fn = fn || function() { };

  if (data.anonymous) {
    delete data.anonymous;
    sid = data.id = this.store.createUniqueIdentifier();
    anonymous = true;
  } else {
    sid = data.id;
  }

  if (typeof data.id !== "string"){
    return fn('Invalid id');
  }

  // If anonymous, create a new session.
  if (anonymous) {
    session.store.insert(data, function(err, res) {
      if (!err) {
        session.data = res;
        sessionIndex[sid] = session;

        if (res.uid) {
          userSessionIndex[res.uid] = userSessionIndex[res.uid] || {};
          userSessionIndex[res.uid][session.data.id] = session;
        }
        session.sid = res.id;
      }
      fn(err, res);
    });
  }
  // If already authenticated and we have sid, update session.
  else if (sid) {
    delete data.id;
    session.store.update({id: sid}, data, function(err) {
      if (!err) {
        data.id = sid;
        session.data = data;
        sessionIndex[sid] = session;

        if (data.uid) {
          userSessionIndex[data.uid] = userSessionIndex[data.uid] || {};
          userSessionIndex[data.uid][session.data.id] = session;
        }
        session.sid = data.id;
      }
      fn(err, data);
    });
  }

  return this;
};

/**
* Reset the session using the data in its store.
*
* @param {Function} callback(err, data)
* @return {Session} this for chaining
*/

Session.prototype.fetch = function(fn) {
  var session = this;
  this.store.first({id: this.data.id}, function(err, data) {
    session.set(data);
    fn(err, data);
  });
  return this;
};

/**
* Returns true if this is an anonymous (non-authenticated) session.
*/

Session.prototype.isAnonymous = function() {
  return this.data.anonymous;
};

/**
* Remove the session.
*
* @param {Function} callback(err, data)
* @return {Session} this for chaining
*/

Session.prototype.remove = function(data, fn) {
  if (typeof data === "function") {
    fn = data;
    data = this.data;
  }
  if (!data.id || typeof data.id !== "string") {
    return fn(); // nothing to remove
  }
  var session = this;
  debug('Removing %s', data.id);

  delete sessionIndex[data.id];
  if (userSessionIndex && userSessionIndex[data.uid] && userSessionIndex[data.uid][data.id]) {
    delete userSessionIndex[data.uid][data.id];
  }
  session.leaveAllRooms();
  if (session.store.socketIndex[data.id]) {
    delete session.store.socketIndex[data.id];
  }

  this.store.remove({id: data.id}, fn);

  if (session.sid) {
    session.store.publish('dpd#session#remove', { id: session.store.id, sid: data.id });
  }

  return this;
};
