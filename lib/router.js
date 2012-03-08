/**
 * Dependencies
 */

var resources = require('./collections/resources')
  , revalidator = require('revalidator')
  , keys = require('./collections/keys')
;

/**
 * Attach the requested resource definition.
 */

module.exports = function (req, res, next) {
  var parsed = req.url.split('?')[0].replace('/', '').split('/')
    , collections = req.collections = []
    , references = req.references =  []
    , internals = {'/types': './collections/types', '/resources': './collections/resources', '/keys': './collections/keys'}
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
      var dssh = req.headers['x-dssh-key'];
      
      if(req.isRemote && !dssh) return next({status: 401});

      // authenticate key
      keys.get({key: dssh}, function (err, key) {
        if(req.isRemote && !key) {
          // remote requests must have a registered key
          return next({status: 401});
        } else {
          req.resource = {
            require: internals[path],
            path: path
          };
          next();
        }
      })
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