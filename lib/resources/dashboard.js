var util = require('util')
  , httpUtil = require('../util/http')
  , filed = require('filed')
  , Resource = require('../resource')
  , path = require('path')
  , debug = require('debug')('dashboard')
  , fs = require('fs')
  , ejs = require('ejs')
  , keys = require('../keys')
  , loadTypes = require('../type-loader')
  , async = require('async');

function Dashboard() {
  // internal resource
  this.internal = true;

  this.loadTypes = async.memoize(this.loadTypes);
  this.loadLayout = async.memoize(this.loadLayout);
  
  Resource.apply(this, arguments);
}
util.inherits(Dashboard, Resource);
module.exports = Dashboard;



Dashboard.prototype.handle = function(ctx, next) {
  var query = ctx.req.query;

  if (ctx.req.url === this.path) {
    return httpUtil.redirect(ctx.res, ctx.req.url + '/');
  } else if (ctx.url === '/__is-root') {
    ctx.done(null, {isRoot: ctx.req.isRoot});
  } else if (ctx.url.indexOf('/__custom') === 0) {
    this.serveCustomAsset(ctx, next);
  } else if (ctx.url.indexOf('.') !== -1) {
    filed(path.join(__dirname, 'dashboard', ctx.url)).pipe(ctx.res);  
  } else if (!ctx.req.isRoot && ctx.server.options.env !== 'development') {
    filed(path.join(__dirname, 'dashboard', 'auth.html')).pipe(ctx.res);  
  } else {
    this.render(ctx);
  }

};


Dashboard.prototype.serveCustomAsset = function(ctx, next) {
  var parts = ctx.url.split('/').filter(function(p) { return p; })
    , resourceTypePath = parts[1]
    , resource = this;

  resource.loadTypes(function(err, types) {
    var resourceTypeId
      , resourceType
      , dashboardPath
      , reqUrl = parts.slice(2).join('/');

    resourceTypeId = Object.keys(types).filter(function(t) { return t.toLowerCase() === resourceTypePath; })[0];

    if (resourceTypeId) {
      resourceType = types[resourceTypeId];
      dashboardPath = resourceType && resourceType.dashboard && resourceType.dashboard.path;
      if (dashboardPath) {
        return filed(path.join(dashboardPath, reqUrl)).pipe(ctx.res); 
      }
    }

    next();
  });
};

Dashboard.prototype.loadTypes = function(fn) {
  loadTypes(function(defaults, types) {
    Object.keys(defaults).forEach(function(key) {
      types[key] = defaults[key];
    });
    fn(null, types);
  });
};

Dashboard.prototype.render = function(ctx) {
  var self = this
    , appName = path.basename(path.resolve('./'))
    , env = ctx.server && ctx.server.options.env;

  async.parallel({
      layout: self.loadLayout
    , options: async.apply(self.loadPage.bind(self), ctx)
  }, function(err, results) {
    if (err) return ctx.done(err);

    var options = results.options || {}
      , layout = results.layout
      , render = {};

    var context = {
        resourceId: options.resourceId
      , resourceType: options.resourceType
      , page: options.page
      , basicDashboard: options.basicDashboard
      , events: options.events
      , appName: appName
      , env: env
    };

    render.bodyHtml = options.bodyHtml;

    try {
      var rendered = results.layout({context: context, render: render, scripts: options.scripts || [], css: options.css || null});  
      ctx.res.setHeader('Content-Type', 'text/html; charset=UTF-8');
      ctx.res.end(rendered);
    } catch (ex) {
      ctx.done(ex.message);
    }  
  });
};

Dashboard.prototype.loadLayout = function(fn) {
  var self = this;

  fs.readFile(path.join(__dirname, 'dashboard', 'index.ejs'), 'utf-8', function(err, layout) {
    if (err) return fn(err);
    var layoutTemplate = ejs.compile(layout, {open: '<{', close: '}>'}); //Avoid conlicts by using non-standard tags
    fn(null, layoutTemplate);
  });
};

