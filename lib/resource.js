var parse = require('url').parse;

/**
 * A `Resource` handles incoming requests at a matched url. The base class is designed 
 * to be extended by overriding methods that will be called by a `Router`.
 *
 * Settings:
 *
 *   - `path`         the base path a resource should handle
 *   - `db`           the database a resource will use for persistence
 *
 * Example:
 *
 *   The following resource would respond with a file at the url `/my-file.html`.
 *
 *     function MyFileResource(settings) {
 *       Resource.apply(this, arguments);
 *     }
 *     util.inherits(MyFileResource, Resource);

 *
 *     FileResource.prototype.handle = function (req, res, next) {
 *       if (req.url === '/my-file.html') {
 *         fs.createReadStream('my-file.html').pipe(res);
 *       } else {
 *         next();
 *       }
 *     }
 *
 * @param {Object} settings
 * @api private
 */

function Resource(settings) {
  this.settings = settings || {};
}

/**
 * Parse the `url` into a basepath, query, and parts.
 *
 * @param {String} url
 * @return {Object}
 * @api private
 */

Resource.prototype.parse = function (url) {
  var parsed = parse(url, true)
    , pathname = parsed.pathname
    , parts = parsed.parts = pathname.split('/');
  
  // remove empty
  parts.shift();
  parsed.basepath = parts[0];
  
  // remove empty trailing slash part
  if(parts[parts.length - 1] === '') parts.pop();
  
  // the last part is always the identifier
  if(parts.length > 1) parsed.id = parts[parts.length - 1];
  
  if(parsed.query.q && parsed.query.q[0] === '{' && parsed.query.q[parsed.query.q.length - 1] === '}') {
    parsed.query.q = JSON.parse(parsed.query.q);
  }
  
  return parsed;
}

/**
 * Handle an incoming http `req` and `res`. This gets called by the router.
 * Call `next()` if the resource cannot handle the request.
 * 
 * Note: `req.url` will not contain the resource's base path.
 *
 * Example:
 *
 *  Override the handle method to change how a resource handles HTTP.
 *
 *     function MyResource(settings) {
 *       Resource.apply(this, arguments);
 *     }
 *     util.inherits(MyResource, Resource);
 *
 *     MyResource.prototype.handle = function (req, res) {
 *       res.end('My custom http resource');
 *     }
 *
 * @param {ServerRequest} req
 * @param {ServerResponse} res
 * @param {function} next
 */

Resource.prototype.handle = function (req, res) {
  res.end();
}

module.exports = Resource;