var Resource = require('../resource')
  , util = require('util')
  , path = require('path')
  , filed = require('filed');

function ClientLib(settings) {
  Resource.apply(this, arguments);
}
util.inherits(ClientLib, Resource);

ClientLib.prototype.handle = function (ctx, next) {
  if (ctx.url === '/') {
    var f = filed(path.join(__dirname, '../../clib/dpd.js'));
    f.pipe(ctx.res);
  } else {
    next();
  }
}

module.exports = ClientLib;