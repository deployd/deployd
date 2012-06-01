var qs = require('querystring');

/**
 * A `Context` gives access to a `req` and `res` object when passed to `resource.handle()`,
 * as well as several utility functions and properties.
 *
 * Properties:
 * - req {HttpRequest} req
 * - res {HttpResponse} res
 * - url {String} The url of the request, stripped of the resource's base path
 * 
 * 
 * @param {Resource} resource
 * @param {HttpRequest} req
 * @param {HttpResponse} res
 */
function Context(resource, req, res) {
  this.url = req.url.slice(resource.settings.path.length);
  if (this.url.indexOf('/') !== 0) this.url = '/' + this.url;

  this.req = req;
  this.res = res;
}

/**
 * Alias for `ctx.res.end()`
 */
Context.prototype.end = function() {
  return this.res.end.apply(this.res, arguments);
};


/**
 * Attempts to parse the stream. Currently supports the following formats:
 * 
 * - application/json
 * - application/x-www-form-urlencoded (all values are strings)
 * 
 * @param {Function} callback (err, result)
 */
Context.prototype.parseBody = function(callback) {
  var mime = this.req.headers['content-type'] || ''
    , buf = '';

  mime = mime.split(';')[0]; //Just in case there's multiple mime types, pick the first

  this.req.on('data', function(chunk){ buf += chunk });
  this.req.on('end', function(){
    var parser = JSON;

    if (mime === 'application/x-www-form-urlencoded') {
      parser = qs;
    }

    try {
      callback(null, parser.parse(buf));
    } catch (ex) {
      callback(ex);
    }
  });
  
};

module.exports = Context;