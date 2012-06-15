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
  , debug = require('debug')('server')
  , config = require('./config-loader');


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
  var server = this;
  http.Server.call(this);

  // defaults
  this.options = options = extend({
    port: 2403,
    host: 'localhost',
    db: {port: 27017, host: '127.0.0.1', name: 'deployd'}
  }, options);

  // deployment env
  var production = (process.env.DPD_ENV || options.env) === 'production';

  debug('started with options %j', options);

  // an object to map a server to its stores
  this.stores = {};

  // back all memory stores with a db
  this.db = db.connect(options.db);

  // use socket io for a session based realtime channel

  // socket io
  this.sockets = io.listen(this, {
    'log level': 0
  }).sockets;


  // persist sessions in a store
  var sessionStore = this.sessions = new SessionStore('sessions', this.db, this.sockets);

  // persist keys in a store
  var keys = this.keys = require('./keys');

  this.on('request', function (req, res) {
    if(req.url.indexOf('/socket.io/') === 0) return;

    debug('%s %s', req.method, req.url);

    // add utilites to req and res
    setupReqRes(req, res, function(err, next) {
      if(err) return res.end(err.message);
      sessionStore.createSession(req.cookies.get('sid'), function(err, session) {
        if(err) {
          debug('session error', err, session);
          res.statusCode = 500;
          res.end('error when creating session ' + err);
        } else {
          // (re)set the session id
          req.cookies.set('sid', session.sid);
          req.session = session;

          function route() {
            config.loadConfig('./', function(err, resourceConfig) {
              resources.build(resourceConfig, server, function(err, resourcesInstances) { 
                var router = new Router(resourcesInstances, server);
                server.router = router;
                
                server.resources = resourcesInstances;
                router.route(req, res);
              });
            });
          }

          var root = req.headers['dpd-ssh-key'];

          if(production && root) {
            keys.get(root, function(err, key) {
              if(err) throw err;
              if(key) session.isRoot = true;
              route();
            });
          } else {
            route();
          }
        }
      });
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
  var server = this;
  config.loadConfig('./', function(err, resourceConfig) {
    resources.build(resourceConfig, server, function(err, resourcesInstances) { 
      server.resources = resourcesInstances;
      http.Server.prototype.listen.call(server, port || server.options.port, host || server.options.host);
    });
  });
  return this;
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

module.exports = Server;
