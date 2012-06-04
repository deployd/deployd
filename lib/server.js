var http = require('http')
  , Router = require('./router')
  , db = require('./db')
  , util = require('util')
  , resources = require('./resources')
  , Resource = require('./resource')
  , SessionStore = require('./session').SessionStore
  , fs = require('fs')
  , io = require('socket.io')
  , setupReqRes = require('./util/http').setup
  , debug = require('debug')('server');

function extend(origin, add) {
  // don't do anything if add isn't an object
  if (!add || typeof add !== 'object') return origin;

  var keys = Object.keys(add);
  var i = keys.length;
  while (i--) {
    if(add[keys[i]]) origin[keys[i]] = add[keys[i]];
  }
  return origin;
};

/**
 * Create an http server with the given options and create a `Router` to handle its requests.
 *
 * Options:
 *
 *   - `db`           the database connection info
 *   - `host`         the server's hostname
 *   - `port`         the server's port
 *
 * Example:
 *
 *     var server = new Server({port: 3000, db: {host: 'localhost', port: 27015, name: 'my-db'}});
 *     
 *     server.listen();
 *
 * @param {Object} options
 * @return {HttpServer}
 */

function Server(options) {
  http.Server.call(this);

  // defaults
  this.options = options = extend({
    port: 2403,
    host: 'localhost',
    db: {port: 27017, host: '127.0.0.1', name: 'deployd'}
  }, options);

  debug('started with options', options);

  // an object to map a server to its stores
  this.stores = {};

  // back all memory stores with a db
  this.db = db.connect(options.db);

  // persist resources in a store
  var resourceStore = this.resources = resources.build(this.createStore('resources'));

  // use socket io for a session based realtime channel
  this.sockets = io.listen(this).sockets;

  // persist sessions in a store
  var sessionStore = this.sessions = new SessionStore('sessions', this.db, this.sockets);

  this.on('request', function (req, res) {
    debug(req.method, req.url);

    // add utilites to req and res
    setupReqRes(req, res);

    sessionStore.createSession(function(err, session) {
      if(err) {
        debug('session error', err, session);
        res.statusCode = 500;
        res.end('error when creating session ' + err);
      } else {
        // (re)set the session id
        req.cookies.set('sid', session.sid);

        req.session = session;
        resourceStore.find(function (err, resources) {
          if(err) {
            debug('resource error', err, resources);
            res.statusCode = 500;
            res.end('error when finding resources ' + err);
          } else {
            var router = new Router(resources);
            router.route(req, res);
          }
        });
      }
    });
  });
}
util.inherits(Server, http.Server);


/**
 * Start listening for incoming connections.
 *
 * @return {Server} for chaining
 */

Server.prototype.listen = function(port, host) {
  return http.Server.prototype.listen.call(this, port || this.options.port, host || this.options.host);
};

/**
 * Create a new `Store` for persisting data using the database info that was passed to the server when it was created.
 *
 * Example:
 *
 *     // Create a new server
 *     var server = new Server({port: 3000, db: {host: 'localhost', port: 27015, name: 'my-db'}});
 *     
 *     // Attach a store to the server
 *     var todos = server.createStore('todos');
 *
 *		 // Use the store to CRUD data
 *     todos.insert({name: 'go to the store', done: true}, ...); // see `Store` for more info
 *
 * @param {String} namespace
 * @return {Store}
 */

Server.prototype.createStore = function(namespace) {
	return (this.stores[namespace] = this.db.createStore(namespace));
};

/**
 * Define or update a resource based on the given description.
 *
 *
 * @param {Object} description
 * @param {Function} callback(err)
 * @return {Resource}
 */

Server.prototype.defineResource = function(description, fn) {
  var resources = this.resources;
  resources.first({path: description.path}, function (err, res) {
    if(err) return fn(err);
    if(res && res.id) {
      debug('updating resource', description.path, description);
      resources.update({id: description.id}, description, fn);
    } else {
      debug('creating resource', description.path, description);
      resources.insert(description, fn);
    }
  })
};


/**
 * Get a single resource.
 *
 *
 * @param {String} path
 * @return {Resource}
 */

Server.prototype.getResource = function(path, fn) {
  var resource;

  this.resources.first({path: path}, fn);
};

module.exports = Server;