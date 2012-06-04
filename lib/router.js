var db = require('./db')
  , Context = require('./context')
  , escapeRegExp  = /[-[\]{}()+?.,\\^$|#\s]/g;

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
 * Generate a `ctx` object and hand it to the resource, along with the `res` by calling its `resource.handle(ctx, next)` method.
 * If a resource calls `next()`, move on to the next resource.
 * 
 * If all matching resources call next(), or if the router does not find a resource, respond with `404`.
 *
 * @param {ServerRequest} req
 * @param {ServerResponse} res
 * @api public
 */
 
Router.prototype.route = function (req, res) {
  var router = this
    , url = req.url
    , resources = this.matchResources(url)
    , i = 0;

  //TODO: Handle edge case where next() is called more than once
  function nextResource() {
    var resource = resources[i++]
      , ctx;
    
    if (resource) {
      ctx = new Context(resource, req, res);
      process.nextTick(function () {
        resource.handle(ctx, nextResource);
      });
    } else {
      res.statusCode = 404;
      res.end("Not Found");
    }
  }

  nextResource();
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
  var router = this
    , result;

  if (!this.resources || !this.resources.length) return [];

  result = this.resources.filter(function(d) {
    return url.match(router.generateRegex(d.settings.path));
  }).sort(function(d) {
    return (d.settings.path || '/').split('/').length;
  });
  return result;
}




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