/**
 * Dependencies
 */

var resources = require('./collections/resources')
  , revalidator = require('revalidator')
  , url = require('url')
  , internals = require('./internal-routes')
;

/**
 * Attach the requested resource definition.
 */

module.exports = function (req, res, next) {
  var parsed = url.parse(req.url).path.split('?')[0].replace('/', '').split('/')
    , collections = req.collections = []
    , references = req.references =  []
    , method = req.method
    , path = '/'
  ;
  
  // parse url into references and collections
  parsed.forEach(function (part, i) {
      (i % 2 ? references : collections).push(part);
  });

  path += collections[0];

  // route to the first collection
  resources.get({path: path}).first(function (err, resource) {    
    if(internals[path]) {      
      if(req.isRemote && !req.isRoot) {
        // remote requests must have a registered key
        return next({status: 401});
      } else {
        req.resource = {
          require: internals[path],
          path: path
        };
        
        next();
      }
    } else {
      // for future reference
      req.resource = resource;

      if(!resource) {
        err = {status: 404};
      }

      // continue
      next(err);
    }
  });
}