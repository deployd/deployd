var Resource = require('../resource');

module.exports = Resource.extend("InternalModules", {

  internal: true,

  init: function() {
    this.configFile = this.config || './app.dpd';
  },

  handle: function(ctx, next) {
    if (!ctx.req.isRoot) {
      ctx.done({statusCode: 401, message: "Not Allowed"});
      return;
    }  
    
    Resource.prototype.handle.apply(this, arguments);  
  },

  exclude: {
    Collection: 1,
    UserCollection: 1,
    internal: 1
  },

  get: function(ctx, next) {
    var resource = this;
    var modules = this.server.modules;

    modules = Object.keys(modules).filter(function(k) {
      return !resource.exclude[k];
    }).map(function(k) {
      var m = modules[k];
      console.log(m);
      return {
        id: m.id
      };
    }).sort(function(a, b) {
      return a.id.localeCompare(b.id);
    });

    ctx.done(null, modules);
  }

});