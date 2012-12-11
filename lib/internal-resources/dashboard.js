var util = require('util')
  , httpUtil = require('../util/http')
  , filed = require('filed')
  , Resource = require('../resource')
  , path = require('path')
  , debug = require('debug')('dashboard')
  , fs = require('fs')
  , ejs = require('ejs')
  , keys = require('../keys')
  , async = require('async')
  , q = require('q');

function Dashboard() {
  // internal resource
  this.internal = true;

  this.loadLayout = async.memoize(this.loadLayout);
  this.loadLayout(function() {}); // Start loading it right away
  
  Resource.apply(this, arguments);
}
util.inherits(Dashboard, Resource);
module.exports = Dashboard;



Dashboard.prototype.handle = function(ctx, next) {
  var query = ctx.req.query;

  if (ctx.req.url === this.path) {
    return httpUtil.redirect(ctx.res, ctx.req.url + '/');
  } else if (ctx.url === '/deployments') {
    this.renderDeployments(ctx);
  } else if (ctx.url === '/__is-root') {
    ctx.done(null, {isRoot: ctx.req.isRoot});
  } else if (ctx.url.indexOf('/__resource-custom') === 0) {
    this.serveResourceCustomAsset(ctx, next);
  } else if (ctx.url.indexOf('/__module-custom') === 0) {
    this.serveModuleCustomAsset(ctx, next);
  } else if (ctx.url.indexOf('.') !== -1) {
    filed(path.join(__dirname, 'dashboard', ctx.url)).pipe(ctx.res);  
  } else if (!ctx.req.isRoot && ctx.server.options.env !== 'development') {
    filed(path.join(__dirname, 'dashboard', 'auth.html')).pipe(ctx.res);  
  } else if (ctx.url.indexOf('/modules') === 0) {
    this.renderModulePage(ctx);
  } else {
    this.renderResourcePage(ctx);
  }
};


Dashboard.prototype.serveResourceCustomAsset = function(ctx, next) {
  var parts = ctx.url.split('/').filter(function(p) { return p; })
    , resourceTypePath = parts[1]
    , resource = this;

  var types = this.server.resourceTypes;

  var resourceType
    , dashboardPath
    , reqUrl = parts.slice(2).join('/');

  if (resourceTypePath) {
    resourceType = types[resourceTypePath];
    dashboardPath = resourceType && resourceType.prototype.dashboard && resourceType.prototype.dashboard.path;
    if (dashboardPath) {
      return filed(path.join(dashboardPath, reqUrl)).pipe(ctx.res); 
    }
  }

  next();
};

Dashboard.prototype.serveModuleCustomAsset = function(ctx, next) {
  var parts = ctx.url.split('/').filter(function(p) { return p; })
    , moduleId = parts[1]
    , dashboard = this
    , reqUrl = parts.slice(2).join('/');

  var module = this.server.modules[moduleId];

  if (module) {
    var dashboardPath = module.dashboard && module.dashboard.path;
    if (dashboardPath) {
      return filed(path.join(dashboardPath, reqUrl)).pipe(ctx.res); 
    }
  }

  next();
};

Dashboard.prototype.render = function(ctx, options) {  
  var self = this;

  var layoutQ = q.ninvoke(self, 'loadLayout');

  var options = options || {};

  var context = options.context || {};

  context.env = ctx.server && ctx.server.options.env;
  context.appName = path.basename(path.resolve('./'));
  
  var render = {
    bodyHtml: options.bodyHtml
  };

  layoutQ.then(function(layout) {
    try {
      var rendered = layout({context: context, render: render, scripts: options.scripts || [], css: options.css || null});  
      ctx.res.setHeader('Content-Type', 'text/html; charset=UTF-8');
      ctx.res.end(rendered);
    } catch (ex) {
      ctx.done(ex.message);
    } 
  });
};

Dashboard.prototype.renderResourcePage = function(ctx) {
  var self = this;

  self.loadResourcePage(ctx, function(err, options) {
    if (err) return ctx.done(ex.message);
    options = options || {};

    self.render(ctx, {
        bodyHtml: options.bodyHtml
      , scripts: options.scripts
      , css: options.css
      , context: {
          resourceId: options.resourceId
        , resourceType: options.resourceType
        , page: options.page
        , basicDashboard: options.basicDashboard
        , events: options.events
      }
    });
  });
};

