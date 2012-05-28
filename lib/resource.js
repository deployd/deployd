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
 *     FileResource.prototype.match = function (url) {
 *       return url === '/my-file.html';
 *     }
 *
 *     FileResource.prototype.handle = function (req, res) {
 *       fs.createReadStream('my-file.html').pipe(res);
 *     }
 *
 * @param {Object} settings
 * @api private
 */

function Resource(settings) {
  this.settings = settings;
}

/**
 * Check if the resource path matches `url`. This is how the `Router` 
 * determines which `Resource` will `.handle()` the request.
 *
 * Note that only one resource can handle a request at a time.
 *
 * @param {String} url
 * @return {Boolean}
 * @api private
 */

Resource.prototype.match = function (url) {
  var settings = this.settings
    , path = settings && settings.path;
  
  if(url[0] !== '/') return false;
  
  var parsed = this.parse(url);
  if(url === path) return true;
  if(('/' + parsed.basepath) === path && parsed.parts.length < 3) return true;
  if(parsed.id === 'index.html' || parsed.id === 'index.htm') return true;
  return false;
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
 * Handle an incoming http `req` and `res`.
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
 *       res.end('My custon http resource');
 *     }
 *
 * @param {ServerRequest} req
 * @param {ServerResponse} res
 */

Resource.prototype.handle = function (req, res) {
  res.end();
}

module.exports = Resource;