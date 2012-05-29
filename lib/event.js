/**
 * Dependencies
 */
 
var mdoq = require('mdoq')
  , vm = require('vm')
  , asyncEval = require('async-eval')
  , elib = require('./elib')
;

/**
 * Event handler middleware.
 */

module.exports = function (handler, data) {
  return function (req, res, next) {
    var err;
    
    switch(req.method) {
      case 'POST':
        return exec(handler, req.data, req, function(state) {
          err = state;
          next(state);
        });
      break;
      
      case 'GET':
        if(req.one) {
          return exec(handler, res.data || {}, req, function(state) {
            err = state;
            next(state);
          });
        } else if(res.data) {
          var i = 0;
          return (function eachData() {
            if (i < res.data.length) {
              exec(handler, res.data[i], req, function(state) {
                err = state;
                if (err) {
                  next(err);
                } else {
                  i++;
                  eachData();
                } 
              }); 
            } else {
              next(err);
            }
          })();
          // return next();
        }        
      break;
      
      default:
        if(req.module) {
          return mdoq
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
            exec(handler, data, req, original, function(state) {
              err = state;

              // without err, commit any changes
              if(!err) req.data = data;
            
              next(err);
            });
          });
        }
      break;
    }
    return next();
  }
}

function exec(src, data, req, original, callback) {
  
  var fn
    , state = {}
    , errors = {}
    , serr = sanitize(src)
    , session = req.session
    , ctx = {}
  ;

  data = data || {};

  if (typeof arguments[3] === 'function') {
    callback = arguments[3]
    original = {};
  } else {
    original = original || {};  
  }
  
  // original fallback
  
  
  // fail on sanitize err
  if(serr) return callback({message: serr});
  
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

  

  elib.createLib(true, function(dpd, err) {
    if (err) return callback(err);

    var options = {
        this: data
      , context: ctx
      , asyncFunctions: {dpd: dpd}
    };

    asyncEval(src, options, function(err) {
      if (err) {
        state.status = state.status || 500;
        if(typeof err == 'string') {
          state.message = err;
        } else {
          state.message = (err && err.message) || 'Bad Request';
        }
      }

      // if there are errors attach them to state
      if(Object.keys(errors).length) {
        state.errors = errors;
      }
      
      if(Object.keys(state).length) {
        return callback(state);
      }
      
      // process dates
      Object.keys(data).forEach(function (key) {
        if(data[key] && data[key].toISOString && data[key].toISOString.call) data[key] = data[key].toISOString();
      })

      return callback();
    });  
  });

  
}

function sanitize(src) {
  // must have a body
  if(!src) return 'Handler must include a body.';
}