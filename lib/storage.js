/**
 * Dependencies
 */

var url = 'mongodb://localhost/deployd'
  , mongo = require('mdoq-mongodb')
;

module.exports = require('mdoq')
  .use(function (req, res, next, end) {
    var path = req.resource && req.resource.path;
    this.url = url + (path || this.url);
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