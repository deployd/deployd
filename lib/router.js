/**
 * Dependencies
 */

var resources = require('./collections/resources')
  , revalidator = require('revalidator')
  , keys = require('./collections/keys')
  , url = require('url')
;

/**
 * Attach the requested resource definition.
 */

module.exports = function (req, res, next) {
  var parsed = url.parse(req.url).path.split('?')[0].replace('/', '').split('/')
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
      }
      
      // dont even try to authenticate keys that arent secure
      if(req.isRemote && !(dssh && dssh._id && (strength > 2))) return next(authErr);
      
      // authenticate key
      keys.get(dssh, function (err, key) {
        if(req.isRemote && !key) {
          // remote requests must have a registered key
          return next(authErr);
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