/**
 * Dependencies
 */

var url = 'localhost/deployd';

module.exports = require('mdoq')
  .use(function (req, res, next) {
    var path = req.resource && req.resource.path;
    this.url = url + (path || this.url);
    next();
  })
  .require('mdoq-mongodb')
;

/**
 * Export a way to change the storage url.
 */

module.exports.storage = function (db) {
  url = db;
  return this;
};