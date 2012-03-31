/**
 * Dependencies
 */

var collection = require('../types/collection')
  , types = require('../types');

var resources = module.exports = 
  require('../types/collection')
  .use('/resources')
  .use(function (req, res, next, end) {
    if(req.method === 'PUT') {
      
      var resource = req.data
        , collectionPath = resource.path
        , properties = resource && resource.properties
        , prop
        , rename
        , renames = 0
        , errs = []
      ;
      
      if(resource.$renameFrom && (resource.$renameFrom != resource.path)) {
        rename = resource.$renameFrom;
        
        // dont insert renameFrom
        delete resource.$renameFrom;
        
        // rename
        collection.use(rename).rename(resource.path.replace('/', ''), function (err) {
          next(err);
        });
        
        return;
      }
      
      properties && Object.keys(properties).forEach(function (key) {
        prop = properties[key];
        rename = prop.$renameFrom;
        if(rename) {
          renames++;
          var renameObj = {};
          renameObj[rename] = key;
          
          collection.use(collectionPath).put({$rename : renameObj}, function (e, res) {
            e && errs.push(e);
            
            if(!--renames) {
              next(errs.length ? {error: {all: errs}} : null);
            }
          });
        }
      })
      
      if(!renames) {
        next();
      }
      
    } else {
      next();
    }
  })
;