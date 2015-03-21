var _ = require('underscore')._
  , EventEmitter = require('events').EventEmitter
  , fs = require('fs')
  , bluebird = require('bluebird');

/**
 * A `Script` executes JavaScript src in a sandboxed context and exposes it a set of domain functions.
 */

function Script(src, path) {
  this.scriptSourceCode = src;
  this.path = path;
}

Script.prototype.runWithContext = function (context) {
  var functionArgs = Object.keys(context);
  
  // remove the argument 'this' from our list of passed arguments, because it is a reserved word
  functionArgs.splice(functionArgs.indexOf('this'), 1);
  
  functionArgs.push(this.scriptSourceCode);
  var func = Function.apply(null, functionArgs);
    
  // pass our arguments from the sandbox to the function
  var args = [];
  functionArgs.forEach(function (p) {
    args.push(context[p]);
  });
  return func.apply(context._this || {}, args);
};

/**
 * Run the current script in the given sandbox. An optional domain may be provided to extend the sandbox exposed to the script.
 */

Script.prototype.run = function (ctx, domain, fn) {
  
  if (this.error) { fn(this.error); }
  
  if(typeof domain === 'function') {
    fn = domain;
    domain = undefined;
  }

  var req = ctx.req
    , session = ctx.session
    , callbackCount = 0
    , events;
  
  var scriptContext = {
    'this': {},
    cancel: function(msg, status) {
      var err = {message: msg, statusCode: status};
      throw err;
    },
    cancelIf: function(condition, msg, status) {
      if (condition) {
        scriptContext.cancel(msg, status);
      }
    },
    cancelUnless: function(condition, msg, status) {
      scriptContext.cancelIf(!condition, msg, status);
    },
    me: session && session.user,
    isMe: function(id) {
      return (scriptContext.me && scriptContext.me.id === id) || false;
    },
    console: console,
    query: ctx.query,
    internal: req && req.internal,
    isRoot: req && req.session && req.session.isRoot,
    emit: function(collection, query, event, data) {
      if(arguments.length === 4) {
        session.emitToUsers(collection, query, event, data);
      } else if(arguments.length <= 2) {
        event = collection;
        data = query;
        if(session.emitToAll) session.emitToAll(event, data);
      }
    },
    ctx: ctx
  };
  
  scriptContext._this = scriptContext['this'];
  scriptContext._error = undefined;
  
  events = new EventEmitter();
  
  function done(err) {
    events.removeAllListeners('finishCallback');
    if (fn) fn(err);
  }
  
  if(domain) {

    events.on('addCallback', function() {
      callbackCount++;
    });

    events.on('finishCallback', function() {
      callbackCount--;
      if (callbackCount <= 0) {
        done(scriptContext._error);
      }
    });
    
    events.on('error', function (err) {
      done(err);
    });
    
    domain.dpd = ctx.dpd;
    
    if(fn) {
      // if a callback is expected, count callbacks
      // and manually merge the domain
      wrapAsyncFunctions(domain, scriptContext, events, done);
    } else {
      // otherwise just merge the domain
      Object.keys(domain).forEach(function (key) {
        scriptContext[key] = domain[key];
      });
    }
    scriptContext['this'] = scriptContext._this = domain.data;
  }

  var err;
  
  try {
    this.runWithContext(scriptContext);
  } catch(e) {
    err = wrapError(e);
    scriptContext._error = err;
  }
  err = err || scriptContext._error;
  process.nextTick(function () {
    if (callbackCount <= 0) {
      done(err);
    }
  });
};

Script.load = function(path, fn) {
  fs.readFile(path, 'utf-8', function(err, val) {
    if (val) {
      fn(err, new Script(val, path));
    } else {
      fn(err);
    }
  });
};

function wrapError(err) {
  if (err && err.__proto__ && global[err.__proto__.name]) {
    err.__proto__ = global[err.__proto__.name].prototype;
  }
  return err;
}

function isPromise(obj) {
  //maybe not the best of all checks but at least it's compliant to Promises/A+
  //see https://promisesaplus.com
  return typeof obj === 'object' && (typeof obj.then === 'function' || isPromise(obj.promise));
}

