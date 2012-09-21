# dpd.js

The Deployd client library (`dpd.js`) can optionally be included in your web app to simplify backend requests. Include it with this script tag in your `<head>` or `<body>`:

    <script type="text/javascript" src="/dpd.js" />

This will include a `dpd` object that contains all of the resources on the server. For example, if your app contains a `/my-objects` and a `/users` resource, you would use `dpd.myobjects` and `dpd.users` to access their APIs. 
Alternatively, you can use `dpd` as a function, such as `dpd('my-objects')` or `dpd('users')`, but this will not populate any resource-specific helper functions.

# Realtime

	dpd.on(event, fn)

Listens for an event coming from the server. 

* `event` - The name of the event to listen for
* `fn` - Callback `function(eventData)`. Called every time the event is received.

<!--seperate-->
	
	// Listen for a new post
	dpd.on('postCreated', function(post) {
		//do something
	});

In your Collection Events:

	// On Post
	emit('postCreated', this); 

See the [Collection Event Reference](/docs/reference/collection-events.html#docs-emit) for details on how to send events with the `emit()` function.

# Generic Resource APIs

**Note**: These APIs are designed to work with any resource, so some features may be unavailable depending on the resource. Use resource-specific documentation to learn how to use their APIs.

### get()

	dpd.[resource].get([func], [path], [query], fn)

Makes a GET HTTP request at the URL `/<resource>/<func>/<path>`, using the `query` object as the query string if provided.

- `func` - A special RPC identifier, i.e. `/me`.
- `path` - An idenitifier for a particular object, usually the id
- `query` - An object defining the querystring. If the object is complex, it will be serialized as JSON.
- `fn` - Callback `function(result, error)`.

###  post()

	dpd.[resource].post([path], [query], body, fn)

Makes a POST HTTP request at the URL `/<resource>/<path>`, using the `query` object as the query string if provided and `body` as the request body.

- `path` - An idenitifier for a particular object, usually the id
- `query` - An object defining the querystring. If the object is complex, it will be serialized as JSON.
- `body` - The body of the request; will be serialized as JSON as sent with `Content-Type: application/json` header.
- `fn` - Callback `function(result, error)`.

### put()

	dpd.[resource].put([path], [query], body, fn)

Makes a PUT HTTP request at the URL `/<resource>/<path>`, using the `query` object as the query string if provided and `body` as the request body.

- `path` - An idenitifier for a particular object, usually the id
- `query` - An object defining the querystring. If the object is complex, it will be serialized as JSON and passed as the `q` parameter. 
- `body` - The body of the request; will be serialized as JSON as sent with `Content-Type: application/json` header.
- `fn` - Callback `function(result, error)`.

### del()

	dpd.[resource].del([path], [query], fn)

Makes a DELETE HTTP request at the URL `/<resource>/<path>`, using the `query` object as the query string if provided.

- `path` - An idenitifier for a particular object, usually the id
- `query` - An object defining the querystring. If the object is complex, it will be serialized as JSON and passed as the `q` parameter.
- `fn` - Callback `function(result, error)`.


### exec()

	dpd.[resource].exec(func, [path], [body], fn)

Makes an RPC-style POST HTTP request at the URL `/<resource>/<func>/<path>`. Useful for functions that don't make sense in REST-style APIs, such as `/users/login`.

- `func` - The name of the RPC to call
- `path` - An idenitifier for a particular object, usually the id
- `body` - The body of the request; will be serialized as JSON as sent with `Content-Type: application/json` header.
- `fn` - Callback `function(result, error)`.

