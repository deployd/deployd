var fs = require('fs')
  , path = require('path')
  , _loadTypes = require('./type-loader')
  , InternalResources = require('./resources/internal-resources')
  , Files = require('./resources/files')
  , ClientLib = require('./resources/client-lib')
  , Dashboard = require('./resources/dashboard')
  , debug = require('debug')('config-loader')
  , domain = require('domain')
  , async = require('async')
  , Q = require('q');

/*!
 * Loads resources from a project folder
 * Callback receives two arguments `(err, resources)`.
 * 
 * @param {String} basepath
 * @param {Function} callback
 */
module.exports.loadConfig = function(basepath, server, fn) {
  var resources = server.__resourceCache || [];

  server.__resourceCache = null;

  if (resources.length) {
    debug("Loading from cache");
    fn(null, resources);
    return;
  }

  var getTypes = async.memoize(loadTypes);

  async.waterfall([
      async.apply(loadResourceDir, basepath)
    , async.apply(loadResources, getTypes, basepath, server)
    , async.apply(addInternalResources, server, basepath)
  ], function(err, result) {
    if (server.options && server.options.env !== 'development') {
      server.__resourceCache = result;
    }
    fn(err, result);
  });
};

function loadTypes(fn) {
  _loadTypes(function(defaults, types) {
    Object.keys(types).forEach(function(key) {
      defaults[key] = types[key];
    });
    types = defaults;
    fn(null, types);
  });
}

function loadResourceDir(basepath, fn) {
  var dir = path.join(basepath, 'resources');
  async.waterfall([
    function(fn) {
      fs.readdir(dir, fn);
    },
    function(results, fn) {
      async.filter(results, function(file, fn) {
        fs.stat(path.join(dir, file), function(err, stat) {
          fn(stat && stat.isDirectory());
        });
      }, function(results) {
        fn(null, results);
      });
    }
  ], fn);
}

function loadResources(getTypes, basepath, server, files, fn) {
  async.map(files, function(resourceName, fn) {
    var resourcePath = path.join(basepath, 'resources', resourceName); 
    var configPath = path.join(resourcePath, 'config.json');
    async.auto({
      types: function(fn) {
        getTypes(fn);
      },

      configJsonFile: function(fn) {
        debug("reading %s", configPath);
        fs.readFile(configPath, 'utf-8', fn);
      },

      configJson: ['configJsonFile', function(fn, results) {
        try {
          var settings = JSON.parse(results.configJsonFile);
          fn(null, settings);
        } catch (ex) {
          fn(ex);
        }
      }],

      instance: ['configJson', 'types', function(fn, results) {
        debug("Loading resource: %s", resourceName);
        var config = results.configJson
          , types = results.types

          , type = config.type
          , resource
          , o;

        o = {
            config: config
          , server: server
          , db: server.db
          , configPath: resourcePath
        };

        if (!types[type]) return fn(new Error("Cannot find type \"" + type + "\" for resource " + resourceName));

        var d = domain.create();
        d.on('error', function (err) {
          err.message += ' - when initializing: ' + o.config.type;
          console.error(err.stack || err);
          process.exit(1);
        });
        d.run(function() {
          process.nextTick(function() {
            resource = new types[type](resourceName, o);
            loadResourceExtras(resource, fn);
          });
        });
      }]
    }, function(err, results) {
      if (err && err.code === 'ENOENT') {
        err = new Error("Expected file: " + path.relative(basepath, err.path));
      }
      fn(err, results && results.instance);
    });
  }, fn);
}

function loadResourceExtras(resource, fn) {
  async.series([
    function(fn) {
      if (resource.load) {
        resource.load(fn);
      } else {
        fn();
      }
    }
  ], function(err) {
    fn(err, resource);
  });
}

function addInternalResources(server, basepath, resources, fn) {
  var publicFolderQ = Q.fcall(function() {
    var defaultFolder = './public';

    if (server.options && typeof server.options.env === 'string') {
      var altPublic = './public-' + server.options.env;  
      var altPublicExistsQ = Q.defer();
      fs.exists(altPublic, function(exists) {
        altPublicExistsQ.resolve(exists);
      });
      return altPublicExistsQ.promise.then(function(exists) {
        if (exists) {
          return altPublic;
        } else {
          return defaultFolder;
        }
      });
    } else {
      return defaultFolder;
    }
  });

  publicFolderQ.then(function(publicFolder) {
    var internals = [
        new Files('', { config: { 'public': publicFolder }, server: server })
      , new ClientLib('dpd.js', { config: { resources: resources }, server: server})
      , new InternalResources('__resources', {config: {configPath: basepath}, server: server})
      , new Dashboard('dashboard', {server: server})
    ];
    async.forEach(internals, loadResourceExtras, function(err) {
      fn(err, resources.concat(internals));  
    });
  });

}