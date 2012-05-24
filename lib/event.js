/**
 * Dependencies
 */
 
var mdoq = require('mdoq')
  , vm = require('vm')
  , collection = require('./types/collection')
  , slib = require('./slib')
  , mongodb = require('mongodb')
  , storage = require('./storage')
;

/**
 * Event handler middleware.
 */

module.exports = function (handler, data) {
  return function (req, res, next) {
    slib.build(function (err, dpd) {
      if(err) return next(err);
      
      // pass along the dpd lib
      req.lib = dpd;
      
      var err;
    
      switch(req.method) {
        case 'POST':
          exec(handler, req.data, req, null, next);
        break;
      
        case 'GET':
          if(req.one) {
            exec(handler, res.data || {}, req, null, next)
          } else if(res.data) {
            exec(handler, res.data, req, null, next);
          } else {
            next({status: 404});
          }
        break;
      
        default:
          if(req.module) {
            mdoq
            .use(req.resource.path)
            .use(req.module).exec({query: req.query, resource: req.resource}, function (err, data) {
              if(Array.isArray(data)) data = data[0];
            
              var original = {};
            
              if(req.method === 'PUT' && req.data) {
                // update the current version before committing
                Object.keys(req.data).forEach(function (key) {
                  original[key] = data[key];
                  data[key] = req.data[key];
                })
              }
            
              // exec handler
              exec(handler, data, req, original, function (err) {
                // without err, commit any changes
                if(!err) req.data = data;
                next(err);
              });
            });
          }
        break;
      }
    });
  }
}

function exec(src, data, req, original, fn) {
  var compiled = preCompiled.replace('"SRC"', src);
  mongodb.connect(storage.storage(), function (err, db) {
    db.eval(compiled, [src, data, req, original], function (err, result) {
      fn(err);
    })
  });
}

function remote(src, data, req, original) {
  var fn
    , state = {}
    , errors = {}
    , serr = sanitize(src)
    , session = req.session
    , ctx = {}
    , all
  ;
  
  if(!Array.isArray(data)) {
    all = [data];
  } else {
    all = data;
  }
  
  // original fallback
  original = original || {};
  
  // fail on sanitize err
  if(serr) return {message: serr};
  
  ctx.error = function(key, val) {
    errors[key] = val || true;
  }
  
  ctx.cancel = function(msg, status) {
    if (!req.isRoot) {
      state.status = status || 400;
      throw msg;  
    }
  }
  
  ctx.hide = function(property) {
    if (!req.isRoot) {
      delete data[property];
    }
  }
  
  ctx.protect = function(property) {
    if (!req.isRoot) {
      if(data[property]) data[property] = original[property] || undefined;
    }
  }
  
  // import session and data
  ctx.data = data;
  ctx.session = session;
  ctx.me = session && session.user;
  if (ctx.me) {
    ctx.me._id = ctx.me._id.toString(); //It comes back as a weird format
  }

  // ctx.console = console;
  
  // dpd lib
  // ctx.dpd = req.lib;

  for(var i = 0; i < all.length; i++) {
    
    try {
      // wrap with a function and execute with data as the explicit context
      (function() {  "SRC" }).call(data);
    } catch(e) {
      state.status = state.status || 500;
      if(typeof e == 'string') {
        state.message = e;
      } else {
        state.message = (e && e.message) || 'Bad Request';
      }
    }

    // if there are errors attach them to state
    if(Object.keys(errors).length) {
      state.errors = errors;
    }

    if(Object.keys(state).length) {
      return state;
    }

    // process dates
    Object.keys(data).forEach(function (key) {
      if(data[key] && data[key].toISOString && data[key].toISOString.call) data[key] = data[key].toISOString();
    })
  }
  
}

var preCompiled = remote.toString();

function sanitize(src) {
  // must have a body
  if(!src) return 'Handler must include a body.';
}