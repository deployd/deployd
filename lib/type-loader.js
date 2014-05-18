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

  var path = basepath || '.',
      packageJsonPath = path + '/package.json',
      remaining = 0;;

  function loadCustomResources(file) {
    var d = domain.create();
    remaining++;
    d.run(function () {
      process.nextTick(function () {
        remaining--;
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

  // read default lib resources
  fs.readdir(__dirname + '/resources', function(err, dir) {
    dir.forEach(function(file) {
      if(file.indexOf('.js') == file.length - 3 || file.indexOf('.') === -1) {
        var c = require(__dirname + '/resources/' + file);
        defaults[c.name] = c;
      }
    });

    if (fs.existsSync(packageJsonPath)) {
      var packageJson = JSON.parse(fs.readFileSync(packageJsonPath));
      var dependencies = packageJson.dependencies;
      debug('Load dependencies from package.json', dependencies);
      var remaining = 0;
      for (var dependency in dependencies) {
        debug('dependency', dependency);
        loadCustomResources(dependency);
      }
    } else {
      // read local project resources
      fs.readdir(path + '/node_modules', function(err, dir) {
        if(dir && dir.length) {
          dir.forEach(function(file) {
            debug('Files:', file);
            if(file.indexOf('.js') == file.length - 3 || file.indexOf('.') === -1) {
              loadCustomResources(file);
            }
          });
        } else {
          fn(defaults, types);
        }
      });
    }
  });
};