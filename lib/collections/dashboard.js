var server = require('../server');
var path = require('path');
var fs = require('fs');
var mime = require('../types/mime');
var dashboardRoot = '/__dashboard/';

var dashboard = module.exports = function(req, res, next, use) {
  var key = req.query && req.query.key;
  
  res.cookie('DPDAppUrl', process.url.href);
  if (key) {
    res.cookie('DPDAuthKey', key);
    return res.redirect(dashboardRoot);
  }
  
  if(req.url === '/__dashboard') return res.redirect(dashboardRoot);

  var url = req.url.replace(dashboardRoot, '') || 'index.html';
  var file = path.join(__dirname, '..', '..', 'dashboard', url);

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