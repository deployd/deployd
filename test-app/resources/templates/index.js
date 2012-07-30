/**
 * example custom resource
 */

var Resource = require('deployd/lib/resource')
  , util = require('util')
  , request = require('request')
  , ejs = require('ejs')
  , fs = require('fs');

function Templates(settings) {
  this.path = settings.path;
  Resource.apply(this, arguments);
}
util.inherits(Templates, Resource);
module.exports = Templates;

Templates.prototype.handle = function (ctx, next) {
  var out = ejs.render(fs.readFileSync(this.path.replace('/', '') + ctx.url + '.ejs').toString(), {foo: 'bar'});
  
  ctx.res.end(out);
}

Templates.label = 'EJS Templates';
Templates.defaultPath = '/views';