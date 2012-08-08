# Context

Contexts are a thin abstraction between http requests, `Resource`s, and `Script`s. They provide utility methods to simplify interacting with the [http.ServerRequest] and [http.ServerResponse] objects.

A `Context` is built from a request and response and passed to a matching `Resource` by the `Router`. This might originate from an external http request or a call to an **internal client** from a `Script`.

## Faux Contexts

Contexts may be created without a real request and response. This is useful for testing how a `Resource` or `Script` might handle an http request without creating a mock socket, request, or response.

## Class: Context

    var Context = require('deployd/lib/context');
    var ctx = new Context(resource, req, res, server);

### ctx.done(err, result)

Continuous callback sugar for easily calling `res.end()`. Conforms to the idiomatic callback signature for most apis so it can be passed directly.

    fs.readFile('bar.txt', ctx.done);

* `err` {Error | Object}

An error if one occured during handling of the `ctx`. Otherwise it should be `null`.

* `result` {Object}

The result of executing the `ctx`. This should be a `typeof` object and serialize-able as JSON.


### ctx.body

* {Object}

The body of the request if sent as `application/json` or `application/x-www-form-urlencoded`.

### ctx.query

* {Object}

The query string of the request serialized as an `Object`. Supports both `?key=value` as well as `?{"key":"value"}`.
