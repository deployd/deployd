var fs = require('fs')
  , Resource = require('./resource');

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
            var c = require(require('path').resolve(path) + '/node_modules/' + file);
            if(c.prototype.__resource__) {
              types[c.name] = c; 
            }
          } catch(e) {}
        }
      });
      
      fn(defaults, types);
    });
  });
}