Dashboard.prototype.loadPage = function(ctx, fn) {
  var parts = ctx.url.split('/').filter(function(p) { return p; })
    , resourceId
    , resource
    , resourceType
    , options = {}
    , self = this
    , dashboardPath
    , pagePath;

  if (parts.length) {
    resourceId = parts[0];
    resource = ctx.server.resources.filter(function(r) { return r.name === resourceId.toLowerCase() })[0];

    if (resource) {
      options.resourceId = resourceId;
      resourceType = resource.constructor;
      options.resourceType = resourceType.name;
      options.events = resourceType.events;
      options.scripts = [];

      var page = parts[1];

      if (!page && resourceType.dashboard && resourceType.dashboard.pages) {
        page = resourceType.dashboard.pages[0];
      } else if (!page) {
        page = 'index';
      }
      if (page === 'config') page = 'index';

      dashboardPath = resourceType.dashboard && resourceType.dashboard.path; 

      async.waterfall([
        function(fn) {
          if (dashboardPath) {
            pagePath = path.join(dashboardPath, page + '.html');
            fs.exists(pagePath, function(exists) {
              fn(null, exists);
            });  
          } else {
            fn(null, false);
          }
        },

        function(exists, fn) {
          if (exists) {
            self.loadAdvancedDashboard({
                pagePath: pagePath
              , dashboardPath: dashboardPath
              , page: page
              , resourceType: resourceType
              , options: options
            }, fn);
          } else {
            self.loadBasicDashboard({
                options: options
              , page: page
              , resourceType: resourceType
            }, fn);
          }
        }
      ], function(err) {
        fn(err, options);
      });

      debug("Editing resource %s of type %s", resourceId, resourceType.name);

      return;
    }
  }

  fn(); //blank page
};

Dashboard.prototype.loadAdvancedDashboard = function(data, fn) {
  var pagePath = data.pagePath
    , dashboardPath = data.dashboardPath
    , page = data.page
    , resourceType = data.resourceType
    , options = data.options;


  async.parallel({
    bodyHtml: function(fn) {
      fs.readFile(pagePath, 'utf-8', fn);
    },

    scripts: function(fn) {
      if (resourceType.dashboard.scripts) {
        resourceType.dashboard.scripts.forEach(function(s) {
          options.scripts.push('/__custom/' + resourceType.name.toLowerCase() + s);
        });
      }

      fs.exists(path.join(dashboardPath, 'js', page + '.js'), function(exists) {
        if (exists) {
          options.scripts.push('/__custom/' + resourceType.name.toLowerCase() + '/js/' + page + '.js');
        }

        fn();
      });
    },

    stylesheet: function(fn) {
      fs.exists(path.join(resourceType.dashboard.path, 'style.css'), function(exists) {
        if (exists) {
          options.css = '/__custom/' + resourceType.name.toLowerCase() + '/style.css';
        }

        fn();
      });
    }
  }, function(err, results) {
    if (err) return fn(err);

    options.bodyHtml = results.bodyHtml;

    if (page === 'index') page = 'config';
    options.page = page;

    fn(null, options);
  });
};

Dashboard.prototype.loadBasicDashboard = function(data, fn) {
  var options = data.options
    , page = data.page
    , resourceType = data.resourceType
    , dashboardPath = path.join(__dirname, 'dashboard');

  options.page = page;
  if (page === 'index') {
    options.page = 'config';
    if (resourceType.basicDashboard) {
      options.scripts.push('/js/basic.js');
      options.basicDashboard = resourceType.basicDashboard;
      fs.readFile(path.join(dashboardPath, 'basic.html'), function(err, bodyHtml) {
        options.bodyHtml = bodyHtml;
        fn(err);
      });
    } else {
      options.scripts.push('/js/default.js');
      fs.readFile(path.join(dashboardPath, 'default.html'), function(err, bodyHtml) {
        options.bodyHtml = bodyHtml;
        fn(err);
      });
    }
  } else if (page === 'events') {
    fs.readFile(path.join(dashboardPath, 'events.html'), function(err, bodyHtml) {
      options.bodyHtml = bodyHtml;
      fn(err);
    });
  } else {
    return fn();
  }
};