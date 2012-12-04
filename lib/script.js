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
    }
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

function wrapAsyncFunctions(asyncFunctions, sandbox, events, done, sandboxRoot) {
  if (!sandboxRoot) sandboxRoot = sandbox;

  if(!asyncFunctions) {
    // stop if asyncFunctions does not exist
    return;
  }

  Object.keys(asyncFunctions).forEach(function(k) {
    if (typeof asyncFunctions[k] === 'function') {
      sandbox[k] = function() {
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
          result = asyncFunctions[k].apply(sandboxRoot._this, args);
        } catch(err) {
          var wrappedErr = wrapError(err);
          sandbox._error = wrappedErr;
          return done(wrappedErr);
        }
        
        if(result !== undefined) {
          return result;
        }
      };
    } else if (typeof asyncFunctions[k] === 'object') {
      sandbox[k] = sandbox[k] || {};
      wrapAsyncFunctions(asyncFunctions[k], sandbox[k], events, done, sandboxRoot);
    } else {
      sandbox[k] = asyncFunctions[k];
    }
  });
}

module.exports = Script;