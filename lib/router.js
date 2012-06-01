var db = require('./db');

/**
 * A `Router` routes incoming requests to the correct resource. It also initializes and
 * executes the correct methods on a resource.
 *
 * @param {Resource Array} resources
 * @api private
 */

function Router(resources) {
  this.resources = resources || [];
}

/**
 * Route requests to resources with matching root paths.
 * Hand the resource the `req` and `res` by calling its `resource.handle(req, res, next)` method.
 * If a resource calls `next()`, move on to the next resource.
 * 
 * If all matching resources call next(), or if the router does not find a resource, respond with `404`.
 *
 * @param {ServerRequest} req
 * @param {ServerResponse} res
 */
 
Router.prototype.route = function (req, res) {
  var router = this;

  var url = req.url;
  var resources = this.matchResources(url);

  //TODO: Handle edge case where next() is called more than once
  function callResource() {
    var resource = resources.shift();
    if (resource) {
      req.url = url.slice(resource.settings.path.length);
      if (req.url.indexOf('/') !== 0) req.url = '/' + req.url;
      resource.handle(req, res, callResource);  
    } else {
      res.status = 404;
      res.end("Not Found");
    }
  }

  callResource();
};


/**
 * Get resources whose base path matches the incoming URL, and order by specificness.
 * (So that /foo/bar will handle a request before /foo)
 *
 * @param {String} url
 * @param {Resource Array} matching resources
 * @api private
 */
Router.prototype.matchResources = function(url) {
  var router = this;
  if (!this.resources || !this.resources.length) return [];

  var result = this.resources.filter(function(d) {
    return url.match(router.generateRegex(d.settings.path));
  }).sort(function(d) {
    return (d.settings.path || '/').split('/').length;
  });
  return result;
}


var escapeRegExp  = /[-[\]{}()+?.,\\^$|#\s]/g;

/**
 * Generates a regular expression from a base path.
 *
 * @param {String} path
 * @return {RegExp} regular expression
 * @api private
 */
Router.prototype.generateRegex = function(path) {
  if (!path || path === '/') path = '';
  path = path.replace(escapeRegExp, '\\$&')
  return new RegExp('^' + path + '(?:[/?].*)?$');
}

module.exports = Router;