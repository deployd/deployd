var Resource = require('../resource')
  , q = require('q')
  , fs = require('fs')
  , qutil = require('../util/qutil');

module.exports = Resource.extend("InternalModules", {

  internal: true,

  init: function() {
    this.configFile = this.config.configFile || './app.dpd';
  },

  handle: function(ctx, next) {
    if (!ctx.req.isRoot) {
      ctx.done({statusCode: 401, message: "Not Allowed"});
      return;
    }  
    
    this.__super.handle.apply(this, arguments);  
  },

  exclude: {
    Collection: 1,
    UserCollection: 1,
    internal: 1,
    'global-events': 1
  },

  getModuleConfig: function(moduleId, fn) {
    var appFileQ = q.ninvoke(fs, 'readFile', this.configFile, 'utf-8').then(function(appFile) {
      return JSON.parse(appFile);
    });

    var moduleConfigQ = appFileQ.then(function(appFile) {
      var modules = appFile.modules || {};
      return modules[moduleId] || {};
    });

    qutil.qcallback(moduleConfigQ, fn);
  },

  get: function(ctx, next) {
    var resource = this;

    if (ctx.urlParts.length > 0) {

      var moduleId = ctx.urlParts[0];

      resource.getModuleConfig(moduleId, ctx.done);


    } else {
      var modules = this.server.modules;

      modules = Object.keys(modules).filter(function(k) {
        return !resource.exclude[k];
      }).map(function(k) {
        var m = modules[k];
        return {
            id: m.id
          , dashboardPages: m.dashboard && m.dashboard.pages
        };
      }).sort(function(a, b) {
        return a.id.localeCompare(b.id);
      });

      ctx.done(null, modules);      
    }
  },

  put: function(ctx, next) {
    this.post.apply(this, arguments);
  },

  post: function(ctx, next) {
    var resource = this;
    var moduleId = ctx.urlParts[0];
    if (!moduleId) {
      return ctx.done("You must provide a module id");
    }

    if (!ctx.body) {
      return ctx.done("You must provide a body");
    }


    // Synchronous because of potential race conditions
    try {
      var currentConfig = JSON.parse(fs.readFileSync(resource.configFile, 'utf-8'));
      currentConfig.modules = currentConfig.modules || {};

      if (ctx.body.$setAll) {
        delete ctx.body.$setAll;
        currentConfig.modules[moduleId] = ctx.body;
      } else {
        if (!currentConfig.modules[moduleId]) {
          currentConfig.modules[moduleId] = {};
        }
        var config = currentConfig.modules[moduleId];
        Object.keys(ctx.body).forEach(function(k) {
          config[k] = ctx.body[k];
        });
      }

      fs.writeFileSync(resource.configFile, JSON.stringify(currentConfig, null, '\t'), 'utf-8');
      ctx.done(null, currentConfig.modules[moduleId]);
    } catch (ex) {
      return ctx.done(ex);
    }
  }

});