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
 *     FileResource.prototype.handle = function (ctx, next) {
 *       if (ctx.url === '/my-file.html') {
 *         fs.createReadStream('my-file.html').pipe(ctx.res);
 *       } else {
 *         next();
 *       }
 *     }
 *
 * @param {Object} settings
 * @param {Server} server
 * @api private
 */

function Resource(name, options) {
  this.name = name;
  this.path = '/' + name;
  options = this.options = options || {};
  this.config = options.config || {};
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
 * Handle an incoming request. This gets called by the router.
 * Call `next()` if the resource cannot handle the request.
 * Otherwise call `cxt.done(err, res)` when the resource
 * is ready to respond.
 *
 * Example:
 *
 *  Override the handle method to return a string:
 *
 *     function MyResource(settings) {
 *       Resource.apply(this, arguments);
 *     }
 *     util.inherits(MyResource, Resource);
 *
 *     MyResource.prototype.handle = function (ctx, next) {
 *       // respond with the file contents (or an error if one occurs)
 *       fs.readFile('myfile.txt', ctx.done);
 *     }
 *
 * @param {Context} ctx
 * @param {function} next
 */

Resource.prototype.handle = function (ctx, next) {
  ctx.end();
}

/**
 * Run a script in a domain with a given context.
 */



/*!
 * If true, generates utility functions for this resource in dpd.js
 */

Resource.prototype.clientGeneration = false;

/*!
 * If clientGeneration is true, generates utility functions that alias to get(path)
 */

Resource.prototype.clientGenerationGet = [];

/*!
 * If clientGeneration is true, generates utility functions that alias to do(path)
 */

Resource.prototype.clientGenerationExec = [];

Resource.toJSON = function() {
  return {
    type: this.name,
    defaultPath: '/my-resource'
  };
}

/*!
 * resource tag, for duck typing
 */

Resource.prototype.__resource__ = true;

module.exports = Resource;