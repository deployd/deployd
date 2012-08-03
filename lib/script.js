var vm = require('vm')
  , _ = require('underscore')._
  , EventEmitter = require('events').EventEmitter
  , domain = require('domain');

function Script(src, path) {
  this.compiled = vm.createScript('(function() {' + src + '\n}).call(_this)', path);
}

/**
 * Run the current script in the given sandbox. An optional domain may be provided to extend the sandbox exposed to the script.
 */

Script.prototype.run = function (ctx, domain, fn) { 
  
  if(typeof domain === 'function') {
    fn = domain;
    domain = undefined;
  }

  var req = ctx.req
    , session = ctx.session
    , callbackCount = 0
    , events;
  
  var scriptContext = {
    this: {},
    cancel: function(msg, status) {
      if (!session.isRoot && !session.internal) {
        var err = {message: msg, statusCode: status};
        throw err; 
      }
    },
    me: session && session.user,
    console: console,
    query: ctx.query,
    emit: function(collection, query, event, data) {
      if(arguments.length === 4) {
        session.emitToUsers(collection, query, event, data);
      } else if(arguments.length <= 2) {
        event = collection;
        data = query;
        if(session.emitToAll) session.emitToAll(event, data);
      }
    }
  }
  
  scriptContext._this = scriptContext.this;
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
    
    if(domain) wrapAsyncFunctions(domain, scriptContext, events, done);
    scriptContext.this = scriptContext._this = domain.data;
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
  })
}

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
              callback.apply(sandboxRoot._this, arguments);
              events.emit('finishCallback');  
            } catch (err) {
              err = wrapError(err);
              sandbox._error = err;
              return done(err);
            }
          };
        } else {
          args.push(function() {
            if (sandboxRoot._error) return;
            events.emit('finishCallback');
          });
        }
        try {
          asyncFunctions[k].apply(sandboxRoot._this, args);
        } catch(err) {
          err = wrapError(err);
          sandbox._error = err;
          return done(err);
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