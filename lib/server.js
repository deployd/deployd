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
  
  // proxy requests into the current mdoq stack
  // executing the stack when a request comes in
  server.use(this.proxy());
  
  // error handling
  server.error(function (err, req, res, next) {
    if(typeof err == 'object' && !(err instanceof Error)) {
      res.statusCode = 400;
      res.send(err);
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
 
