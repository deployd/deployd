/**
 * Dependencies
 */

var collection = require('../types/collection');

module.exports = 
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
      
      end(function (req, res, next) {
        if(!collectionPath) return next();
        
        collection.use(collectionPath).rename(collectionPath.replace('/', ''), function (err) {
          next(err);
        });
      })

      
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

// TODO
// - Run migration on PUT (when name is deleted remove property)
// - PUT requests come back {task: {$renameFrom: 'title'}}