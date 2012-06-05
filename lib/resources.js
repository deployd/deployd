var fs = require('fs')
  , util = require('util')
  , Resource = require('./resource')
  , Collection = require('./resources/collection')
  , UserCollection = require('./resources/user-collection')
  , Files = require('./resources/files')
  , config = require('./config-loader')
  , path = require('path');


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

  resources.push(new InternalResources({path: '/__resources'}, server));
  resources.push(new Files({path: '/', public: './public'}, server));

  return resources;
}

function InternalResources(settings) {
  settings.configPath = settings.configPath || './';
  Resource.apply(this, arguments);
  if(settings) {
    this.store = settings.db && settings.db.createStore('resources');
    this.server = settings.server;
  }
}
util.inherits(InternalResources, Resource);
exports.InternalResources = InternalResources;

InternalResources.prototype.handle = function(ctx, next) {
  var basepath = this.settings.configPath;
  config.loadConfig(basepath, function(err, resources) {
    var resource
      , id;
  
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

  //   switch(ctx.req.method) {
  //     case 'POST':
  //     case 'PUT':
  //       resources.forEach(function() {

  //       });
  //       next();
  //       this.server.defineResource(ctx.body, ctx.done);

  //       resources.push(ctx.body);
  //       ctx.done(ctx.body);
  //     break;
  //     case 'GET':
  //       this.store.find(ctx.query, ctx.done);
  //     break;
  //     case 'DELETE':
  //       this.store.remove(ctx.query, ctx.done);
  //     break;
  //   }
  // });
  
}
