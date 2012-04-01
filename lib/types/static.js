/**
 * Dependencies
 */
 
var storage = require('../storage')
  , mime = require('./mime')
  , path = require('path')
  , Stream = require('stream').Stream
  , IncomingForm = require('formidable').IncomingForm
  , fs = require('fs')
;

/**
 * A middleware for uploading, downloading, and removing files.
 */

module.exports = function (req, res, next, use) {    
  if(req.method === 'PUT' || req.method === 'POST' || req.method === 'DELETE') {
    // prevent un-authed writes/deletes
    if(req.isRemote && !req.isRoot) return next({status: 401});
  }
  
  var filename = req.references && req.references[0]
    , ext = filename && path.extname(filename)
    , mimeType = ext && mime[ext.split('.')[1]]
    , contentType = req.headers['content-type'] || mimeType
  ;
  
  // list files
  if(!filename) {
    // return index.html if it exists
    req.query._id = 'index.html';
    storage.exec(req, function (err, body) {
      if(!req.isRoot && body && body.file) {
        res.header('Content-Type', mimeType);
        res.header('Transfer-Encoding', 'chunked');
        body.file.stream(true).pipe(res);
      } else {
        // just display the directory
        delete req.query._id;
        req.directory = true;
        storage.exec(req, function (err, body) {
          res.data = body;
          next(err);
        });
      }
    });
    
    return;
  }
  
  // require a content type
  if((req.method == 'POST' || req.method === 'PUT') && filename && !contentType) {
    return next({status: 400, error: 'A filename with a valid extension and a proper Content-Type header must be provided', valid: mime});
  }

  // default query
  req.query = req.query || {};
  
  // grab filename from references
  filename && (req.query._id = filename);
  
  if(req.method === 'POST' || req.method === 'PUT') {
    if(contentType && contentType.match(/multipart/i)) {
      // use formidabble's multipart parser
      var form = new IncomingForm
        , stream = new Stream
        , first
      ;
      
      // resume once storage is ready
      stream.resume = function () {
        // override default behavior (dont save files)
        form.onPart = function (part) {
          // only handle files
          if(!first && part.filename) {
            // store first file
            first = part;
            
            // proxy events
            part
              .on('data', function (data) {
                stream.emit('data', data);
              })
              .on('end', function () {
                stream.emit('end');
              })
            ;
          }
        };
        
        form.parse(req);
        req.resume();
      };
      
      req.file = stream;
    } else {
      // otherwise stream the data directly into storage
      req.file = req.file || req;
    }
  }
  
  // execute the request against the storage engine
  // TODO: should be able to proxy to storage
  storage.exec(req, function (err, body) {
    if(body && body.file) {
      if(res.header && res.on) {
        res.header('Content-Type', mimeType);
        res.header('Transfer-Encoding', 'chunked');
        body.file.stream(true).pipe(res);
      } else {
        res.data = body.file;
        next();
      }
      
      
    } else {
      res.data = body;
      next(err);
    }
  });

}