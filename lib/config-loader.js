var fs = require('fs')
  , path = require('path')
  , _loadTypes = require('./type-loader')
  , InternalResources = require('./resources/internal-resources')
  , Files = require('./resources/files')
  , debug = require('debug')('config-loader')
  , async = require('async')
  , Promise = require('bluebird')
  , shell = require('shelljs');

/*!
 * Loads resources from a project folder
 * Callback receives two arguments `(err, resources)`.
 *
 * @param {String} basepath
 * @param {Function} callback
 */
module.exports.loadConfig = function (basepath, server, fn) {
  var resources = server.__resourceCache || [];

  if (resources.length) {
    debug("Loading from cache");
    fn(null, resources);
    return;
  }

  var getTypes = async.memoize(loadTypes);

  async.waterfall([
    async.apply(loadResourceDir, basepath)
    , async.apply(loadResources, getTypes, basepath, server)
    , async.apply(addInternalResources, getTypes, basepath, server)
  ], function (err, result) {
    if (server.options && server.options.env !== 'development') {
      server.__resourceCache = result;
    }
    fn(err, result);
  });
};

function loadTypes(fn) {
  _loadTypes(function (defaults, types) {
    Object.keys(types).forEach(function (key) {
      defaults[key] = types[key];
    });
    types = defaults;
    fn(null, types);
  });
}

function loadResourceDir(basepath, fn) {
  var resourceDir = path.join(basepath, 'resources');
  try {
    // get all folders that have a config.json
    var folders = shell.ls('-R', resourceDir + path.sep + '**' + path.sep + 'config.json').map(function(file) {
      // get just the relative part of the folder, stripping resource dir
      return path.relative(resourceDir, path.dirname(file)).split(path.sep).join('/'); // make sure separators are slashes
    });

    fn(null, folders);
  } catch (err) {
    console.log(err);
    fn(err);
  }
}

function loadResources(getTypes, basepath, server, files, fn) {
  async.map(files, function (resourceName, fn) {
    var resourcePath = path.join(basepath, 'resources', resourceName);
    var configPath = path.join(resourcePath, 'config.json');
    async.auto({
      types: function (fn) {
        getTypes(fn);
      },

      configJsonFile: function (fn) {
        debug("reading %s", configPath);
        fs.readFile(configPath, 'utf-8', fn);
      },

      configJson: ['configJsonFile', function (results, fn) {
        try {
          var settings = JSON.parse(results.configJsonFile);
          fn(null, settings);
        } catch (ex) {
          fn(ex);
        }
      }],

      instance: ['configJson', 'types', function (results, fn) {
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
        process.nextTick(function () {
          resource = new types[type](resourceName, o);
          loadResourceExtras(resource, fn);
        });
      }]
    }, function (err, results) {
      if (err && err.code === 'ENOENT') {
        err = new Error("Expected file: " + path.relative(basepath, err.path));
      } else if (err) {
        err.message += ' - when initializing: ' + resourceName;
        console.error(err.stack || err);
        process.exit(1);
      }

      fn(err, results && results.instance);
    });
  }, fn);
}

function loadResourceExtras(resource, fn) {
  async.series([
    function (fn) {
      if (resource.load) {
        resource.load(fn);
      } else {
        fn();
      }
    }
  ], function (err) {
    fn(err, resource);
  });
}

function addInternalResources(getTypes, basepath, server, resources, fn) {
  new Promise(function (resolve) {
    var defaultFolder = './public';
    if (server.options) {
      defaultFolder = server.options.public_dir || defaultFolder;
      var altPublic = defaultFolder + '-' + server.options.env;

      fs.exists(altPublic, function (exists) {
        if (exists) {
          resolve(altPublic);
        } else {
          resolve(defaultFolder);
        }
      });
    } else {
      resolve(defaultFolder);
    }
  }).then(function (publicFolder) {
    var internals = [
      new Files('', { config: { 'public': publicFolder }, server: server }),
      new InternalResources('__resources', { config: { configPath: basepath }, server: server })
    ];

    return internals;
  }).then(function (internals) {
    return new Promise(function (resolve) {
      getTypes(function (err, types) {
        for (var type in types) {
          if (types[type] && typeof types[type].selfHost === 'function') {
            var res = types[type].selfHost({ config: { resources: resources }, server: server });
            if (res) { 
              internals.push(res);
              debug('Resource ' + type + ' is self hosting at /' + res.name);
            }
          }
        }

        resolve(internals);
      });
    });
  }).then(function (internals) {
    async.forEach(internals, loadResourceExtras, function (err) {
      fn(err, resources.concat(internals));
    });
  });

}
