/**
 * Dependencies
 */

var resources = require('./collections/resources')
  , fs = require('fs');

module.exports = function (req, res, next) {

  function loadAndSendFile(fileName, callback) {
    fs.readFile(__dirname + fileName, function (err, data) {
      var src = data.toString();
      res.header('Content-Type', 'text/javascript');

      if (callback) { src = callback(src); }

      var rootUrl = process.url.href;
      if (rootUrl.lastIndexOf('/') === rootUrl.length - 1) { rootUrl = rootUrl.slice(0, -1); }

      src = src.replace('/*rootUrl*/', '"' + rootUrl + '"');
      res.send(src);
    })
  }

  if (req.param('proxy')) {
    loadAndSendFile('/../clib/dpd-loader.js', function(src) {
      res.header('Content-Disposition', 'attachment; filename=dpd.js')
      return src;
    });    
  } else {
    resources.get(function (err, resources) {
      if(err) return next(err);
      
      resources = resources || [];
      
      loadAndSendFile('/../clib/dpd.js', function(src) {
        return src.replace('/*resources*/', JSON.stringify(resources));
      });
    });
    
  }

  
}