Dashboard.prototype.renderModulePage = function(ctx) {
  var dashboard = this 
    , parts = ctx.url.split('/').filter(function(p) { return p; })
    , moduleId = parts[1]
    , module = dashboard.server.modules[moduleId];

  if (module) {
    var options = {
        page: parts[2]
      , moduleId: moduleId
      , module: module
      , dashboard: module.dashboard
      , basicDashboard: module.basicDashboard
      , assetPath: '/__module-custom/' + moduleId
    }
    dashboard.loadPage(ctx, options, function(err, renderOptions) {
      if (err) return ctx.done(err);
      renderOptions.context = {
          moduleId: moduleId
        , page: options.page
        , basicDashboard: module.basicDashboard
      };
      dashboard.render(ctx, renderOptions);
    });
  } else {
    dashboard.render(ctx);
  }
};

Dashboard.prototype.renderDeployments = function(ctx) {
  var self = this;

  var deploymentsPageQ = q.ninvoke(fs, 'readFile', path.join(__dirname, 'dashboard/deployments.html'), 'utf-8');

  deploymentsPageQ.then(function(deploymentsPage) {
    self.render(ctx, {
      context: {
          page: 'Deployments'
        , module: 'App'
      },
      bodyHtml: deploymentsPage,
      scripts: ['/js/deployments.js'],
      css: null
    });
  }, function(err) {
    ctx.done(err);
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

Dashboard.prototype.loadResourcePage = function(ctx, fn) {
  var parts = ctx.url.split('/').filter(function(p) { return p; })
    , resourceId
    , resource
    , resourceType
    , options = {};

  if (parts.length) {
    resourceId = parts[0];
    resource = ctx.server.resources.filter(function(r) { 
      return r.name === resourceId.toLowerCase() 
    })[0]; 

    if (resource) {
      options.resourceId = resourceId;
      resourceType = resource.constructor;
      options.resourceType = resourceType.id;
      options.events = resource.eventNames;
      options.dashboard = resource.dashboard;
      options.basicDashboard = resource.basicDashboard;
      options.page = parts[1];
      options.assetPath = '/__resource-custom/' + resourceType.id

      this.loadPage(ctx, options, fn);

      return;
    }
  }

  fn();
};

Dashboard.prototype.loadPage = function(ctx, options, fn) {
  var self = this
    , dashboardPath
    , pagePath
    , page;

  if (typeof options == 'function') {
    fn = options;
    options = undefined;
  }
  options = options || {};

  page = options.page;

  if (!page && options.dashboard && options.dashboard.pages) {
    page = options.dashboard.pages[0];
  } else if (!page) {
    page = 'index';
  }
  if (page === 'config') page = 'index';

  options.scripts = options.scripts || [];

  dashboardPath = options.dashboard && options.dashboard.path; 

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
          , assetPath: options.assetPath
          , options: options
          , dashboard: options.dashboard
        }, fn);
      } else {
        self.loadBasicDashboard({
            options: options
          , page: page
          , basicDashboard: options.basicDashboard
        }, fn);
      }
    }
  ], function(err) {
    fn(err, options);
  });

    // debug("Editing resource %s of type %s", resourceId, resourceType.id);
};

Dashboard.prototype.loadAdvancedDashboard = function(data, fn) {
  var pagePath = data.pagePath
    , dashboardPath = data.dashboardPath
    , page = data.page
    , resourceType = data.resourceType
    , resource = data.resource
    , options = data.options;


  async.parallel({
    bodyHtml: function(fn) {
      fs.readFile(pagePath, 'utf-8', fn);
    },

    scripts: function(fn) {
      if (data.dashboard.scripts) {
        data.dashboard.scripts.forEach(function(s) {
          options.scripts.push(data.assetPath + s);
        });
      }

      fs.exists(path.join(dashboardPath, 'js', page + '.js'), function(exists) {
        if (exists) {
          options.scripts.push(data.assetPath + '/js/' + page + '.js');
        }

        fn();
      });
    },

    stylesheet: function(fn) {
      fs.exists(path.join(dashboardPath, 'style.css'), function(exists) {
        if (exists) {
          options.css = data.assetPath + '/style.css';
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
    , dashboardPath = path.join(__dirname, 'dashboard');

  options.page = page;
  if (page === 'index') {
    options.page = 'config';
    if (data.basicDashboard) {
      options.scripts.push('/js/basic.js');
      options.basicDashboard = data.basicDashboard;
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