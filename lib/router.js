/**
 * Dependencies
 */

var resources = require('./collections/resources')
  , revalidator = require('revalidator')
  , url = require('url')
  , internals = require('./internal-routes')
  , isIdentifier = require('./storage').isIdentifier
;

/**
 * Find the resource for a given path and route to the resource.
 */

// TODO

// req.filename
// req._id

var router = module.exports = function (req, res, next) {
  // get the path parts
  var parts = req.parts = url.parse(req.url).pathname.split('/')
    , method = req.method
    , path = '/'
  ;
  
  
  // sanitize parts
  if(!parts[0]) parts.shift();
  if(!parts[parts.length - 1]) parts.pop();
  
  // last Part
  var lastPart = parts[parts.length - 1];

  // query sugar for JSON based query strings
  // eg ?q={"foo": {"bar": true}}
  if(req.query && req.query.q && req.query.q[0] === '{') {
    try {
      req.query = JSON.parse(req.query.q);
    } catch(e) {
      return next({message: 'Error when parsing query: ' + e.message, status: 400});
    }
    // mixin orderby support
    if (req.query.$orderby) {
      req.sort = req.query.$orderby;
      delete req.query.$orderby;
    }
  }

  // determine filename
  if(lastPart && ~lastPart.indexOf('.')) {
    req.filename = lastPart;
    // remove the filename from parts
    parts.pop();
  } else if (isIdentifier(lastPart)) {
    // rewrite the query to use id
    (req.query || (req.query = {}))._id = req._id = lastPart;
    // tell the storage engine to only return a single result
    req.one = true;
    // alias POSTs w/ an _id to PUT
    if(req.method === 'POST') req.method = 'PUT';
    // remove the id from parts
    parts.pop();
  }

  
  // now that the parts are sanitized, grab the last one
  var lastPart = parts[parts.length - 1]
    , firstPart = parts[0]
    , path = '/' + parts.join('/')
  ;

  if (firstPart === '__dashboard') {
    req.resource = {
      require: './collections/dashboard',
      path: '/__dashboard'
    };
    return next();
  }
  
  if (!parts.length && req.filename === 'dpd.js') {
    req.resource = {
      require: './clib',
      path: '/dpd.js'
    };
    return next();
  }
  
  // restrict access to internal resources
  // prevent any io for unauthed requests
  if(internals[path] && req.isRemote && !req.isRoot) {
    return next({status: 401});
  } else if(internals[path]) {
    req.resource = {
      require: internals[path],
      path: path
    };
    return next();
  }
  
  resources.get({path: path}).first(function (err, resource) {
    if(err) {
      next(err);
    } else if(resource) {
      req.resource = resource;
      next();
    } else {
      resources.get({path: '/' + firstPart}).first(function (err, resource) {
        if(err) {
          next(err);
        } else if(resource) {
          req.resource = resource;
          next();
        } else {
          next({status: 404, message: 'Resource Not Found'});
        }
      });
    }
  });
}