var qs = require('querystring')
  , parseUrl = require('url').parse;

/**
 * A `Context` gives access to a `req` and `res` object when passed to `resource.handle()`,
 * as well as several utility functions and properties.
 *
 * Properties:
 * - req {HttpRequest} req
 * - res {HttpResponse} res
 * - url {String} The url of the request, stripped of the resource's base path
 * - body {Object} The body of the request, if the body is JSON or url encoded
 * - query {Object} The query of the request
 * 
 * @param {Resource} resource
 * @param {HttpRequest} req
 * @param {HttpResponse} res
 * @param {Server} server
 */
function Context(resource, req, res, server) {
  var ctx = this;
  this.url = req.url.slice(resource.settings.path.length).split('?')[0];
  if (this.url.indexOf('/') !== 0) this.url = '/' + this.url;

  this.req = req;
  this.res = res;
  this.body = req.body;
  this.query = req.query || {};
  this.server = server;
  this.session = req.session;

  // always bind done to this
  var done = this.done;
  this.done = function() {
    done.apply(ctx, arguments);
  }
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

  // TODO better errors
  if(err) {
    this.res.statusCode = 400;
    body = JSON.stringify(err);
  }
  if(typeof body == 'string') type = 'text/plain';
  if(typeof body == 'object') body = JSON.stringify(body);

  this.res.setHeader('Content-Type', type);
  this.res.end(body);
}

module.exports = Context;