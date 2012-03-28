/**
 * Dependencies
 */
 
var mdoq = require('mdoq');

/**
 * Event handler middleware.
 */

module.exports = function (handler, data) {
  return function (req, res, next) {
    var me = req.session || {}
      , err
    ;
    
    switch(req.method) {
      case 'POST':
        err = exec(handler, req.data, me);
        next(err);
      break;
      
      case 'GET':
        if(req.one) {
          err = exec(handler, res.data || {}, me)
        } else if(res.data) {
          res.data.forEach(function (data) {
            err = exec(handler, data, me);
            if(err) return false;
          })
        }
        
        next(err);
      break;
      
      default:
        if(req.module) {
          mdoq
          .use(req.resource.path)
          .use(req.module).exec({query: req.query}, function (err, data) {
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
            err = exec(handler, data, me, original);
            
            // without err, commit any changes
            if(!err) req.data = data;
            
            next(err);
          });
        }
      break;
    }
  }
}

function exec(src, data, session, original) {
  var fn
    , state = {}
    , errors = {}
    , serr = sanitize(src)
  ;
  
  // original fallback
  original = original || {};
  
  // fail on sanitize err
  if(serr) return {message: serr};
  
  function error(key, val) {
    errors[key] = val || true;
  }
  
  function cancel(msg, status) {
    state.status = status || 400;
    throw msg;
  }
  
  function hide(property) {
    delete data[property];
  }
  
  function protect(property) {
    if(data[property]) data[property] = original[property] || undefined;
  }
  
  // wrap with a function
  src = 'function(me) {' + src + '}';
  
  try {
    fn = eval('('+ src +')');
    fn.call(data, session);
  } catch(e) {
    state.status = state.status || 500;
    if(typeof e == 'string') {
      state.message = e;
    } else {
      state.message = e.message;
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
  
  // must not contain any functions
  if(src.indexOf('function') > -1) return 'Must not contain any functions.';
}
