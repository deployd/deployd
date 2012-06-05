var fs = require('fs')
  , util = require('util')
  , Resource = require('./resource')
  , Files = require('./resources/files')
  , Dashboard = require('./resources/dashboard')
  , config = require('./config-loader')
  , debug = require('debug')('resources')
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
      result.push(new Files({path: '/', public: './public'}, server));
      result.push(new InternalResources({path: '/__resources'}, server));
      result.push(new Dashboard({path: '/dashboard'}, server));

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

function InternalResources(settings, server) {
  debug('init');
  Resource.apply(this, arguments);
  this.store = server && server.createStore('resources');
  this.server = server;
}
util.inherits(InternalResources, Resource);
exports.InternalResources = InternalResources;

InternalResources.prototype.handle = function(ctx, next) {
  if(ctx.url === '/types') {
    // TODO refactor with new config
    this.server.resources.find(function() {
      ctx.done(null, {

        Collection: {
          defaultPath: '/my-objects',
          require: './types/collection'
        },
        
        UserCollection: {
          label: 'Users Collection',
          defaultPath: '/users',
          require: './types/user-collection',
          properties: {
            email: {
              description: 'the unique email of the user',
              type: 'string',
              pattern: "[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?",
              required: true,
              unique: true,
              minLength: 5,
              order: 0
            },
            password: {
              description: "the user's password",
              type: 'string',
              required: true,
              minLength: 5,
              order: 1
            }
          }
        }

      })
    })
    return;
  }

  debug('hanlding');
  switch(ctx.req.method) {
    case 'POST':
    case 'PUT':
      this.server.defineResource(ctx.body, ctx.done);
    break;
    case 'GET':
      debug('finding resources that match', ctx.query);
      this.store.find(ctx.query, ctx.done);
    break;
    case 'DELETE':
      this.store.remove(ctx.query, ctx.done);
    break;
  }
}
