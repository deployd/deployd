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
        
        if(resource.type === 'Static') {
          // rename
          collection.use(rename + '.chunks').rename(resource.path.replace('/', '') + '.chunks', function (err) {
            if(err) return next(err);
            collection.use(rename + '.files').rename(resource.path.replace('/', '') + '.files', function (err) {
              next(err);
            });
          });
        } else {
          // rename
          collection.use(rename).rename(resource.path.replace('/', ''), function (err) {
            next(err);
          });
        }
        

        
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
      });
      
      if(!renames) {
        next();
      }
      
    } else if(req.method === 'DELETE' && req.query._id) {
      resources.get(req.query).first(function (err, res) {
        if(res.path === '/') res.path = '/index';
        if(err || !res) return next(err);
        if(res.type === 'Static') {
          collection.use(res.path + '.files').del(function () {
            collection.use(res.path + '.chunks').del(function () {
              next();
            })
          })
        } else {
          collection.use(res.path).del(function (err) {
            // continue on collection not found errors - still remove resource
            if(err && ~err.message.indexOf('ns not found')) err = undefined;
            next(err);
          });
        }
      });
    } else if(req.method === 'GET') {
      // always return a static resource at the root
      
      // TODO - come up with a cleaner way to include default root static file resources
      
      if(req.query && req.query.path === '/') {
        end(function (req, res, next) {
          if(!(res.data && res.data.length)) {
            if(req.one) {
              res.data = {
                type: 'Static',
                typeLabel: 'Files',
                path: '/',
                _id: 'root'
              }
            }
          }
          next();
        })
      }
      
      next();
    } else {
      next();
    }
  })
;