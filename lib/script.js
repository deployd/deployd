var vm = require('vm')
  , _ = require('underscore')._
  , EventEmitter = require('events').EventEmitter
  , fs = require('fs');

/**
 * A `Script` executes JavaScript src in a sandboxed context and exposes it a set of domain functions.
 */

function Script(src, path) {
  try {
    this.compiled = vm.createScript('(function() {' + src + '\n}).call(_this)', path);
  } catch(ex) {
    this.error = ex;
  }
}

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
    this.compiled.runInNewContext(scriptContext);
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
  if(!promiseable.then && promiseable.promise && isPromise(promiseable.promise)) {
    realPromise = promiseable.promise;
  }

  var _then = realPromise.then;
  realPromise.then = function(onFulfilled, onRejected) {
    events.emit('addCallback');

    var args = [
      // wrappedOnFulfilled
      function(res) {
        var result = onFulfilled.apply(sandboxRoot._this, arguments);
        events.emit('finishCallback');

        return isPromise(result)? wrapPromise(result, sandbox, events, done, sandboxRoot) : result;
      }
    ];

    if(onRejected) {
      args.push(
        // wrappedOnRejected
        function(err) {
          var result = onRejected.apply(sandboxRoot._this, arguments);

          events.emit('finishCallback');
          return isPromise(result)? wrapPromise(result, sandbox, events, done, sandboxRoot) : result;
        }
      );
    } else {
      args.push(
        function(err) {
          events.emit('finishCallback');

          // this is needed to pass the error along
          // couldn't find official docs to prove this is the way to go, 
          // but at least ayepromise and when.js require it that way to chain rejections (without relying on rejected promise)
          throw (err instanceof Error) ? err : new Error(err);
        }
      );
    }
    var result = _then.apply(realPromise, args);
    return isPromise(result)? wrapPromise(result, sandbox, events, done, sandboxRoot) : result;
  };

  return promiseable;
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
    } else {
      args.push(function() {
        if (sandboxRoot._error) return;
        events.emit('finishCallback');
      });
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
    } else if (typeof asyncFunctions[k] === 'object' && !(asyncFunctions[k] instanceof Array)) {
      sandbox[k] = sandbox[k] || {};
      wrapAsyncFunctions(asyncFunctions[k], sandbox[k], events, done, sandboxRoot);
    } else {
      sandbox[k] = asyncFunctions[k];
    }
  });
}

module.exports = Script;
