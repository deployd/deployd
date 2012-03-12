/**
 * Dependencies
 */

var express = require('express')
  , parse = require('url').parse;

/**
 * Http server as a middleware
 */

var middleware = function (req, res, next) {
  if(req.isRemote) {
    // allow cross domain access
    res.header("Access-Control-Allow-Origin", '*');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    if(req.method === 'OPTIONS') {
      if(req.header('Access-Control-Request-Headers')) {
        res.header("Access-Control-Allow-Headers", req.header('Access-Control-Request-Headers'));
      }
      res.send('OK');
    } else {
      next();
    }
  } else {
    next(); 
  }
};

/**
 * Expose the mdoq object over http.
 */

middleware.listen = function (callback) {
  var server = this.server = express.createServer(express.bodyParser(), express.cookieParser())
    , url = parse(this.url || 'http://localhost:2403');

  // port
  var port = url.port || 2403;
  // host
  var hostname = url.hostname || 'localhost';
  
  // remote flag / remote auth
  server.use(function (req, res, next) {
    req.isRemote = true;
    
    // root auth
    var rawHdr = req.headers['x-dssh-key']
     , authErr = {status: 401}
     , strength
     , dssh;

    if(rawHdr) {
      try {
        dssh = JSON.parse(rawHdr);
        strength = Object.keys(dssh).length;
      } catch(e) {
        return next(authErr);
      }

      // dont even try to authenticate keys that arent secure
      if(req.isRemote && !(dssh && dssh._id && (strength > 2))) return next(authErr);

      // authenticate key
      keys.get(dssh, function (err, key) {
        if(req.isRemote && !key) {
          // remote requests must have a registered key
          return next(authErr);
        } else {
          req.isRoot = true;

          next();
        }
      })
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
 
