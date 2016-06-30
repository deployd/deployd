var fs = require('fs')
  , debug = require('debug')('type-loader');

module.exports = function loadTypes(basepath, fn) {
  var types = {}
    , defaults = {};

  if(typeof basepath == 'function') {
    fn = basepath;
    basepath = undefined;
  }

  var path = basepath || '.'
    , packageJsonPath = path + '/package.json'
    , remaining = 0;

  function loadCustomResources(file) {
    remaining++;
    process.nextTick(function () {
      remaining--;
      try {
        var customResource = require(require('path').resolve(path) + '/node_modules/' + file);
        debug('Loading', file);
        if(customResource && customResource.prototype && customResource.prototype.__resource__) {
          debug('is a resource ', customResource && customResource.name);
          types[customResource.name] = customResource;
        }
      } catch(e) {
        if (e && e.code !== 'MODULE_NOT_FOUND') {
          console.error();
          console.error("Error loading module node_modules/" + file);
          console.error(e.stack || e);
          if(process.send) process.send({moduleError: e || true});
          process.exit(1);
        }
      }

      if(remaining === 0) {
        fn(defaults, types);
      }
    });
  }

  // read default lib resources
  fs.readdir(__dirname + '/resources', function(err, dir) {
    dir.forEach(function(file) {
      if(file.indexOf('.js') == file.length - 3 || file.indexOf('.') === -1) {
        var customResource = require(__dirname + '/resources/' + file);
        defaults[customResource.name] = customResource;
      }
    });

    if (fs.existsSync(packageJsonPath)) {
      var packageJson;
      try {
        packageJson = JSON.parse(fs.readFileSync(packageJsonPath));
      } catch(ex) {
        console.error('Failed to parse package.json as json');
        console.error(ex.stack || ex);
        if (process.send) process.send({moduleError: ex || true});
        process.exit(1);
      }
      if (packageJson && packageJson.dependencies) {
        var dependencies = packageJson.dpdInclude && packageJson.dpdInclude.length ? packageJson.dpdInclude.reduce(function(prev, curr) {
          prev[curr] = packageJson.dependencies[curr];
          return prev;
        }, {}) : packageJson.dependencies;
        var dpdIgnore = packageJson.dpdIgnore || [];
        debug('Loading these dependencies from package.json', dependencies);
        remaining = 0;
        for (var dependency in dependencies) {
          if(dpdIgnore.indexOf(dependency) === -1) loadCustomResources(dependency);
        }
      }
    } else {
      // read local project resources
      fs.readdir(path + '/node_modules', function(err, dir) {
        remaining = 0;
        if(dir && dir.length) {
          dir.forEach(function(file) {
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
