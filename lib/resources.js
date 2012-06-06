var fs = require('fs')
  , util = require('util')
  , Resource = require('./resource')
  , Collection = require('./resources/collection')
  , UserCollection = require('./resources/user-collection')
  , Files = require('./resources/files')
  , Dashboard = require('./resources/dashboard')
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
exports.build = function (resourceConfig, server) {
  var resourceConfig = resourceConfig || {}
    , resources = [];

  Object.keys(resourceConfig).forEach(function(k) {
    var c = resourceConfig[k];

    //TODO: make this extensible
    c.server = server;
    c.db = server.db;

    if (c.type === 'Collection') {
      resources.push(new Collection(c));
    } else if (c.type === 'UserCollection') {
      resources.push(new UserCollection(c));
    }
  });

  resources.push(new Files({path: '/', public: './public'}, server));
  resources.push(new InternalResources({path: '/__resources'}, server));
  resources.push(new Dashboard({path: '/dashboard'}, server));

  return resources;
}

function InternalResources(settings, server) {
  settings.configPath = settings.configPath || './';
  Resource.apply(this, arguments);
  this.store = server && server.createStore && server.createStore('resources');
  this.server = server;
}
util.inherits(InternalResources, Resource);
exports.InternalResources = InternalResources;

var excludedTypes = {
  Dashboard: 1,
  Files: 1
};

InternalResources.prototype.handle = function(ctx, next) {
  var basepath = this.settings.configPath;

  config.loadConfig(basepath, function(err, resources) {
    // TODO handle file system ENOENT, send all else to ctx.done
    // if(err) return ctx.done(err);

    var resource
      , id = ctx.url && parseInt(ctx.url.replace('/', '').replace('r', ''))
    
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

        })
        ctx.done(defaults);
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
        config.saveConfig(resources, basepath, function(err) {
          ctx.done(err, resource);
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
        delete resources[id];
        config.saveConfig(resources, basepath, function(err) {
          ctx.done();
        });
        break;
      default:
        next();
    }
  });
}
