/**
 * Dependencies
 */
 
var mdoq = require('mdoq')
  , vm = require('vm')
;

/**
 * Event handler middleware.
 */

module.exports = function (handler, data) {
  return function (req, res, next) {
    var err;
    
    switch(req.method) {
      case 'POST':
        err = exec(handler, req.data, req);
        next(err);
      break;
      
      case 'GET':
        if(req.one) {
          err = exec(handler, res.data || {}, req)
        } else if(res.data) {
          res.data.forEach(function (data) {
            err = exec(handler, data, req);
            if(err) return false;
          })
        }
        
        next(err);
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
            err = exec(handler, data, req, original);
            
            // without err, commit any changes
            if(!err) req.data = data;
            
            next(err);
          });
        }
      break;
    }
  }
}

function exec(src, data, req, original) {
  var fn
    , state = {}
    , errors = {}
    , serr = sanitize(src)
    , session = req.session
    , ctx = {}
  ;
  
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

  ctx.console = console;
  
  // wrap with a function and execute with data as the explicit context
  src = '(function() { ' + src + ' \n}).call(data)';
  
  try {
    vm.runInNewContext(src, ctx, 'event.vm');
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
}

function sanitize(src) {
  // must have a body
  if(!src) return 'Handler must include a body.';
}