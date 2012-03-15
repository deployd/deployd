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
            
            if(req.method === 'PUT' && req.data) {
              // update the current version before committing
              Object.keys(req.data).forEach(function (key) {
                data[key] = req.data[key];
              })
            }
            
            // exec handler
            err = exec(handler, data, me);
            
            // without err, commit any changes
            if(!err) req.data = data;
            
            next(err);
          });
        }
      break;
    }
  }
}

function exec(src, data, session) {
  var fn, state, serr = sanitize(src);
  
  if(serr) return {handler: serr};
  
  // wrap with a function
  src = 'function() {' + src + '}';
  
  try {
    fn = eval('('+ src +')');
    state = fn.call(data, session);
  } catch(e) {
    state = {status: 500, error: e};
  }
  
  // handle state
  if(state === false) {
    state = {status: 401};
  } else if(state === true) {
    state = undefined;
  } else if(state && typeof state != 'object' || Array.isArray(state)) {
    state = {error: state};
  }
  
  return state;
}

function sanitize(src) {
  // must have a body
  if(!src) return 'Handler must include a body.';
  
  // must not contain any functions
  if(src.indexOf('function') > -1) return 'Must not contain any functions.';
}
