/**
 * Dependencies
 */

var resources = require('./collections/resources')
  , fs = require('fs');

module.exports = function (req, res, next) {
  resources.get(function (err, resources) {
    if(err) return next(err);
    
    resources = resources || [];
    
    fs.readFile(__dirname + '/../clib/dpd.js', function (err, data) {
      var src = data.toString();
      res.header('Content-Type', 'text/javascript');
      res.send(
        src.replace('/*resources*/', JSON.stringify(resources))
      );
    })
  });
}