/**
 * Dependencies
 */

var express = require('express')
  , parse = require('url').parse
  , keys = require('./collections/keys')
;

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
        res.header("Access-Control-Allow-Headers", req.header('Access-Control-Request-Headers') + ', Content-Type');
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
  var server = this.server = express.createServer(function (req, res, next) {    
    // by default pause the request
    req.pause();
    
    // query sugar for JSON based query strings
    // eg ?q={"foo": {"bar": true}}
    if(req.query && req.query.q && req.query.q[0] === '{') {
      req.query = JSON.parse(req.query.q);
    }
    
    if(req.method === 'GET' || req.method === 'DELETE') return next();
    
    // check for json content type
    var contentType = req.header('Content-Type')
      , isJSON = contentType && contentType.indexOf('application/json') > -1
    ;
          
    // only buffer JSON
    // everything else
    // should stream!
    if(isJSON) {
      
      var buf = '', err;
      
      // TODO: use an actual buffer
      // buffer the data
      req.on('data', function (data) {    
        buf += data;
      });
      
      // until the stream ends
      req.on('end', function () {
        try {
          req.body = JSON.parse(buf.toString());
        } catch(e) {err = e}
        
        next(err);
      });
      
      // start reading
      req.resume();
    } else {
      next();
    }
  }, express.cookieParser())
  
  // where to serve from
  var url = parse(this.url || 'http://localhost:2403');

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
 
