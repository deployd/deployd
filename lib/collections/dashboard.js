var server = require('../server');
var path = require('path');
var fs = require('fs');
var mime = require('../types/mime');

var dashboard = module.exports = function(req, res, next, use) {
  var file = req.parts.concat();
  var key = req.query.key;
    
  file.shift();
  file = file.join('/');

  if (file === '') {
    if (req.url.lastIndexOf('/') !== req.url.length - 1) {
      return res.redirect(req.resource.path + '/');
    } else {
      file = 'index.html';  
    }
  }

  res.cookie('DPDAppUrl', process.url.href);

  if (key) {
    res.cookie('DPDAuthKey', authKey);
  }

  file = path.join('dashboard', file);

  fs.stat(file, function(err, stats) {
    var ext = file && path.extname(file);
    var mimeType = ext && mime[ext.split('.')[1]];

    if (err || !stats.isFile() || !mimeType) {
      next({status: 404});
    } else {
      res.header('Content-Type', mimeType);
      res.header('Transfer-Encoding', 'chunked');
      fs.createReadStream(file).pipe(res);
    }
  });

};