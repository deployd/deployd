var fs = require('fs')
  , Resource = require('./resource')
  , debug = require('debug')('type-loader')
  , domain = require('domain');

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
      var remaining = 0;
      if(dir && dir.length) {
        dir.forEach(function(file) {  
          if(file.indexOf('.js') == file.length - 3 || file.indexOf('.') === -1) {
            var d = domain.create();
            remaining++;
            d.run(function () {
              process.nextTick(function () {
                remaining--;
                try {
                  var moduleMain = require('path').resolve(path) + '/node_modules/' + file;
                  debug('Loading', moduleMain);
                  var stats = fs.lstatSync(moduleMain);
                  if ( stats.isFile() || stats.isDirectory() ) {
                    var c = require(moduleMain);
                    if(c && c.prototype && c.prototype.__resource__) {
                      debug('is a resource ', c && c.name);
                      types[c.name] = c;
                    }
                  } else {
                    debug('Does not exist: ', moduleMain);
                  }
                } catch(e) { 
                  console.error();
                  console.error("Error loading module node_modules/" + file);
                  console.error(e.stack || e);
                  if(process.send) process.send({moduleError: e || true});
                  process.exit(1);
                }
              
                if(remaining === 0) {
                  fn(defaults, types);
                }
              });
            });
          
            d.on('error', function (err) {
              console.error('Error in module node_modules/' + file);
              console.error(err.stack || err);
              if(process.send) process.send({moduleError: err});
              d.dispose();
              process.exit(1);
            });
          }
        });
      } else {
        fn(defaults, types);
      }
    });
  });
};