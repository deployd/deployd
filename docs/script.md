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