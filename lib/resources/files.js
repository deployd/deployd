var validation = require('validation')
  , util = require('util')
  , filed = require('filed')
  , Resource = require('../resource')
  , path = require('path');

/**
 * A `Collection` proxies validates incoming requests then proxies them into a `Store`.
 *
 * Settings:
 *
 *   - `path`         the base path a resource should handle
 *   - `public`       the root folder to server public assets
 *
 * @param {Object} settings
 * @api private
 */

function Files(settings) {
  Resource.apply(this, arguments);
  if(settings.public) {
    this.public = settings.public;
  } else {
    throw new Error('public root folder location required when creating a file resource');
  }
}
util.inherits(Files, Resource);

Files.prototype.handle = function (ctx, next) {
  var f = filed(path.join(this.public, ctx.url))
  f.pipe(ctx.res);
  f.on('error', function(err) {
      // 404
      // give control back to router
      next();
    });
}

module.exports = Files;