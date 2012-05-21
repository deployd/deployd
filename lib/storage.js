/**
 * Dependencies
 */

var url = 'mongodb://localhost/deployd'
  , mongo = require('mdoq-mongodb')
;

module.exports = require('mdoq')
  .use(function (req, res, next, end) {
    var path = req.resource && req.resource.path;
    
    // if the path is '/' rewrite it to '/index'
    if(path === '/') {
      path = '/index';
    } else if(this.url && this.url[0] === '/') {
      // a relative path
      path = this.url;
    }
    
    // sanitize longer paths
    var split = path && path.replace('/', '').split('/');
    if(split && split.length > 1) {
      path = '/' + split.join('-');
    }
    
    // build full mongodb url
    this.url = url + (path || this.url);
    
    if(req.method === 'PUT' && req.resource && req.resource.type != 'Static') {
      var oldBody = req.body
        , body = {$set: oldBody.$set || {}};
        
      Object.keys(oldBody).forEach(function (p) {
        if(p === '$set') return;
        if(p && p[0] === '$') {
          body[p] = oldBody[p];
        } else {
          body.$set[p] = oldBody[p];
        }
      })
      
      // rewrite body to $set
      req.body = body;
    }
    
    end(mongo);
    next();
  })
;

/**
 * Mix in mdoq-mongo utils
 */
 
Object.keys(mongo).forEach(function (func) {
  module.exports[func] = mongo[func];
});

/**
 * Export a way to change the storage url.
 */

module.exports.storage = function (db) {
  if(!db) return url;
  url = db;
  return this;
};

/**
 * Determine if the given object is an identifier.
 */

module.exports.isIdentifier = function (obj) {
  return obj && obj.toString().length === 24;
};