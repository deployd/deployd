var fs = require('fs')
  , path = require('path')
  , domain = require('domain')

  , q = require('q')
  , async = require('async')

  , Module = require('./module')
  , Resource = require('./resource')

  , loadModules = require('./module-loader')
  , qcall = require('./util/qcall');

var CACHE_EXPIRE_TIME_DEV = 2000
  , CACHE_EXPIRE_TIME_PROD = 1000*60*60; // hour

var __configCache = null
  , __cacheExpiration = 0;

exports.invalidateCache = function() {
  __configCache = null;
  __cacheExpiration = 0;
};

exports.loadConfig = function(basepath, server, fn) {
  if (__configCache && Date.now() < __cacheExpiration) {
    return fn(null, __configCache);
  }

  var allModulesQ = q.nfcall(loadModules, basepath);

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
    }, function(err) {
      if (err.code === "ENOENT") {
        throw "Expected app.dpd file";
      }
    });
  });

  var modulesQ = initModules(allModulesQ, appFileQ, server);

  var resourceTypesQ = modulesQ.then(function(modules) {
    var resourceTypes = {};
    return q.ninvoke(async, 'forEach', Object.keys(modules), function(k, fn) {
      var module = modules[k];
      if (module.resourceTypes) {
        module.resourceTypes.forEach(function(rt) {
          resourceTypes[rt.id] = rt;
        });
      }
      fn();
    }).then(function() {
      return resourceTypes;
    });
  });

  var resourcesQ = loadResources(resourceTypesQ, basepath, server).then(function(resources) {
    return modulesQ.then(function(modules) {
      Object.keys(modules).forEach(function(k) {
        var m = modules[k];
        if (m.resources) {
          Array.prototype.push.apply(resources, m.resources);
        }
      });

      return resources;
    });
  });

  q.spread([modulesQ, resourcesQ, resourceTypesQ], function(modules, resources, resourceTypes) { 
    return {
      modules: modules,
      resources: resources,
      resourceTypes: resourceTypes
    };
  }).then(function(result) {
    __configCache = result;
    if (server.options && server.options.env === 'development') {
      __cacheExpiration = Date.now() + CACHE_EXPIRE_TIME_DEV;
    } else {
      __cacheExpiration = Date.now() + CACHE_EXPIRE_TIME_PROD;
    }
    fn(null, result);
  }, function(err) {
    fn(err);
  });

};

function loadResources(resourceTypesQ, basepath, server) {
  var resourceDirQ = q.fcall(function() {
    var dir = path.join(basepath, 'resources');
    return q.ninvoke(fs, 'readdir', dir).then(function(results) {
      var d = q.defer();
      if (!results.length) d.resolve(results); // async.filter doesn't like an empty array
      async.filter(results, function(file, fn) {
        var statQ = q.ninvoke(fs, 'stat', path.join(dir, file));
        statQ.then(function(stat) {
          fn(stat && stat.isDirectory());
        });
      }, d.resolve);
      return d.promise;
    });
  });

  var resourcesQ = resourceDirQ.then(function(resourceDir) {
    return q.ninvoke(async, 'map', resourceDir, function(resourceName, fn) {
      var resourcePath = path.join(basepath, 'resources', resourceName);
      var configPath = path.join(resourcePath, 'config.json');
      qcall(function() {
        var configJsonFileQ = q.ninvoke(fs, 'readFile', configPath, 'utf-8');

        var configJsonQ = configJsonFileQ.then(function(configJsonFile) {
          return JSON.parse(configJsonFile);  
        }, function(err) {
          if (err && err.code === 'ENOENT') {
            err = new Error("Expected file: " + path.relative(basepath, err.path));
          }
          throw err;
        });

        var instanceQ = q.spread([configJsonQ, resourceTypesQ], function(config, types) {
          var type = config.type;
          if (!types[type]) {
            throw new Error("Cannot find type \"" + type + "\" for resource " + resourceName);
          }

          var o = {
              config: config
            , server: server
            , db: server.db
            , configPath: resourcePath
          };

          return q.fcall(function() {
            var defer = q.defer();

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

        return instanceQ;
      }, fn);
    });
  });

  return resourcesQ;
}

function initModules(allModulesQ, appFileQ, server) {
  return q.spread([allModulesQ, appFileQ], function(allModules, appFile) {
    var modules = {};
    var moduleConfig = appFile.modules || {};
    return q.ninvoke(async, 'forEach', Object.keys(allModules), function(k, fn) {
      var m = allModules[k];
      var scope = {
        modules: modules,
        moduleConfig: moduleConfig,
        server: server
      };
      if (m.prototype instanceof Module) {
        initModule(m, scope, fn);
      } else if (m.prototype instanceof Resource || m.prototype.__resource__) {
        initResourceType(m, scope, fn);
      } else {
        initGenericModule(m, scope, fn);
      }
    }).then(function() {
      Object.keys(modules).forEach(function(k) {
        var m = modules[k];
        m.id = k;
      });
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
      var module = scope.modules[m.id] = new m({config: scope.moduleConfig[m.id], server: scope.server});
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

