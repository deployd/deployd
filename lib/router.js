/**
 * Dependencies
 */

var resources = require('./collections/resources')
  , revalidator = require('revalidator')
;

/**
 * Attach the requested resource definition.
 */

module.exports = function (req, res, next) {
  var parsed = req.url.split('?')[0].replace('/', '').split('/')
    , collections = req.collections = []
    , references = req.references =  []
    , internals = {'/types': './collections/types', '/resources': './collections/resources'}
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
    
    // TODO only allow root
    if(!resource && internals[path]) {
      resource = {
        require: internals[path],
        path: path
      }
    }
    
    // for future reference
    req.resource = resource;
    
    if(!resource) {
      err = {status: 404};
    }
    
    // continue
    next(err);
  });
}