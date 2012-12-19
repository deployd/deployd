var Store = require('./db').Store
  , util = require('util')
  ,	uuid = require('./util/uuid')
  , Cookies = require('cookies')
  , EventEmitter = require('events').EventEmitter
  , debug = require('debug')('session')
  , address = require('./util/address');

/*!
* A simple index for storing sesssions in memory.
*/

var sessionIndex = {}
  , userSessionIndex = {};

/**
* A store for persisting sessions inbetween connection / disconnection. 
* Automatically creates session IDs on inserted objects.
*/

function SessionStore(namespace, db, sockets) {
  this.sockets = sockets;

  // socket queue
  var socketQueue = this.socketQueue = new EventEmitter()
    , socketIndex = this.socketIndex = {};

  if(sockets) {
    sockets.on('connection', function (socket) {
      // NOTE: do not use set here ever, the `Cookies` api is meant to get a req, res
      // but we are just using it for a cookie parser
      var cookies = new Cookies(socket.handshake)
        , sid = cookies.get('sid');

      if(sid) {
        // index sockets against their session id
        socketIndex[sid] = socket;
        socketQueue.emit(sid, socket);
      }
    });
  } 

  Store.apply(this, arguments);
  
  // clear annonymous sessions
  this.remove({uid: {$exists: false}});
}
util.inherits(SessionStore, Store);
exports.SessionStore = SessionStore;

SessionStore.prototype.createUniqueIdentifier = function() {
  return uuid.create(128);
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
    debug('building existing %s', sid);
    
    this.find({id: sid}, function(err, s) {
      if(err) return fn(err);
      if(!s) {
        store.insert({id: sid}, function(err, s) {
          if(err) console.error(err);
        });
      }
      var sess = sessionIndex[sid] || new Session(s, store, socketIndex, store.sockets);
      sessionIndex[sid] = sess;
      // index sessions by user
      if(s && s.uid) {
        userSessionIndex[s.uid] = sess;
      } else {
        debug('not indexing user session', s);
      }
      fn(err, sess);
    });
  } else {
    sid = this.createUniqueIdentifier();
    debug('creating new %s', sid);
    var sess = sessionIndex[sid] = new Session({id: sid}, this, socketIndex, store.sockets);
    fn(null, sess);
    this.insert({id: sid}, function(err, s) {
      if(err) console.error(err);
    });
  }
};

/**
 * Emit data to all the sockets listening to the given event.
 *
 * @param {String} ev
 * @param {Object} data
 */

SessionStore.prototype.emitToAll = function (ev, data) {
  this.sockets.emit(ev, data);
};

/**
 * Emit data to all the sockets bound to the given array of user ids.
 *
 * @param {Array} uids
 * @param {String} event
 * @param {Object} data
 */

SessionStore.prototype.emitToSessions = function (sids, ev, data) {
  sids.forEach(function (sid) {
    var session = sessionIndex[sid]
      , socket = session && session.socket;
    
    if(socket) {
      socket.emit(ev, data);
    }
  });
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
  var sess = this;
  var sid;
  this.data = data;
  if(data && data.id) this.sid = sid = data.id;
  this.store = store;

  this.emitToUsers = function(collection, query, event, data) {
    collection.get(query, function(users) {
      var userSession;
      var notConnectedUsers = [];
      if(users && users.id) {
        var u = users;
        users = [u];
      }
      
      debug('emit to users:');
      debug('  query: %j', query);
      debug('  event: %s', event);
      debug('  data: %j', data);
      
      // process.server.cluster.emitToUsers(users, event, data);
      
      users.forEach(function(u) {
        userSession = userSessionIndex[u.id];

        // emit to sessions online
        if(userSession && userSession.socket) {
          debug('using a connected socket', userSession.socket);
          userSession.socket.emit(event, data);
        } else {
          debug('user is offline: %j - because: %s', u, userSession ? 'user session did not have a socket' : 'no user session was found');
          debug('all user sessions:', userSessionIndex);
          notConnectedUsers.push(u.id);
        }
      });
      
      debug('not connected users: %j', notConnectedUsers);
      process.server.cluster.emitToUsers(notConnectedUsers, event, data);
    });
  };

  this.emitToAll = function(ev, data) {
    // emit to other servers in the cluster
    process.server.cluster.emitToAll(ev, data);
    // emit to the current server
    store.emitToAll(ev, data);
  };

  store.socketQueue.on(this.sid, function (socket) {
    address(function (err, add) {
      debug('setting host %s for %s', add, sess.id);
      sess.set({host: add + ':' + process.server.options.port}).save();
    });
    
    debug('bound socket to', sess);
    sess.socket = socket;
    
    socket.on('disconnect', function (argument) {
      delete sess.store.socketIndex[sess.data.id];
      delete sess.socket;
    });
  });
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
    , data = this.data
    , query = {id: data.id};

  debug('saving %s', data.id);
  
  session.store.remove({id: data.id}, function (err) {
    if(err) return fn(err);
    session.store.insert(data, function (err, res) {
      fn && fn(err, res);
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
* Remove the session.
*
* @param {Function} callback(err, data)
* @return {Session} this for chaining
*/

Session.prototype.remove = function(fn) {
  var session = this;
  debug('removing %s', this.data.id);

  delete sessionIndex[this.data.id];
  delete userSessionIndex[this.data.uid]; // TODO: Don't delete all of a user's sessions
  delete session.store.socketIndex[this.data.id];

  this.store.remove({id: this.data.id}, fn);

  return this;
};