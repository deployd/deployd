/**
 * Dependencies
 */

var url = 'mongodb://localhost/deployd';

module.exports = require('mdoq')
  .use(function (req, res, next) {
    var path = req.resource && req.resource.path;
    this.url = url + (path || this.url);

    next();
  })
  .require('mdoq-mongodb')
  .use(function (req, res, next) {
    next();
  })
;

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