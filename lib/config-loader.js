var fs = require('fs')
  , path = require('path')
  , Resource = require('./resource')
  , loadTypes = require('./type-loader')
  , InternalResources = require('./resources/internal-resources')
  , Files = require('./resources/files')
  , ClientLib = require('./resources/client-lib')
  , Dashboard = require('./resources/dashboard')
  , debug = require('debug')('config-loader')
  , ignore = {};
  
/*!
 * Loads resources from a project folder
 * Callback receives two arguments `(err, resources)`.
 * 
 * @param {String} basepath
 * @param {Function} callback
 */
module.exports.loadConfig = function(basepath, server, fn) {

  var remaining = 0
    , resourceConfig = resourceConfig || {}
    , resources = server.__resourceCache || []
    , src = {}
    , error;
      
  server.__resourceCache = null;

  if(resources.length) {
    debug("Loading from cache");
    fn(null, resources);
    
    if(server.options.env === 'development') {
      // dump the cache in two seconds
      setTimeout(function () {
        delete server.__resourceCache;
      }, 2000);
    }
    return;
  }

  function done() {
    if(!remaining) {
      if(error) return fn(error);

      var InternalResources = require('./resources/internal-resources');

      debug('done, adding internals');

      resources.push(new Files('', { config: { public: './public' }, server: server }));
      resources.push(new ClientLib('dpd.js', { config: { resources: resources }, server: server}));
      resources.push(new InternalResources('__resources', {config: {configPath: basepath}, server: server}));
      resources.push(new Dashboard('dashboard', {server: server}));

      server.__resourceCache = resources;
      
      fn(null, resources);
      remaining = -1;
    }
  }

  loadTypes(function(defaults, types) {
    Object.keys(types).forEach(function(key) {
      defaults[key] = types[key];
    });
    types = defaults;  
    loadResources(types); 
  });

  function loadResource(name, path, config, types) {
    debug("Loading resource: %s", name);
    var type = config.type
      , resource
      , o = {
          config: config
        , server: server
        , db: server.db
        , configPath: path
    };

    
    if (types[type]) {
      try {
        resource = new types[o.config.type](name, o);
        if (resource.load) {
          remaining++;
          resource.load(function(err) {
            remaining--;
            if (err) {
              error = err;
              return done();
            } 
            resources.push(resource);
            done();
          });
        } else {
          resources.push(resource);
        }
      } catch(e) {
        error = e;
        error.message += ' - when initializing: ' + o.config.type;
      }
    } else {
      error = 'cannot find type ' + o.config.type;
    }
  }

  function loadResources(types) {
    fs.readdir(path.join(basepath, 'resources'), function (err, dir) {
      if(dir && dir.length) {
        dir.forEach(function (file) {
          if(!ignore[file]) {
            remaining++;
            fs.stat(path.join(basepath, 'resources', file), function (err, stat) {
              remaining--;
              error = err;
              if(stat && stat.isDirectory()) {
                var spath = path.join(basepath, 'resources', file, 'config.json')
                  , resource = file;
              
                (fs.exists || path.exists)(spath, function (exists) {
                  if(exists) {
                    remaining++;
                    fs.readFile(spath, 'utf-8', function(err, data) {
                      remaining--;
                      var settings;
                      if(err) error = err;
                      try {
                        settings = JSON.parse(data);

                        loadResource(file, path.join(basepath, 'resources', file), settings, types);

                      } catch(e) {
                        error = e;
                        return fn(error);
                      }
          
                      done();
                    });
                  } else {
                    done();
                  }
                });
                
              } else {  
                done();
              }
            });
          }
        });
      } else {
        done();
      } 
    });
  }
  
};