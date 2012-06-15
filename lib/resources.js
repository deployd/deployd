var fs = require('fs')
  , util = require('util')
  , Resource = require('./resource')
  , Collection = require('./resources/collection')
  , UserCollection = require('./resources/user-collection')
  , Files = require('./resources/files')
  , Dashboard = require('./resources/dashboard')
  , ClientLib = require('./resources/client-lib')
  , config = require('./config-loader')
  , debug = require('debug')('resources')
  , path = require('path')
  , loadTypes = require('./type-loader')
  , uuid = require('./util/uuid');

/**
 * Builds a list of resources from config
 * 
 * @param {Array of Object} resourceConfig
 * @param {Server} server
 * @returns {Array of Resource} resources
 */
var build = exports.build = function (resourceConfig, server, fn) {
  var resourceConfig = resourceConfig || {}
    , resources = [];

  loadTypes(function(defaults, types) {
    Object.keys(types).forEach(function(key) {
      defaults[key] = types[key];
    });
    
    Object.keys(resourceConfig).forEach(function(k) {
      var c = resourceConfig[k];
      c.server = server;
      c.db = server.db;
      resources.push( new defaults[c.type](c) );
    });

    resources.push(new Files({path: '/', public: './public'}, server));
    resources.push(new ClientLib({path: '/dpd.js', resources: resources}, server));
    resources.push(new InternalResources({path: '/__resources'}, server));
    resources.push(new Dashboard({path: '/dashboard'}, server));

    fn(null, resources);
  });
}

function InternalResources(settings, server) {
  settings.configPath = settings.configPath || './';
  Resource.apply(this, arguments);
  this.store = server && server.createStore && server.createStore('resources');
  this.server = server;
  // internal resource
  this.internal = true;
}
util.inherits(InternalResources, Resource);
exports.InternalResources = InternalResources;

var excludedTypes = {
  Dashboard: 1,
  Files: 1,
  ClientLib: 1
};

InternalResources.prototype.handle = function(ctx, next) {

  var basepath = this.settings.configPath;

  config.loadConfig(basepath, function(err, resources) {
    // TODO handle file system ENOENT, send all else to ctx.done
    // if(err) return ctx.done(err);

    var resource
      , id = ctx.url && ctx.url.replace('/', '');

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
            label: c.label
          };
        });
        ctx.done(err, defaults);
      })
      return;
    }

    resources = resources || {};


    switch (ctx.req.method) {
      case 'POST':
        resource = ctx.body;
        id = uuid.create();
        resources[id] = resource;

        config.saveConfig(resources, basepath, function(err) {
          resource.id = id;
          ctx.done(err, resource);
        });
        break;
      case 'PUT':
        resource = ctx.body;
        delete resource.id;
        if (!resources[id]) {
          return next();
        }
        resources[id] = ctx.body;
        
        notifyType(resources[id], ctx, function (err) {
          config.saveConfig(resources, basepath, function (err) {
            ctx.done(err, ctx.body);
          });
        });
        break;
      case 'GET':
        if(id) {
          if (!resources[id]) {
            return next();
          }
          r = resources[id];
        } else {
          var r = Object.keys(resources).map(function(k, i) {
            var r = resources[k];
            r.id = k;
            return r;
          });
        }

        ctx.done(null, r);
        break;
      case 'DELETE':
        if (!resources[id]) {
          return next();
        }
        var r = resources[id];
        delete resources[id];
        config.saveConfig(resources, basepath, function(err) {
          notifyType(r, ctx, ctx.done);
        });
        break;
      default:
        next();
    }
  });
}

function notifyType(resource, ctx, fn) {
  if(ctx.server) {
    ctx.server.resources.forEach(function(r) {
      if(resource.type === r.settings.type && resource.path === r.settings.path) {
        r.changed && r.changed(ctx, fn);
        return false;
      }
    });
  } else {
    fn();
  }

}
