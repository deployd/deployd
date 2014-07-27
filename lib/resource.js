var parse = require('url').parse
  , EventEmitter = require('events').EventEmitter
  , util = require('util')
  , path = require('path')
  , fs = require('fs')
  , Script = require('./script');

/**
 * A `Resource` handles incoming requests at a matched url. The base class is designed
 * to be extended by overriding methods that will be called by a `Router`.
 *
 * A `Resource` is also an `EventEmitter`. The following events are available.
 *
 *   - `changed`      after a resource config has changed
 *   - `deleted`      after a resource config has been deleted
 *
 * Options:
 *
 *   - `path`         the base path a resource should handle
 *   - `db`           the database a resource will use for persistence
 *
 * Example:
 *
 *   The following resource would respond with a file at the url `/my-file.html`.
 *
 *     function MyFileResource(name, options) {
 *       Resource.apply(this, arguments);
 *
 *       this.on('changed', function(config) {
 *         console.log('MyFileResource changed', config);
 *       });
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
 * @param {Object} options
 * @api private
 */

function Resource(name, options) {
  EventEmitter.call(this);
  this.name = name;
  this.path = '/' + name;
  options = this.options = options || {};
  this.config = options.config || {};
  this.events = {};
  var instance = this;
  if(this.constructor.external) {
    instance.external = {};
    Object.keys(this.constructor.external).forEach(function (key) {
      if(typeof instance.constructor.external[key] == 'function') {
        instance.external[key] = function () {
          instance.constructor.external[key].apply(instance, arguments);
        };
      }
    });
  }
}

/**
 * The external prototype for exposing methods over http and to dpd.js
 */

Resource.external = {};
util.inherits(Resource, EventEmitter);

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
};

Resource.prototype.load = function (fn) {
  var resource = this
    , eventNames = this.constructor && this.constructor.events
    , remaining = eventNames && eventNames.length
    , configPath = this.options && this.options.configPath
    , events = this.events = {};
  
  if(remaining) {
    eventNames.forEach(function(e) {
      var fileName = e.toLowerCase() + '.js'
        , filePath = path.join(configPath, fileName);

      Script.load(filePath, function (err, script) {
        if (script) {
          events[e] = script;
        }
        remaining--;
        if (remaining <= 0) {
          fn();
        }
      });
    });
  } else {
    fn();
  }
};

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
};

/**
 * Turn a resource constructor into an object ready
 * for JSON. It should atleast include the `type`
 * and `defaultPath`.
 */

Resource.toJSON = function() {
  return {
    type: this.name,
    defaultPath: '/my-resource'
  };
};

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

/*!
 * Resource tag, for duck typing
 */

Resource.prototype.__resource__ = true;

module.exports = Resource;