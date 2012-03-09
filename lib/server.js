/**
 * Dependencies
 */

var express = require('express')
  , parse = require('url').parse;

/**
 * Http server as a middleware
 */

var middleware = function (req, res, next) {
  next();
};

/**
 * Expose the mdoq object over http.
 */

middleware.listen = function (callback) {
  var server = this.server = express.createServer(express.bodyParser(), express.cookieParser())
    , url = parse(this.url || 'http://localhost:2304');

  // port
  var port = url.port || 2304;
  // host
  var hostname = url.hostname || 'localhost';
  
  // remote flag
  server.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", '*');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    req.isRemote = true;
    if(req.method === 'OPTIONS') {
      res.header("Access-Control-Allow-Headers", req.header("Access-Control-Request-Headers"));
      res.send('ok');
    } else {
      next();
    }
  });
  
  // proxy requests into the current mdoq stack
  // executing the stack when a request comes in
  server.use(this.proxy());
  
  // error handling
  server.error(function (err, req, res, next) {
    if(typeof err == 'object' && !(err instanceof Error)) {
      res.statusCode = err.status || 400;
      res.send({error: err});
    } else {
      next(err);
    }
  });
  
  // start the server
  server.listen(port, hostname, callback);
  
  // chainable
  return this;
};

/**
 * Stop the server from accepting new connections.
 */

middleware.close = function () {
  this.server.close();
};

/**
 * Export the middleware
 */

module.exports = middleware;
 
