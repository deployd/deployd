var server = require('../server');
var path = require('path');
var fs = require('fs');

var dashboard = module.exports = function(req, res, next, use) {
  var file = req.parts.concat();
  file.shift();
  file = file.join('/');

  if (file === '') {
    console.log(req.url);
    if (req.url.lastIndexOf('/') !== req.url.length - 1) {
      return res.redirect(req.resource.path + '/');
    } else {
      file = 'index.html';  
    }
  }

  res.cookie('DPDAppUrl', process.url.href);

  if (req.method === 'POST') {
    var authKey = req.params('authKey');
    res.cookie('DPDAuthKey', authKey);
  }

  file = path.join('dashboard', file);

  fs.stat(file, function(err, stats) {
    if (err || !stats.isFile()) {
      next({status: 404});
    } else {
      fs.createReadStream(file).pipe(res);
    }
  });

};