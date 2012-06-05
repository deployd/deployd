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
  , loadTypes = require('./type-loader');

/**
 * Builds a list of resources from config
 * 
 * @param {Array of Object} resourceConfig
 * @param {Server} server
 * @returns {Array of Resource} resources
 */
exports.build = function (resourceConfig, server) {
  var resourceConfig = resourceConfig || []
    , resources = [];

  resourceConfig.forEach(function(c) {
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
    var resource
      , id;
    
    if(ctx.url === '/types') {
      loadTypes(function(defaults, types) {
        Object.keys(types).forEach(function(key) {
          defaults[key] = types[key];
        });
        Object.keys(defaults).forEach(function(key) {
          if(excludedTypes[key]) return;
          var c = defaults[key]
            
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

    resources = resources || [];

    switch (ctx.req.method) {
      case 'POST':
        resource = ctx.body;
        resource.id = resources.push(ctx.body) - 1;
        config.saveConfig(resources, basepath, function(err) {
          ctx.done(resource);
        });
        break;
      case 'PUT':
        resource = ctx.body;
        delete resource.id;
        id = parseInt(ctx.url.replace('/', ''));
        if (isNaN(id) || !resources[id]) {
          return next();
        }
        resources[id] = ctx.body;
        config.saveConfig(resources, basepath, function(err) {
          ctx.done(resource);
        });
        break;
      case 'GET':
        ctx.done(resources.map(function(r, i) {
          r.id = i;
          return r;
        }));
        break;
      default:
        next();
    }
  });
}
