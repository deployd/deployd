var fs = require('fs')
  , path = require('path')
  , util = require('util')
  , wrench = require('wrench')
  , Resource = require('../resource')
  , Collection = require('./collection')
  , UserCollection = require('./user-collection')
  , Files = require('./files')
  , Dashboard = require('./dashboard')
  , ClientLib = require('./client-lib')
  , config = require('../config-loader')
  , debug = require('debug')('resources')
  , path = require('path')
  , loadTypes = require('../type-loader')
  , uuid = require('../util/uuid')
  , sh = require('shelljs');

/*!
 * Builds a list of resources from config
 * 
 * @param {Array of Object} resourceConfig
 * @param {Server} server
 * @returns {Array of Resource} resources
 */


function InternalResources(settings, server) {
  settings.configPath = settings.configPath || './';
  Resource.apply(this, arguments);
  this.store = server && server.createStore && server.createStore('resources');
  this.server = server;
  // internal resource
  this.internal = true;
}
util.inherits(InternalResources, Resource);
module.exports = InternalResources;

var excludedTypes = {
  Dashboard: 1,
  Files: 1,
  ClientLib: 1
};

InternalResources.prototype.handle = function(ctx, next) {

  if (!ctx.req.isRoot) {
    ctx.done({statusCode: 401, message: "Not Allowed"});
    return;
  }

  var basepath = this.config.configPath;

  // TODO handle file system ENOENT, send all else to ctx.done
  // if(err) return ctx.done(err);

  var resource
    , id = ctx.url && ctx.url.replace('/', '')
    , file;

  if(ctx.url === '/types') {
    loadTypes(function(defaults, types) {
      Object.keys(types).forEach(function(key) {
        defaults[key] = types[key];
      });
      Object.keys(defaults).forEach(function(key) {
        if(excludedTypes[key]) return;
        var c = defaults[key];
          
        defaults[key] = {
          type: c.name,
          defaultPath: c.defaultPath,
          label: c.label,
          dashboardPages: c.dashboardPages
        };
      });
      ctx.done(err, defaults);
    })
    return;
  }

  if(ctx.req.method != 'GET' && ctx.server) {
    // clear cache
    delete ctx.server.__resourceCache;
  }

  switch (ctx.req.method) {
    case 'POST':
    case 'PUT':
      var parts
        , fileName
        , isJson;

      resource = ctx.body;

      parts = (ctx.url || '').split('/').filter(function(p) { return p; });

      if (!parts || !parts.length) return ctx.done({statusCode: 400, message: "You must provide a resource"});

      id = parts[0];
      if (!parts[1] || parts[parts.length - 1].indexOf('.') === -1) {
        parts.push('settings.json');
      }
      file = path.join(basepath, 'resources', parts.join('/'));

      fileName = parts[parts.length - 1].toLowerCase();
      isJson = fileName.lastIndexOf('.json') === fileName.length - 5;

      fs.stat(path.join(basepath, 'resources', id), function(err, stat) {
        if (!stat || !stat.isDirectory()) {
          fs.mkdir(path.join(basepath, 'resources', id), function(err) {
            if (err) return ctx.done(err);
            save();
          });
        } else {
          save();
        }
      });



      function save() {
        if (isJson && !resource.$setAll) {
          fs.readFile(file, 'utf-8', function(err, currentValue) {
            if (!currentValue) {
              writeFile(resource);
            } else {
              try {
                var currentJson = JSON.parse(currentValue);
                Object.keys(resource).forEach(function(k) {
                  currentJson[k] = resource[k];
                });
                writeFile(currentJson);
              } catch (ex) {
                writeFile(resource);
              }
            }
          });
        } else if (isJson) {
          delete resource.$setAll;
          writeFile(resource);
        } else {
          writeFile(resource.value);
        }
      }

      function writeFile(value) {
        if (typeof value === 'object') value = JSON.stringify(value);
        fs.writeFile(file, value, function(err) {
          if (err) return ctx.done(err);
          notifyType(id, 'Changed', resource, ctx.server, function() {
            resource.id = id;
            ctx.done(null, resource);  
          });
        });
      }
      
      break;
    case 'GET':
      if(id) {
        file = path.join(basepath, 'resources', id, 'settings.json')
        fs.readFile(file, 'utf-8', function(err, value) {
          var json;
          if (!value) return next();
          try {
            json = JSON.parse(value);
            json.id = id;
            ctx.done(null, json);
          } catch (ex) {
            ctx.done("Error parsing settings.json: " + ex.message);
          }
        });
        
      } else {
        fs.readdir(path.join(basepath, 'resources'), function(err, folders) {
          var remaining
            , fileDone
            , resources = [];
          if (!folders) return ctx.done(err);
          remaining = folders.length;
          fileDone = function() {
            remaining--;
            if (remaining <= 0) {
              resources = resources.sort(function(a, b) {
                var sort = a.__ctime - b.__ctime;
                if (sort == 0) {
                  sort = a.id.localeCompare(b.id);
                }
                return sort;
              }).map(function(r) {
                delete r.__ctime;
                return r;
              });
              ctx.done(null, resources);
            }
          };

          folders.forEach(function(f) {
            var fullPath = path.join(basepath, 'resources', f, 'settings.json');
            fs.stat(fullPath, function(err, stat) {
              if (stat) {
                fs.readFile(fullPath, 'utf-8', function(err, value) {
                  var json;
                  if (!value) return fileDone();
                  try {
                    json = JSON.parse(value);
                    json.id = f;
                    json.__ctime = stat.ctime;
                    resources.push(json);
                    fileDone();
                  } catch (ex) {
                    ctx.done("Error parsing settings.json: " + ex.message);
                  }
                });
              } else {
                fileDone();
              }
            });
          });
        });
      }
      break;
    case 'DELETE': 
      if (!id) return ctx.done("You must specify a resource");
      var resourcePath = path.join(basepath, 'resources', id);
      wrench.rmdirRecursive(resourcePath, function(err) {
        if (err) return ctx.done(err);
        notifyType(id, 'Deleted', null, ctx.server, function() {
          ctx.done();
        });
      });
      break;
    default:
      next();
  }
}

function notifyType(id, event, config, server, fn) {
  if(server) {
    var found = false;
    console.log(server.toString());
    server.resources.forEach(function(r) {
      if(id === r.config.name) {
        found = true;
        debug('notifying resource', r.config.path);
        if (r['config' + event]) {
          r['config' + event](config, function(err) {
            if (err) return fn(err);
            r.config = config;
            fn();
          });
        } else {
          fn();
        }
        return false;
      }
    });

    if (!found) {
      fn();
    }
  } else {
    fn();
  }
}

// function notifyType(resource, ctx, fn) {
//   if(ctx.server) {
//     ctx.server.resources.forEach(function(r) {
//       if(resource.type === r.settings.type && (resource.path === r.settings.path || resource.$renameFrom === r.settings.path) ) {
//         debug('notifying resource', r.settings.path);
//         if (r.changed) {
//           r.changed(ctx, fn);
//         } else {
//           fn();
//         }
//         return false;
//       }
//     });
//   } else {
//     fn();
//   }

// }
