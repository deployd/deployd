var util = require('util')
  , httpUtil = require('../util/http')
  , filed = require('filed')
  , Resource = require('../resource')
  , path = require('path')
  , debug = require('debug')('dashboard')
  , fs = require('fs')
  , ejs = require('ejs')
  , keys = require('../keys')
  , loadTypes = require('../type-loader');

function Dashboard() {
  // internal resource
  this.internal = true;
  
	Resource.apply(this, arguments);
}
util.inherits(Dashboard, Resource);
module.exports = Dashboard;

Dashboard.prototype.render = function(ctx, options) {
  var self = this
    , rendered
    , resourceTypes
    , layout = this.layout;

  options = options || {};

  var context = {
      resourceId: options.resourceId
    , resourceType: options.resourceType
    , page: options.page
  };

  if (layout) {
    var finish = function(context, render) {
      try {
        rendered = layout({context: context, render: render, scripts: options.scripts || []});  
        ctx.res.setHeader('Content-Type', 'text/html');
        ctx.res.end(rendered);
      } catch (ex) {
        ctx.res.end(ex.message);
      }  
    }

    if (options.pagePath) {
      fs.readFile(options.pagePath, 'utf-8', function(err, file) {
        if (err) return ctx.done(err);
        finish(context, {bodyHtml: file});
      });
    } else {
      finish(context, {});
    } 
    
  } else {
    fs.readFile(path.join(__dirname, 'dashboard', 'index.ejs'), 'utf-8', function(err, layout) {
      if (err) return ctx.done(err);
      self.layout = ejs.compile(layout, {open: '<{', close: '}>'}); //Avoid conlicts by using non-standard tags
      Dashboard.prototype.render.call(self, ctx, options);

    });
  }
};

Dashboard.prototype.route = function(ctx) {
  var parts = ctx.url.split('/').filter(function(p) { return p; })
    , resourceId
    , resource
    , resourceType
    , page
    , pagePath
    , scripts = []
    , render = this.render;

  if (parts.length) {
    resourceId = parts[0];
    resource = ctx.server.resources.filter(function(r) { return r.settings && r.settings.path === '/' + resourceId.toLowerCase() })[0];

    if (resource) {
      resourceType = resource.constructor;
      if (resourceType.dashboard) {
        if (resourceType.dashboardPages) {
          page = parts[1] || resourceType.dashboardPages[0].toLowerCase();
        } else {
          page = 'index';
        }

        if (resourceType.dashboard.scripts) {
          resourceType.dashboard.scripts.forEach(function(s) {
            scripts.push('/__custom/' + resourceType.name.toLowerCase() + s);
          });
        }

        pagePath = path.join(resourceType.dashboard.path, page + '.html');

        fs.stat(path.join(resourceType.dashboard.path, 'js', page + '.js'), function(err, stat) {
          if (stat) {
            scripts.push('/__custom/' + resourceType.name.toLowerCase() + '/js/' + page + '.js');
          }

          render(ctx, {
              resourceId: resourceId
            , resourceType: resourceType.name
            , page: page
            , pagePath: pagePath
            , scripts: scripts
          });
        });

      } else {
        pagePath = path.join(__dirname, 'dashboard', 'default.html');
        scripts.push('/js/default.js');

        this.render(ctx, {
            resourceId: resourceId
          , resourceType: resourceType.name
          , page: page
          , pagePath: pagePath
          , scripts: scripts
        });
      }

    } else {
      this.render(ctx); 
    }
    
  } else {
    this.render(ctx);  
  }
};

Dashboard.prototype.serve = function(ctx, next) {
  var parts = ctx.url.split('/').filter(function(p) { return p; })
    , resourceTypePath = parts[1];

  loadTypes(function(defaults, types) {
    var resourceTypeId
      , resourceType
      , dashboardPath
      , reqUrl = parts.slice(2).join('/');

    Object.keys(defaults).forEach(function(key) {
      types[key] = defaults[key];
    });

    resourceTypeId = Object.keys(types).filter(function(t) { return t.toLowerCase() === resourceTypePath; })[0];

    if (resourceTypeId) {
      resourceType = types[resourceTypeId];
      dashboardPath = resourceType && resourceType.dashboard && resourceType.dashboard.path;
      if (dashboardPath) {
        filed(path.join(dashboardPath, reqUrl)).pipe(ctx.res); 
      } else {
        next();
      }
    } else {
      next();
    }
  });

  //   , resourceType = ctx.server.resources.filter(function(r) { return r.name === resourceId.toLowerCase() })[0];
  //   , dashboardPath = resourceType && resourceType.dashboard && resourceType.dashboard.path
  //   , reqUrl = parts.slice(2).join('/');

  // filed(path.join(dashboardPath, reqUrl)).pipe(ctx.res);  
}

Dashboard.prototype.auth = function(ctx) {
  filed(path.join(__dirname, 'dashboard', 'auth.html')).pipe(ctx.res);  
};

Dashboard.prototype.handle = function(ctx, next) {
  var query = ctx.req.query
    , parts;

  if (ctx.req.url === this.settings.path) {
    return httpUtil.redirect(ctx.res, ctx.req.url + '/');
  }

  if (ctx.url === '/__is-root') {
    ctx.done(null, {isRoot: ctx.req.isRoot});
  } else if (ctx.url.indexOf('/__custom') === 0) {
    this.serve(ctx, next);
  } else if (ctx.url.indexOf('.') !== -1) {
    filed(path.join(__dirname, 'dashboard', ctx.url)).pipe(ctx.res);  
  } else {

    if (ctx.req.isRoot || ctx.server.options.env === 'development') {
      this.route(ctx);
    } else {
      this.auth(ctx);
    }
  }
  
}