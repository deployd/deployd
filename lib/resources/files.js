var validation = require('validation')
  , util = require('util')
  , send = require('send')
  , Resource = require('../resource')
  , path = require('path')
  , debug = require('debug')('files')
  , fs = require('fs')
  , url = require('url')
  , respond = require('doh').createResponder();

/**
 * A `Files` resource proxies incoming requests to the file system.
 *
 * Options:
 *
 *   - `config.public`       the root folder to server public assets
 *
 * @param {Object} options
 * @api private
 */

function Files(name, options) {
  Resource.apply(this, arguments);
  if(this.config['public']) {
    this['public'] = this.config['public'];
  } else {
    throw new Error('public root folder location required when creating a file resource');
  }
}
util.inherits(Files, Resource);

Files.prototype.handle = function (ctx, next) {
  if(ctx.req && ctx.req.method !== 'GET') return next();

  send(ctx.req, url.parse(ctx.url).pathname)
    .root(path.resolve(this['public']))
    .on('error', function (err) {
      ctx.res.statusCode = 404;
      respond('Resource Not Found', ctx.req, ctx.res);
    })
    .pipe(ctx.res);
};

module.exports = Files;