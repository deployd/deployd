# Script

A `Script` provides a mechanism to run JavaScript source in a sandbox. A `Script` is executed with a `Context` and a `domain` object. Each `Script` runs independently. They do not share any scope (including global scope), nor do they share state with other scripts.

## Class: Script

    var Script = require('deployd/lib/script');
    var script = new Script('hello()', 'hello.js');

A `Script`'s source is compiled when its constructor is called. It can be `run()` many times with independent `Context`s and `domain`s.

## script.run(ctx, domain, fn)

* ctx {Context}

A `Context` with a `session`, `query`, `req` and `res`.

* domain {Object}

An `Object` containing functions to be injected into the `Script`s sandbox. This will override any existing functions or objects in the `Script`s sandbox / global scope.

This example `domain` provides a log function to a script.

    var script = new Script('log("hello world")');
    var context = {};
    var domain = {};
    var msg;

    domain.log = function(str) {
      console.log(msg = str);
    }

    script.run(ctx, domain, function(err) {
      console.log(msg); // 'hello world'
    });

* fn(err)

The callback will receive any error even if it occurs asynchronously.

    var s = new Script('setTimeout(function() { throw "test err" }, 22)');
  
    // give the script access to setTimeout
    var domain = {setTimeout: setTimeout};
  
    s.run({}, domain, function (e) {
      console.log(e); // test err
    });
    
## Default Domain

Scripts are executed with a default sandbox and set of domain functions. These are functions that every `Script` needs. The following are available to every `Script`. These can be overridden by passing a value such as `{cancel: ...}` in a `domain`.

### cancel(msg, status)

Throws an error that immediately stops the execution of a context and calls the callback passed to `script.run()` passing the error as the first argument. 

`cancel()` does not have an effect if the current `Context.isRoot` or `Context.internal` is true.

### emit([collection], [query], event, data)

    Stability: will change in 0.7

Emits an `event` to all sessions. Can be passed an optional `UserCollection` and `query` to emit the event to only the users in the collection that match the query.

### Sandbox

The default sandbox or global object in a `Script` comes with several other properties:

 - `me` - the current user if one exists on the `Context`
 - `this` - an empty object if not overriden by the `domain`
 - `query` - the current `Context`'s query
 - `console` - support for `console.log()` and other `console` methods
