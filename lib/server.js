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
  next(); 
};

/**
 * Expose the mdoq object over http.
 */

middleware.listen = function (callback) {
  var server = this.server = middleware.server = express.createServer(function (req, res, next) {

    var origin = req.header('Origin');
    var path = origin && parse(origin);
    if (origin == 'null' || (path && path.hostname == 'localhost')) {
      res.header('Access-Control-Allow-Origin', '*'); 
      res.header('Access-Control-Allow-Credentials', 'true');
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.header("Access-Control-Allow-Headers", 'Origin, Accept, Content-Type');  
      if(req.method === 'OPTIONS') {  
        res.send('OK');
        return;
      }
    }

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
    
    // for non files, default to application/json
    if(!isJSON && req.url.indexOf('.') === -1) {
      isJSON = true;
    }
          
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

  process.url = url;
  
  // remote flag / remote auth
  server.use(function (req, res, next) {    
    req.isRemote = true;
    
    // root auth
    var rawHdr = req.headers['x-dssh-key']
     , authErr = {status: 401}
     , strength
     , dssh;

    // if dashboard
    if(!rawHdr && req.url.indexOf('/__dashboard') === 0) {
      rawHdr = req.query.key;
    }

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
    if(err instanceof Error) {
      res.statusCode = 500;
      res.send({message: err.message});
    }
    
    res.statusCode = err.status || 400;
    res.send(err);
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
 
