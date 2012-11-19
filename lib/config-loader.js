var fs = require('fs')
  , path = require('path')
  , domain = require('domain')

  , q = require('q')
  , async = require('async')

  , Module = require('./module')
  , Resource = require('./resource')
  , InternalResources = require('./resources/internal-resources')
  , Files = require('./resources/files')
  , ClientLib = require('./resources/client-lib')
  , Dashboard = require('./resources/dashboard')

  , loadModules = require('./module-loader')
  , qcall = require('./util/qcall');


module.exports.loadConfig = function(basepath, server, fn) {
  var allModulesQ = q.ncall(loadModules, this, basepath);

  var appFileQ = q.fcall(function() {
    return q.ninvoke(fs, 'readFile', path.join(basepath, 'app.dpd'), 'utf-8').then(function(appFile) {
      if (!appFile) {
        return {};
      } else {
        try {
          return JSON.parse(appFile);
        } catch (ex) {
          throw new Error("Error reading app.dpd: " + ex.message);
        }
      }
    });
  });

  var modulesQ = initModules(allModulesQ, appFileQ);

  var resourceTypesQ = modulesQ.then(function(modules) {
    var resourceTypes = [];
    return q.ninvoke(async, 'forEach', Object.keys(modules), function(k, fn) {
      var module = modules[k];
      qcall(function() {
        if (module.resourceTypes) {
          Array.prototype.push.apply(resourceTypes, module.resourceTypes);
        }
      }, fn);
    }).then(function() {
      return resourceTypes;
    });
  });

  var resourcesQ = loadResources(resourceTypesQ).then(function(resources) {

    var loadDefaultResource = function(resource) {
      return q.ninvoke(resource, 'load').then(function() {
        return resource;
      });
    };

    var defaultResourcesQ = [
      loadDefaultResource(new Files('', {server: server})),
      loadDefaultResource(new ClientLib('dpd.js', { config: { resources: resources }, server: server })),
      loadDefaultResource(new InternalResources('dpd.js', { config: { resources: resources }, server: server })),
      loadDefaultResource(new Dashboard('dashboard', {server: server}))
    ];

    return q.all(defaultResourcesQ, function(defaultResources) {
      Array.prototype.push.apply(resources, defaultResources);
      return resources;
    });
  });

  q.spread([modulesQ, resourcesQ], function(modules, resources, resourceTypes) { 
    return {
      modules: modules,
      resources: resources,
      resourceTypes: resourceTypes
    };
  }).then(function(result) {
    if (server.options && server.options.env !== 'development') {
      server.__resourceCache = result;
    }
    fn(null, result);
  }, function(err) {
    fn(err);
  });

};

function loadResources(resourceTypesQ, basepath) {

  var resourceDirQ = q.fcall(function() {
    var dir = path.join(basepath, 'resources');
    return q.ninvoke(fs, 'readdir', dir).then(function(results) {
      if (!results.length) return results; // async.filter doesn't like an empty array
      return q.ninvoke(async, 'filter', results, function(file, fn) {
        qcall(function() {
          var statQ = q.ninvoke(fs, 'stat', path.join(dir, file));
          return statQ.then(function(stat) {
            return stat && stat.isDirectory();
          });
        }, fn);
      });
    });
  });

  var resourcesQ = resourceDirQ.then(function(resourceDir) {
    return q.ninvoke(async, 'map', resourceDir, function(resourceName, fn) {
      var resourcePath = path.join(basepath, 'resources', resourceName);
      var configPath = path.join(resourcePath, 'config.json');
      qcall(function() {
        var configJsonFileQ = q.ninvoke(fs, 'readFile', configPath, 'utf-8');
        var configJsonQ = configJsonFileQ.then(function(configJsonFile) {
          return JSON.parse(results.configJsonFile);
        }, function(err) {
          if (err && err.code === 'ENOENT') {
            err = new Error("Expected file: " + path.relative(basepath, err.path));
          }
          throw err;
        });

        var instanceQ = Q.spread([configJsonQ, resourceTypesQ], function(config, types) {
          var type = config.type;
          if (!types[type]) throw new Error("Cannot find type \"" + type + "\" for resource " + resourceName);

          o = {
              config: config
            , server: server
            , db: server.db
            , configPath: resourcePath
          };

          return q.fcall(function() {
            var defer = Q.defer();

            var d = domain.create();
            d.on('error', function(err) {
              err.message += ' - when initializing: ' + o.config.type;
              console.error(err.stack || err);
              process.exit(1);
            });

            d.run(function() {
              process.nextTick(function() {
                var resource = new types[type](resourceName, o);
                if (typeof resource.load === 'function') {
                  resource.load(function(err) {
                    if (err) throw err;
                    defer.resolve(resource);
                  });
                } else {
                  defer.resolve(resource);
                }
              });
            })
            return defer.promise;
          });
        });
      }, fn);
    });
  });

  return resourcesQ;
}

function initModules(allModulesQ, appFileQ) {
  return q.spread([allModulesQ, appFileQ], function(allModules, appFile) {
    var modules = {};
    var moduleConfig = appFile.modules || {};
    return q.ninvoke(async, 'forEach', Object.keys(allModules), function(k, fn) {
      var m = allModules[k];
      var scope = {
        modules: modules,
        moduleConfig: moduleConfig
      };
      if (m.prototype instanceof Module) {
        initModule(m, scope, fn);
      } else if (m.prototype instanceof Resource) {
        initResourceType(m, scope, fn);
      } else {
        initGenericModule(m, scope, fn);
      }
    }).then(function() {
      return modules;
    });
  });
}


function initModule(m, scope, fn) {
  var d = domain.create();
  
  d.on('error', function(err) {
    if (err.message) {
      //Add to original error so we don't lose the stack trace
      err.message = "Error loading module " + m.id + ": " + err.message; 
    } else {
      err = new Error(err);
    }
    console.error(err.stack || err);
    process.exit(1);
  });
  d.run(function() {
    process.nextTick(function() {
      var module = scope.modules[m.id] = new m({config: scope.moduleConfig[m.id]});
      if (typeof module.load === 'function') {
        module.load(function(err) {
          if (err) throw err;
          d.dispose();
          fn();
        });
      } else {
        d.dispose();
        fn();
      }  
    });
  });
}

function initResourceType(m, scope, fn) {
  var module = new Module({});
  module.addResourceType(m);
  scope.modules[m.id] = module;
  fn();
}

function initGenericModule(m, scope, fn) {
  var module = new Module({});
  scope.modules[m.id] = module;
  fn();
}

