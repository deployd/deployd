/**
 * Dependencies
 */

var resources = require('./collections/resources')
  , revalidator = require('revalidator')
  , url = require('url')
  , internals = require('./internal-routes')
;

/**
 * Find the resource for a given path and route to the resource.
 */

var router = module.exports = function (req, res, next) {
  // get the path parts
  var parts = req.parts = url.parse(req.url).pathname.split('/')
    , paths = req.paths = []
    , references = req.references = []
    , method = req.method
    , path = '/'
  ;

  // query sugar for JSON based query strings
  // eg ?q={"foo": {"bar": true}}
  if(req.query && req.query.q && req.query.q[0] === '{') {
    req.query = JSON.parse(req.query.q);
    // mixin orderby support
    if (req.query.$orderby) {
      req.sort = req.query.$orderby;
      delete req.query.$orderby;
    }
  }
  
  // sanitize parts
  if(!parts[0]) parts.shift();
  if(!parts[parts.length - 1]) parts.pop();
  
  // parse url into references and collections
  parts.forEach(function (part, i) {
      (i % 2 ? references : paths).push(part);
  });
  
  // the path is either the first part or
  // the special root index path
  path += paths[0] || '';

  if(req.url === '/sessions') {
    // console.log(req.method, req.url, path);
  }

  if (path == '/__dashboard') {
    req.resource = {
      require: './collections/dashboard',
      path: '/__dashboard'
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

  
    
  // first look for a resource at the given path
  // eg. `/todos` or `/my-files`
  resources.get({path: path}).first(function (err, resource) {
    if(err) return next(err);
    if(resource) {
      req.resource = resource;
      next();
    } else if(parts.length < 2) {
      // if a root resource was not found
      // continue at '/'
      resources.get({path: '/'}).first(function (err, resource) {
        if(!resource) {
          err = {status: 404};
        }
        
        req.references[0] = parts[0];
        req.resource = resource;
        next(err);
      })
    } else {
      // no resource exists for this url
      next({status: 404});
    }
  })
}