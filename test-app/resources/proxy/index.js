/**
 * example custom resource
 */

var Resource = require('deployd/lib/resource')
  , util = require('util')
  , request = require('request');

function Proxy(settings) {
  Resource.apply(this, arguments);
  this.remote = settings.remote;
}
util.inherits(Proxy, Resource);
module.exports = Proxy;

Proxy.prototype.handle = function (ctx, next) {
  if(ctx.req && ctx.req.method !== 'GET') return next();
  request.get(this.remote + ctx.url).pipe(ctx.res);
}

Proxy.label = 'HTTP Proxy';
Proxy.defaultPath = '/proxy';

Proxy.basicDashboard = {
  settings: [{
    name: "remote"
    , type: "text" //"textarea" or "number" works as well
    , description: "The remote server to proxy to."
  }]
}