# Dpd.js

The Deployd client library (`dpd.js`) can optionally be included in your web app to simplify backend requests. Include it with this script tag in your `<head>` or `<body>`:

    <script type="text/javascript" src="/dpd.js" />

This will include a `dpd` object that contains all of the resources on the server. For example, if your app contains a `/my-objects` and a `/users` resource, you would use `dpd.myobjects` and `dpd.users` to access their APIs. 
Alternatively, you could use `dpd` as a function, such as `dpd('my-objects')` or `dpd('users')`, but this will not populate any resource-specific helper functions.

# Generic APIs

**Note**: These APIs are designed to work with any resource, so some features may be unavailable depending on the resource. Use resource-specific documentation to learn how to use their APIs.

`dpd.[resource].get([func], [path], [query], fn)`

Makes a GET HTTP request at the URL `/<resource>/<func>/<path>`, using the `query` object as the query string if provided.

- `func` - A special RPC identifier, i.e. `/me`.
- `path` - An idenitifier for a particular object, usually the id
- `query` - An object defining the querystring. If the object is complex, it will be serialized as JSON and passed as the `q` parameter. For Collection queries, see [Query Reference].
- `fn` - Callback `function(result, error)`.

`dpd.[resource].post([path], [query], body, fn)`

Makes a POST HTTP request at the URL `/<resource>/<path>`, using the `query` object as the query string if provided and `body` as the request body.

- `path` - An idenitifier for a particular object, usually the id
- `query` - An object defining the querystring. If the object is complex, it will be serialized as JSON and passed as the `q` parameter. For Collection queries, see [Query Reference].
- `body` - The body of the request; will be serialized as JSON as sent with `Content-Type: application/json` header.
- `fn` - Callback `function(result, error)`.

`dpd.[resource].put([path], [query], body, fn)`

Makes a PUT HTTP request at the URL `/<resource>/<path>`, using the `query` object as the query string if provided and `body` as the request body.

- `path` - An idenitifier for a particular object, usually the id
- `query` - An object defining the querystring. If the object is complex, it will be serialized as JSON and passed as the `q` parameter. For Collection queries, see [Query Reference].
- `body` - The body of the request; will be serialized as JSON as sent with `Content-Type: application/json` header.
- `fn` - Callback `function(result, error)`.

`dpd.[resource].del([path], [query], fn)`

Makes a DELETE HTTP request at the URL `/<resource>/<path>`, using the `query` object as the query string if provided.

- `path` - An idenitifier for a particular object, usually the id
- `query` - An object defining the querystring. If the object is complex, it will be serialized as JSON and passed as the `q` parameter. For Collection queries, see [Query Reference].
- `fn` - Callback `function(result, error)`.

`dpd.[resource].do(func, [path], [body], fn)`

Makes an RPC-style POST HTTP request at the URL `/<resource>/<func>/<path>`. Useful for functions that don't make sense in REST-style APIs, such as `/users/login`.

- `func` - The name of the RPC to call
- `path` - An idenitifier for a particular object, usually the id
- `body` - The body of the request; will be serialized as JSON as sent with `Content-Type: application/json` header.
- `fn` - Callback `function(result, error)`.

# Realtime 

`dpd.on(event, fn)`

Listens for an event coming from the server. See [Collection Event Reference] for details on how to send events.

- `event` - The name of the event to listen for
- `fn` - Callback `function(eventData)`. Called every time the event is received.