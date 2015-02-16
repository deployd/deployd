var internalClient = require('./internal-client')
  , debug = require('debug')('context')
  , respond = require('doh').createResponder();

/**
 * A `Context` gives access to a `req` and `res` object when passed to `resource.handle()`,
 * as well as several utility functions and properties.
 *
 * Properties:
 * - **req** `ServerRequest` req
 * - **res** `ServerResponse` res
 * - **url** `String` The url of the request, stripped of the resource's base path
 * - **body** `Object` The body of the request, if the body is JSON or url encoded
 * - **query** `Object` The query of the request
 * 
 * @param {Resource} resource
 * @param {HttpRequest} req
 * @param {HttpResponse} res
 * @param {Server} server
 */
 
function Context(resource, req, res, server) {
  var ctx = this;
  this.url = req.url.slice(resource.path.length).split('?')[0];
  if (this.url.indexOf('/') !== 0) this.url = '/' + this.url;

  this.req = req;
  this.res = res;
  this.body = req.body;
  this.query = req.query || {};
  this.server = server;
  this.session = req.session;
  this.method = req && req.method;
  
  // always bind done to this
  var done = this.done;
  this.done = function() {
    done.apply(ctx, arguments);
  };

  if ((this.query && typeof this.query.$limitRecursion !== 'undefined') || (this.body && typeof this.body.$limitRecursion !== 'undefined')) {
    var recursionLimit = this.query.$limitRecursion || this.body.$limitRecursion || 0;
    req.stack = req.stack || [];
    req.stack.recursionLimit = recursionLimit;
  }

  this.dpd = internalClient.build(server, req.session, req.stack);
}

/**
 * Alias for `ctx.res.end()`
 */
Context.prototype.end = function() {
  return this.res.end.apply(this.res, arguments);
};

/**
 * Continuous callback sugar for easily calling res.end().
 *
 * Example:
 *     
 *     // instead of
 *     store.find({foo: 'bar'}, function(err, res) {
 *       if(err) return res.end(JSON.stringify(err));
 *       res.end(JSON.stringify(res));   
 *     })
 * 
 *     // you can just do
 *     store.find({foo: 'bar'}, ctx.done);
 *
 * @param {Error} err
 * @param {Object} response
 */

Context.prototype.done = function(err, res) {
  var body = res
    , type = 'application/json';
  
  // default response
  var status = this.res.statusCode = this.res.statusCode || 200; 

  if(err) {
    debug('%j', err);
    if(status < 400) this.res.statusCode = 400;
    if(err.statusCode) this.res.statusCode = err.statusCode;
    respond(err, this.req, this.res);
  } else {
    if(typeof body == 'object') {
      body = JSON.stringify(body);
    } else {
      type = 'text/html; charset=utf-8';
    }

    try {
      this.res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      this.res.setHeader("Pragma", "no-cache");
      this.res.setHeader("Expires", "0");
      if(status != 204 && status != 304) {
        if(body) {
          this.res.setHeader('Content-Length', Buffer.isBuffer(body)
               ? body.length
               : Buffer.byteLength(body));
        }
        this.res.setHeader('Content-Type', type);
        this.res.end(body);
      } else {
        this.res.end();
      }
    } catch(e) {
      console.error(e);
    }
  }
};

module.exports = Context;