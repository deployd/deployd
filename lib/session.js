var Store = require('./db').Store
, util = require('util')
, Cookies = require('cookies')
, EventEmitter = require('events').EventEmitter
, crypto = require('crypto')
, debug = require('debug')('session')
, _ = require("underscore");

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

  this.sockets = sockets;
  this.options = options || {};
  // sessions inactive for longer than this will be cleaned up:
  this.options.maxAge = this.options.maxAge || 30 * 24 * 60 * 60 * 1000;

  // socket queue
  var socketQueue = this.socketQueue = new EventEmitter()
    , socketIndex = this.socketIndex = {};

  // NOTE: we will get a warning otherwise when more than 10 users try to login
  socketQueue.setMaxListeners(0);

  if(sockets) {
    sockets.on('connection', function (client) {
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

      if(sid) {
        getSession(sid, function(err, session) {
          if (session) {
            // index sockets against their session id
            socketIndex[sid] = socketIndex[sid] || {};
            socketIndex[sid][client.id] = client;
            socketQueue.emit(sid, client);
          }
        });
      }

      // Alternative way of binding session to socket connection
      // for when the sid cookie is not yet available.
      // This expects that the client emits an event with the sid.
      client.on('server:setSession', function(data) {
        if (!data || !data.sid) { return; }
        var sid = data.sid;

        getSession(sid, function(err, session){
          if (session) {
            // unassign socket from previous sessions
            _.each(socketIndex, function (val){
              delete val[client.id];
            });

            socketIndex[sid] = socketIndex[sid] || {};
            socketIndex[sid][client.id] = client;
            socketQueue.emit(sid, client);
          }
        });
      });
    });
  }

  Store.apply(this, arguments);

  if (db) {
    // Cleanup inactive sessions from the db
    var store = this;
    process.nextTick(function () {
      store.cleanupInactiveSessions();
    });
  }
}
util.inherits(SessionStore, Store);
exports.SessionStore = SessionStore;

SessionStore.prototype.cleanupInactiveSessions = function () {
  this.remove({
    $or: [
      { lastActive: { $lt: Date.now() - this.options.maxAge } },
      { lastActive: { $exists: false } }
    ]
  }, function (err, updated) {
    if (err) {
      error("Error removing old sessions: " + err);
    }
  });
  this.cleanupInactiveSessions.lastRun = Date.now();
};

SessionStore.prototype.createUniqueIdentifier = function () {
  return crypto.randomBytes(64).toString('hex');
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

  if(typeof sid == 'function') {
    fn = sid;
    sid = undefined;
  }

  if(sid) {
    this.find({ id: sid }, function (err, s) {
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
        sess.save(function () {
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
    process.nextTick(function () {
      store.cleanupInactiveSessions();
    });
  }
};



/**
* Get the already created session
*/
SessionStore.prototype.getSession = function (uid, sid) {
  return userSessionIndex[uid][sid] || null;
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
  if(data && data.id) this.sid = sid = data.id;
  this.store = store;
  var self = this;

  // create faux socket, to queue any events until
  // a real socket is available
  this.socket = {
    on: function () {
      var myArgs = arguments;
      if (sockets[self.sid]) {
        _.each(sockets[self.sid], function(s){
          s.on.apply(s, myArgs);
        });
      } else {
        // otherwise add to bind queue
        var queue = this._bindQueue = this._bindQueue || [];
        queue.push(myArgs);
      }
    },
    emit: function (ev) {
      var myArgs = arguments;
      if (sockets[self.sid]){
        _.each(sockets[self.sid], function(s){
          // if we have a real socket, use it
          if(s) {
            s.emit.apply(s, myArgs);
          }
        });
      } else {
        // otherwise add to emit queue
        var queue = this._emitQueue = this._emitQueue || [];
        queue.push(myArgs);
      }
    }
  };

  this.emitToUsers = function(collection, query, event, data) {
    collection.get(query, function(users) {
      var userSession;
      if(users && users.id) {
        users = [users]; // convert single item to array
      }
      users.forEach(function(u) {
        var userSessions = userSessionIndex[u.id];
        // emit to sessions online
        for (var key in userSessions) {
          userSession = userSessions[key];
          if (userSession && userSession.socket) {
            userSession.socket.emit(event, data);
          }
        }
      });
    });
  };

  this.emitToAll = function() {
    rawSockets.emit.apply(rawSockets, arguments);
  };

  this.bindSocketQueue();
}


Session.prototype.bindSocketQueue = function(){
  if (!this.sid) return;
  var self = this;
  // resolve queue once a socket is ready
  this.store.socketQueue.on(this.sid, function (socket) {
    // drain bind queue
    if(self.socket._bindQueue && self.socket._bindQueue.length) {
      self.socket._bindQueue.forEach(function (args) {
        socket.on.apply(socket, args);
      });
    }
    // drain emit queue
    if(self.socket._emitQueue && self.socket._emitQueue.length) {
      self.socket._emitQueue.forEach(function (args) {
        socket.emit.apply(socket, args);
      });
    }
  });
};

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
    , needsQueueBind = false;
  var sid = null ;
  if (data.anonymous) {
    delete data.anonymous;
    sid = data.id = this.store.createUniqueIdentifier();
    needsQueueBind = true;
  } else {
    sid = data.id ;
  }

  if (typeof data.id !== "string"){
    return fn('Invalid id');
  }

  this.store.remove({id: data.id}, function (err) {
    if(err) return fn(err);
    session.store.insert(data, function (err, res) {
      if (!err) {
        session.data = res;
        sessionIndex[sid] = session;

        if (res.uid) {
          userSessionIndex[res.uid] = userSessionIndex[res.uid] || {};
          userSessionIndex[res.uid][session.data.id] = session;
        }
        session.sid = res.id;
        if (needsQueueBind) session.bindSocketQueue();
      }
      fn(err, res);
    });
  });
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
  this.store.first({id: this.data.id}, function (err, data) {
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

Session.prototype.remove = function (data, fn) {
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
  delete session.store.socketIndex[data.id];

  this.store.remove({id: data.id}, fn);

  return this;
};
