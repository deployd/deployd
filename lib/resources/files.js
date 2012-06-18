var validation = require('validation')
  , util = require('util')
  , filed = require('filed')
  , Resource = require('../resource')
  , path = require('path')
  , debug = require('debug')('files')
  , fs = require('fs');

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
  if(ctx.req.method !== 'GET') return next();
  if(ctx.url && ctx.url[ctx.url.length - 1] === '/') ctx.url + 'index.html';
  var fpath = path.join(this.public, ctx.url);
  fs.stat(fpath, function(err, stat) {
    if(err) {
      debug('couldnt find %s', fpath);
      next();
    } else {
      var f = filed(fpath)
      debug('%s %s', ctx.req && ctx.req.method, f.path);
      f.pipe(ctx.res); 
    }
  })
}

module.exports = Files;