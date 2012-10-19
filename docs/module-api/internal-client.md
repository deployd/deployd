# Internal Client

The `internal-client` module is responsible for building a server-side version of **dpd.js**. It is intended for use in `Script`s but can be used by resources to access other resources' REST APIs.

*Note: As in dpd.js, the callback for an internal client request recieves the arguments `(data, err)`, which is different than the Node convention of `(err, data)`. This is for a better experience in writings `Script`s and events.*

## internalClient.build(server, [session], [stack])

    var internalClient = require('deployd/lib/internal-client');
    var dpd = internalClient.build(server);

    dpd.todos.get(function(data, err) {
      // Do something...
    });

* `server` {Server}

The Deployd server to build a client for. 

* `session` {Session} *(optional)*

The `Session` object on the current request.

* `stack` {Array} *(optional)*

Used internally to prevent recursive calls to resources.

## Mock context

In order to make requests on resources within the Deployd server, `internal-client` creates mock `req` and `res` objects. These objects are not Streams and cannot be treated exactly like the standard `http.ServerRequest` and `http.ServerResponse` objects in Node, but they imitate their interfaces with the following properties:

### req

* `url` {String}

The URL of the request, i.e. "/hello"

* `method` {String}

The method of the request, i.e. "GET", "POST"

* `query` {Object}

The query object.

* `body` {Object}

The body of the request.

* `session` {Session}

The current session, if any.

* `internal` {Boolean}

Always equal to `true` to indicate an internal request and a mock `req` object.

### res

* `statusCode` {Number}

Set this to a standard HTTP response code.

* `setHeader()` {Function}

No-op.

* `end(data)` {Function}

Returns data to the internal client call. If `data` is JSON, it will be parsed into an object, otherwise it will simply be passed as a string. If the `res.statusCode` is not 200 or 204, `data` will be passed as an error.

* `internal` {Boolean}

Always equal to `true` to indicate an internal request and a mock `res` object.