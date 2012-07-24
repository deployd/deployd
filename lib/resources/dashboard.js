var util = require('util')
  , httpUtil = require('../util/http')
  , filed = require('filed')
  , Resource = require('../resource')
  , path = require('path')
  , debug = require('debug')('dashboard')
  , fs = require('fs')
  , ejs = require('ejs')
  , keys = require('../keys');

function Dashboard() {
  // internal resource
  this.internal = true;
  
	Resource.apply(this, arguments);
}
util.inherits(Dashboard, Resource);
module.exports = Dashboard;

Dashboard.prototype.render = function(ctx, options) {
  var self = this
    , rendered;

  if (this.layout) {
    try {
      rendered = this.layout({});  
      ctx.res.setHeader('Content-Type', 'text/html');
      ctx.res.end(rendered);
    } catch (ex) {
      ctx.res.end(ex.message);
    }
    
  } else {
    fs.readFile(path.join(__dirname, 'dashboard', 'index.ejs'), 'utf-8', function(err, layout) {
      if (err) return ctx.done(err);
      self.layout = ejs.compile(layout, {open: '<{', close: '}>'}); //Avoid conlicts by using non-standard tags
      Dashboard.prototype.render.call(self, ctx, options);
    });
  }
};

Dashboard.prototype.auth = function(ctx) {
  filed(path.join(__dirname, 'dashboard', 'auth.html')).pipe(ctx.res);  
};

Dashboard.prototype.handle = function(ctx) {
  var query = ctx.req.query;
  debug(ctx.req.url);

  if (ctx.req.url === this.settings.path) {
    return httpUtil.redirect(ctx.res, ctx.req.url + '/');
  }

  if (ctx.url === '/is-root') {
    ctx.done(null, {isRoot: ctx.req.isRoot});
  } else if (ctx.url.indexOf('.') !== -1) {
    filed(path.join(__dirname, 'dashboard', ctx.url)).pipe(ctx.res);  
  } else {
    if (ctx.req.isRoot || ctx.server.options.env === 'development') {
      this.render(ctx);
    } else {
      this.auth(ctx);
    }
  }
  
}