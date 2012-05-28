var db = require('./db');

/**
 * A `Router` routes incoming requests to the correct resource. It also initializes and
 * executes the correct methods on a resource.
 *
 * @param {Store} resources
 * @api private
 */

function Router(resources) {
  this.resources = resources;
}

/**
 * Using every resource, route to the first match (when `resource.match(url)` returns true).
 * Hand the resource the `req` and `res` by calling its `resource.handle(req, res)` method.
 *
 * If the router does not find a resource, respond with `404`.
 *
 * @param {ServerRequest} req
 * @param {ServerResponse} res
 */
 
Router.prototype.route = function (req, res) {
  var router = this;
  
  this.resources.find(function (err, resources) {
    var handler;
    resources.forEach(function (resource) {
      try {
        var matched = resource.match(req.url);
      } catch(e) {
        return res.error(e);
      }
      
      if(matched) {
        try {
          resource.handle(req, res);
        } catch(e) {
          return res.error(e);
        }
        handler = resource;
        return false;
      }
      
      if(!handler) res.error('resource not found', 404);
    });
  })
};