var fs = require('fs')
  , util = require('util')
  , Resource = require('./resource')
  , Files = require('./resources/files')
  , config = require('./config-loader')
  , path = require('path');

exports.build = function (store, server) {
  var definitions = define(__dirname);

  store.find = function (query, fn) {
    if(typeof query == 'function') {
      fn = query;
      query = {};
    }
    
    store.__proto__.find.call(store, query, function (err, resources) {
      if(err) return fn(err);
      // build resources from data
      var result = [];

      if(resources) {
        var all = {};
        
        resources.forEach(function (resource) {
          var r = new definitions[resource.type](resource, server);
          
          // give all resources access
          // to each other
          resource.resources = all;
          if(resource.path) {
            var path = resource.path;
            if(path[0] === '') path = path.split('/')[1];
            all[path] = r;
          }
          
          result.push(r);
        })
      }
      
      // locked resources
      result.push(new InternalResources({path: '/__resources'}, server));
      result.push(new Files({path: '/', public: './public'}, server));

      fn(err, result);
    })
  }
  
  return store;
}

function define(dir) {
  var definitions = {};
  
  fs.readdirSync(dir + '/resources').forEach(function (path) {
    if(~path.indexOf('.js')) {
      var constructor = require(__dirname + '/resources/' + path);
      definitions[constructor.name] = constructor;
    }
  });

  return definitions;
}

function InternalResources(settings) {
  Resource.apply(this, arguments);
  if(settings) {
    this.store = settings.db && settings.db.createStore('resources');
    this.server = settings.server;
  }
}
util.inherits(InternalResources, Resource);
exports.InternalResources = InternalResources;

InternalResources.prototype.handle = function(ctx, next) {
  switch(ctx.req.method) {
    case 'POST':
    case 'PUT':
      this.server.defineResource(ctx.body, ctx.done);
    break;
    case 'GET':
      this.store.find(ctx.query, ctx.done);
    break;
    case 'DELETE':
      this.store.remove(ctx.query, ctx.done);
    break;
  }
}
