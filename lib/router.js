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
  var parts = url.parse(req.url).pathname.split('/')
    , paths = req.paths = []
    , references = req.references = []
    , method = req.method
    , path = '/'
  ;
  
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














// module.exports = function (req, res, next) {
//   var parsed = url.parse(req.url).path.split('?')[0].replace('/', '').split('/')
//     , collections = req.collections = []
//     , references = req.references =  []
//     , method = req.method
//     , path = '/'
//   ;
//   
//   // parse url into references and collections
//   parsed.forEach(function (part, i) {
//       (i % 2 ? references : collections).push(part);
//   });
// 
//   // cat collection reference
//   path += collections[0];
//   
//   // route to the first collection
//   resources.get({path: path}).first(function (err, resource) {
// 
//    if(internals[path]) {      
//      if(req.isRemote && !req.isRoot) {
//        // remote requests must have a registered key
//        return next({status: 401});
//      } else {
//        req.resource = {
//          require: internals[path],
//          path: path
//        };
// 
//        next();
//      }
//    } else {
//      // for future reference
//      req.resource = resource;
// 
//      if(!resource) {
//        err = {status: 404};
//      }
// 
//      // continue
//      next(err);
//    }
//   });
// }