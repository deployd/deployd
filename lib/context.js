var internalClient = require('./internal-client')
  , debug = require('debug')('context')
  , doh = require('doh')
  , respond;

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
  
  if(!respond) {
    respond = doh.createResponder({template: server.options.errorTemplate})
  }
  
  this.url = req.url.slice(resource.path.length).split('?')[0];
  if (this.url.indexOf('/') !== 0) this.url = '/' + this.url;

  this.urlParts = this.url.split('/').filter(function(p) { return p });

  this.req = req;
  this.res = res;
  this.body = req.body;
  this.query = req.query || {};
  this.server = server;
  this.session = req.session;
  this.resource = resource;
  this.method = req && req.method;
  
  if(resource && resource.getDefaultPermissions) {
    this.permissions = resource.getDefaultPermissions(this);
  } else {
    this.permissions = {};
  }
  
  if(resource && resource.getRequiredPermissions) {
    this.requiredPermissions = resource.getRequiredPermissions(this);
  } else {
    this.requiredPermissions = {};
  }
  
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

/**
 * Permissions
 */
 
Context.prototype.allow = function (permission) {
  var ctx = this;
  
  if(permission === '*' || permission === 'all') {
    Object.keys(this.requiredPermissions).forEach(function (key) {
      ctx.permissions[key] = true;
    });
  } else {
    ctx.permissions[permission] = true;
  }
}

Context.prototype.prevent = function (permission) {
  var ctx = this;
  
  if(permission === '*' || permission === 'all') {
    ctx.permissions = {};
  } else {
    ctx.permissions[permission] = false;
  }
}

Context.prototype.isAllowed = function (permission) {
  return !!this.permissions[permission];
}

Context.prototype.allowByDefault = function (permission) {
  this.permissions[permission] = true;
}

Context.prototype.requirePermission = function (permission) {
  this.requiredPermissions[permission] = true;
}

Context.prototype.verifyPermissions = function (fn) {
  if(this.req.internal || this.req.isRoot) return fn();
  
  var ctx = this;
  var requiredKeys = Object.keys(this.requiredPermissions);
  var requested = this.permissions;
  var failed;
  
  if(requiredKeys.length) {
    requiredKeys.forEach(function (permission) {
      if(!requested[permission]) {
        if(ctx.server.options.env === 'development') {
          error('permission denied when ' + permission + ' - to allow this action, include `allow("'+ permission +'")` in an event script');
        } else {
          error('permission denied when ' + permission);
        }
      }
    });
    
    if(!failed) {
      fn();
    }
  } else {
    fn();
  }
  
  function error(msg) {
    failed = true;
    ctx.res.statusCode = 401;
    ctx.done(new Error(msg));
  }
}

module.exports = Context;