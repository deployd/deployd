var validation = require('validation')
  , util = require('util')
  , send = require('send')
  , Resource = require('../resource')
  , path = require('path')
  , debug = require('debug')('files')
  , fs = require('fs')
  , url = require('url')
  , respond = require('doh').createResponder()
  , q = require('q');

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
}
util.inherits(Files, Resource);

Files.prototype.load = function(fn) {
  var resource = this;
  var defaultFolder = path.join((this.options.dir || './'), 'public');

  var server = this.server;

  var folderQ = q.fcall(function() {
    if (server.options && typeof server.options.env === 'string') {
      var altPublic = './public-' + server.options.env;  
      var altPublicExistsQ = q.defer();
      fs.exists(altPublic, function(exists) {
        altPublicExistsQ.resolve(exists);
      });
      return altPublicExistsQ.promise.then(function(exists) {
        if (exists) {
          return altPublic;
        } else {
          return defaultFolder;
        }
      });
    } else {
      return defaultFolder;
    } 
  });

  folderQ.then(function(folder) {
    resource['public'] = folder;
    fn();
  }, function(err) {
    fn(err);
  });
};

Files.prototype.handle = function (ctx, next) {
  if(ctx.req && ctx.req.method !== 'GET') return next();

  ctx.verifyPermissions(function () {
    send(ctx.req, url.parse(ctx.url).pathname)
      .root(path.resolve(this['public']))
      .on('error', function (err) {
        ctx.res.statusCode = 404;
        respond('Resource Not Found', ctx.req, ctx.res);
      })
      .pipe(ctx.res);
  }.bind(this));
};


Files.prototype.getDefaultPermissions = function (ctx) {
  return {'reading a file': true};
}

Files.prototype.getRequiredPermissions = function (ctx) {
  // a resource should return an object defining 
  // required permissions for the given context
  return {'reading a file': true};
}


module.exports = Files;