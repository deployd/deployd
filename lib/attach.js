var fs = require('fs')
    , path = require('path')
    , debug = require('debug')('server')
    , _ = require('underscore')
    , Router = require('./router')
    , db = require('./db')
    , io = require('socket.io')
    , Keys = require('./keys')
    , SessionStore = require('./session').SessionStore
    , setupReqRes = require('./util/http').setup
    , config = require('./config-loader');


/**
* Attach deployd router, sessions, db and functions into an existing http server instance.
* Make it possible to extend an express or socketIo server.
*
* The attached server instance consists of a handleRequest function which is an express middleware
*
* Options:
*
*   - `db`           the database connection info
*   - `socketIo`     the already created socket.io instance
*   - `host`         the server's hostname
*
* Properties:
*
*  - `sessions`      the servers `SessionStore`
*  - `sockets`       raw socket.io sockets
*  - `db`            the servers `Db` instance
*  - `handleRequest` express middleware
*
* Example:
*
*   var http = require('http');
*   var express = require('express');
*   var app = express();
*   var server = http.createServer(app);
*   var io = require('socket.io').listen(server, {'log level': 0});
*
*   var deployd = require('deployd')
*   deployd.attach(server, {socketIo: io, env: ENV, db:{host:'localhost', port:27015, name:'my-db'} } );
*   app.use(server.handleRequest);
*
*   server.listen();
*
* @param {Object} options
* @return {HttpServer}
*/
function attach(httpServer, options) {
  var server = process.server = httpServer;

  // defaults
  server.options = options = _.extend({
    db: {port: 27017, host: '127.0.0.1', name: 'deployd'}
  }, options);

  debug('started with options %j', options);

  // an object to map a server to its stores
  server.stores = {};

  // back all memory stores with a db
  server.db = db.create(options.db);

  // use socket io for a session based realtime channel
  if (options.socketIo && options.socketIo.sockets) {
    server.sockets = options.socketIo.sockets;
  } else {
    var socketIo = io.listen(server, _.extend({
      'log level': 0
    }, (server.options.socketIo && server.options.socketIo.options) || {}));
    server.sockets = socketIo.sockets;
    if (server.options.socketIo && server.options.socketIo.adapter) {
      socketIo.adapter(server.options.socketIo.adapter);
    }
  }

  // persist sessions in a store
  server.sessions = new SessionStore('sessions', server.db, server.sockets, options.sessions);

  // persist keys in a store
  server.keys = new Keys();

  server.handleRequest = function handleRequest(req, res) {
    // dont handle socket.io requests
    if(req.url.indexOf('/socket.io/') === 0) return;
    debug('%s %s', req.method, req.url);

    // add utilites to req and res
    setupReqRes(server.options, req, res, function(err, next) {
      if(err) return res.end(err.message);

      var authToken, usesBearerAuth = false;
      if (req.headers && req.headers.authorization) {
        var parts = req.headers.authorization.split(' ');
        var scheme = parts[0]
        , credentials = parts[1];

        if (/^Bearer$/i.test(scheme)) {
          authToken = credentials;
          usesBearerAuth = true;
        }
      }

      server.sessions.createSession(authToken || req.cookies.get('sid'), function(err, session) {

        if(err) {
          debug('session error', err, session);
          throw err;
        } else {
          if (!usesBearerAuth) {
            // (re)set the session id cookie if we're not using Authorization Bearer
            req.cookies.set('sid', session.sid);
          }
          req.session = session;

          var root = req.headers['dpd-ssh-key'] || req.cookies.get('DpdSshKey');

          if (server.options.env === 'development') {
            if (root) {
              req.isRoot = true;
            }
            server.route(req, res);
          } else if (root) {
            // all root requests
            // must be authenticated
            debug('authenticating', root);
            server.keys.get(root, function(err, key) {
              if(err) throw err;
              if(key) req.isRoot = true;
              debug('is root?', session.isRoot);
              server.route(req, res);
            });
          } else {
            // normal route
            server.route(req, res);
          }
        }
      });
    });
  };


  var serverpath = server.options.server_dir || fs.realpathSync('./');

  // mkdir resourcesPath if not exists
  var resourcesPath = path.join(serverpath, 'resources');
  // use sync functions, as only run once when server start-up
  if (!fs.existsSync(resourcesPath)) {
    fs.mkdirSync(resourcesPath);
  }

  server.route = function route(req, res) {
    config.loadConfig(serverpath, server, function(err, resourcesInstances) {
      if (err) throw err;
      server.resources = resourcesInstances;
      var router = server.router = new Router(resourcesInstances, server);
      router.route(req, res);
    });
  };

  // lazy-load OR bootstrap load?
  // config.loadConfig('./', server, function(err, resourcesInstances) {
  //     if (err) {
  //         console.error();
  //         console.error("Error loading resources: ");
  //         console.error(err.stack || err);
  //         process.exit(1);
  //     } else {
  //         server.resources = resourcesInstances;
  //         var router = server.router = new Router(resourcesInstances, server);
  //     }
  // });


  server.on('request:error', function (err, req, res) {
    console.error();
    console.error(req.method, req.url, err.stack || err);
    process.exit(1);
  });




  /**
  * Create a new `Store` for persisting data using the database info that was passed to the server when it was created.
  *
  * Example:
  *
  *     // Attach a store to the server
  *     var todos = server.createStore('todos');
  *
  *     // Use the store to CRUD data
  *     todos.insert({name: 'go to the store', done: true}, ...); // see `Store` for more info
  *
  * @param {String} namespace
  * @return {Store}
  */
  server.createStore = function(namespace) {
    return (this.stores[namespace] = this.db.createStore(namespace));
  };

  return server;
}

module.exports = attach;
