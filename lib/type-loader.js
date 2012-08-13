var fs = require('fs')
  , Resource = require('./resource')
  , debug = require('debug')('type-loader');

module.exports = function loadTypes(basepath, fn) {
  var types = {}
    , defaults = {};
  
  if(typeof basepath == 'function') {
    fn = basepath; 
    basepath = undefined;
  }

  var path = basepath || '.';

  // read default lib resources
  fs.readdir(__dirname + '/resources', function(err, dir) {
    dir.forEach(function(file) {
      if(file.indexOf('.js') == file.length - 3 || file.indexOf('.') === -1) {
        var c = require(__dirname + '/resources/' + file);
        defaults[c.name] = c;
      }
    });

    // read local project resources
    fs.readdir(path + '/node_modules', function(err, dir) {
      dir && dir.forEach(function(file) {  
        if(file.indexOf('.js') == file.length - 3 || file.indexOf('.') === -1) {
          try {
            debug('Loading', require('path').resolve(path) + '/node_modules/' + file);
            var c = require(require('path').resolve(path) + '/node_modules/' + file);
            if(c && c.prototype && c.prototype.__resource__) {
              debug('is a resource ', c && c.name);
              types[c.name] = c; 
            }
          } catch(e) { 
            console.error();
            console.error("Error loading module node_modules/" + file);
            throw e;
          }
        }
      });
      
      fn(defaults, types);
    });
  });
}