function wrapPromise(promiseable, sandbox, events, done, sandboxRoot) {
  var realPromise = promiseable;
  var ret = null;
  if(!promiseable.then && promiseable.promise && isPromise(promiseable.promise)) {
    realPromise = bluebird.cast(promiseable.promise);
    ret = { promise: realPromise, resolve: promiseable.resolve, reject: promiseable.reject };
  }
  if (!ret) {
    ret = bluebird.cast(realPromise);
    realPromise = ret;
  }

  var realThen = realPromise._then;
  var addCallback = function () {
    events.emit('addCallback');
  };
  var finishCallback = function() {
    events.emit('finishCallback');
  };
  
  addCallback();
  realPromise.then(finishCallback, finishCallback);
    
  realPromise._then = function (onFulfilled, onRejected) {
    var args = [undefined, undefined];
    
    if (onFulfilled) {
      // wrappedOnFulfilled
      args[0] = function (res) {
        addCallback();
        try {
          var result = onFulfilled.apply(this, arguments);
          return isPromise(result)? wrapPromise(result, sandbox, events, done, sandboxRoot) : result;
        } catch (err) {
          sandboxRoot._error = err;
          throw err;
        } finally {
          finishCallback();
        }
      };
    }

    if(onRejected) {
      args[1] =
        // wrappedOnRejected
        function (error) {
          if (error === sandboxRoot._error) {
            // if we're handling a previously uncaught error, remove it
            sandboxRoot._error = null;
          }
          addCallback();
          try {
            var result = onRejected.apply(this, arguments);
            return isPromise(result)? wrapPromise(result, sandbox, events, done, sandboxRoot) : result;
          } catch (err) {
            sandboxRoot._error = wrapError(err);
            throw err;
          } finally {
            finishCallback();
          }
        };
    }
      
    for(var i = args.length; i< arguments.length; i++) {
      args[i] = arguments[i];
    }
    var result = realThen.apply(realPromise, args);
    return isPromise(result)? wrapPromise(result, sandbox, events, done, sandboxRoot) : result;
  };
  return ret;
}

function wrapAsyncFunction(asyncFunction, sandbox, events, done, sandboxRoot) {
  return function() {
    if (sandboxRoot._error) return;

    var args = _.toArray(arguments);
    var callback;
    var callbackIndex;
    var result;
    
    for(var i = 0; i < args.length; i++) {
      if(typeof args[i] == 'function') {
        callback = args[i];
        callbackIndex = i;
        break;
      }
    }
    
    if (typeof callback === 'function') {
      events.emit('addCallback');
      args[callbackIndex] = function() {
        if (sandboxRoot._error) return;
        try {
          result = callback.apply(sandboxRoot._this, arguments);
          events.emit('finishCallback');
        } catch (err) {
          var wrappedErr = wrapError(err);
          sandbox._error = wrappedErr;
          return done(wrappedErr);
        }
      };
    }
    try {
      result = asyncFunction.apply(sandboxRoot._this, args);
    } catch(err) {
      var wrappedErr = wrapError(err);
      sandbox._error = wrappedErr;
      return done(wrappedErr);
    }
    
    if(result !== undefined) {
      if(isPromise(result)) {
        return wrapPromise(result, sandbox, events, done, sandboxRoot);
      } else {
        return result;
      }
    }
  };
}

function wrapAsyncFunctions(asyncFunctions, sandbox, events, done, sandboxRoot) {
  if (!sandboxRoot) sandboxRoot = sandbox;

  if(!asyncFunctions) {
    // stop if asyncFunctions does not exist
    return;
  }

  Object.keys(asyncFunctions).forEach(function(k) {
    if (typeof asyncFunctions[k] === 'function') {
      sandbox[k] = wrapAsyncFunction(asyncFunctions[k], sandbox, events, done, sandboxRoot);

      // we need to retain all the properties a function might have, think constructor with static functions
      wrapAsyncFunctions(asyncFunctions[k], sandbox[k], events, done, sandboxRoot);
    } else if (asyncFunctions[k] !== null && typeof asyncFunctions[k] === 'object' && !(asyncFunctions[k] instanceof Array)) {
      sandbox[k] = sandbox[k] || {};
      wrapAsyncFunctions(asyncFunctions[k], sandbox[k], events, done, sandboxRoot);
    } else {
      sandbox[k] = asyncFunctions[k];
    }
  });
}

module.exports = Script;
