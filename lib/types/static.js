/**
 * Dependencies
 */
 
var storage = require('../storage')
  , mime = require('./mime')
  , path = require('path')
  , Stream = require('stream').Stream
  , fs = require('fs')
;

/**
 * A middleware for uploading, downloading, and removing files.
 */

module.exports = function (req, res, next, use) {  
  if(req.method === 'PUT' || req.method === 'POST' || req.method === 'DELETE') {
    // prevent un-authed writes/deletes
    if(!req.isRoot) return next({status: 401});
  }
  
  var filename = req.references && req.references[0]
    , ext = filename && path.extname(filename)
    , contentType = ext && mime[ext.split('.')[1]]
  ;
  
  // list files
  if(!filename) {
    req.directory = true;
  }
  
  // only allow certain content types
  if(filename && !contentType) {
    return next({status: 404, error: 'A filename with a valid extension must be provided', valid: mime});
  }
  
  // grab filename from references
  filename && (req.query._id = filename);
  
  // when writing, add req.file for storage engine
  if(req.method === 'POST' || req.method === 'PUT') {
    req.file = req;
  }
  
  // execute the request against the storage engine
  // TODO: should be able to proxy to storage
  storage.exec(req, function (err, body) {
    if(body && body.file) {
      res.header('Content-Type', contentType);
      res.header('Transfer-Encoding', 'chunked');
      
      body.file.stream(true).pipe(res);
    } else {
      res.data = body;
      next(err);
    }
  });

}