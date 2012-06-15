var util = require('util')
  , httpUtil = require('../util/http')
  , filed = require('filed')
  , Resource = require('../resource')
  , path = require('path')
  , debug = require('debug')('dashboard');

function Dashboard() {
  // internal resource
  this.internal = true;
  
	Resource.apply(this, arguments);
}
util.inherits(Dashboard, Resource);
module.exports = Dashboard;

Dashboard.prototype.handle = function(ctx) {
  debug(ctx.req.url);

  if (ctx.req.url === this.settings.path) {
    return httpUtil.redirect(ctx.res, ctx.req.url + '/');
  }
    
  filed(path.join(path.join(__dirname, 'dashboard'), ctx.url)).pipe(ctx.res);  
}