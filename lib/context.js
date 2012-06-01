

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

module.exports = Context;