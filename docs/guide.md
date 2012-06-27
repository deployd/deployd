# Getting Started

Create an app by running:

	$ dpd create hello
  $ cd hello
  $ dpd
  dpd>

The `dpd>` you see after starting deployd is a REPL for interacting with the server as it's running. It also has a command to open up the dashboard.

	dpd> dashboard

This will open up the dashboard in your default browser.

## Dashboard

The dashboard is a simple ui that you'll use to manage your Deployd server. You can get to the dashboard by opening `/dashboard` (eg. `http://localhost:2403/dashboard`) in a browser.

# Files

Deployd serves static files from its `public` folder. This folder is created when you run `dpd create`. These files will be served with the appropriate cache headers (Last-Modified and Etag) so browsers will cache them. 

Deployd will automatically serve an `index.html` file as the default file in a directory. 

# Dpd.js

The Deployd client library (`dpd.js`) can optionally be included in your web app to simplify backend requests. Include it with this script tag in your `<head>` or `<body>`:

		<script type="text/javascript" src="/dpd.js" />

This will include a `dpd` object that can be used to make HTTP requests:

		dpd.myCollection.post({some: 'value'}, function(result, error) {
			//Makes a POST request to /my-collection
		});

		dpd.myCollection.get({some: 'query'}, function(result, error) {
			//Makes a GET request to /my-collection?some=query
		});

See [Dpd.js Reference] for more details.

# Collection
	
The Collection resource allows clients to save, update, delete, and query data of a given type. 

## Properties

Properties in a Collection describe the objects that it can store. 
Every Collection has an `id` property that cannot be removed. This property is automatically generated when you create an object and serves as a unique identifier.

You can add these types of properties to a Collection:

- `String` - Acts like a JavaScript string
- `Number` - Stores numeric values, including floating points.
- `Boolean` - Either true or false. (To avoid confusion, Deployd will consider null or undefined to be false)
- `Date` - Acts like a JavaScript Date, stores a date, time, and timezone.
- `Object` - Stores any JSON object. Used for storing arbitrary data on an object without needing to validate schema.
- `Array` - Stores an array of any type. 

*Deprecated* Any property can be marked as 'Required". This will cause an error message if the property is null or undefined when an object is created. 

## Events

Events allow you to add custom logic to your Collection. Events are written in JavaScript, see [Collection Events Reference] for details. 

These events are available for scripting:

- `On Get` - Called whenever an object is loaded from the server. Commonly used to hide properties, restrict access to private objects, and calculate dynamic values. (Note: When a list of objects is loaded, `On Get` will run once for each object in the list. Calling `cancel()` in this case will remove the object from the list, rather than cancelling the entire request.)
- `On Validate` - Called whenever an object's values change, including when it is first created. Commonly used to validate property values and calculate certain dynamic values (i.e. last modified time). (Note: `On Post` or `On Put` will execute after `On Validate`, unless `cancel()` or `error()` is called)
- `On Post` - Called when an object is created. Commonly used to prevent unauthorized creation and save data relevant to the creation of an object, such as its creator.
- `On Put` - Called when an object is updated. Commonly used to restrict editing access to certain roles, or to protect certain properties from editing.
- `On Delete` - Called when an object is deleted. Commonly used to prevent unauthorized deletion.

## API

A Collection allows clients to interact with it over a REST interface, as well as with the `dpd.js` library. 

### Listing Data

**REST Example**

	GET /todos?category=red

**dpd.js Example**

	dpd.todos.get({category: 'red'}, function(results, error) {
		//Do something
	});

For advanced queries, Deployd supports [MongoDB's advanced query syntax](http://www.mongodb.org/display/DOCS/Advanced+Queries). 

### Creating an Object

**REST Example**

	POST /todos
	{"title": "Walk the dog", "category": "red"}

**dpd.js Example**

	dpd.todos.post({title: 'Walk the dog'}, function(result, error) {
		//Do something
	});

### Getting a Single Object

**REST Example**

	GET /todos/add1ad66465e6890

**dpd.js Example**

	dpd.todos.get('add1ad66465e6890', function(result, error)) {
		//Do something
	});

### Updating an Object

Note: You do not need to provide all properties for an object. Deployd will only update the properties you provide.

**REST Example**

	PUT /todos/add1ad66465e6890
	{"title": "Bathe the cat"}

**dpd.js Example**

	dpd.todos.put('add1ad66465e6890', {title: "Bathe the cat"}, function(result, error)) {
		//Do something
	});

Deployd supports [MongoDB's atomic update syntax](http://www.mongodb.org/display/DOCS/Updating#Updating-ModifierOperations) for special operations like incrementing and pushing to an array.

### Deleting an Object

**REST Example**

	GET /todos/add1ad66465e6890

**dpd.js Example**

	dpd.todos.get('add1ad66465e6890', function(result, error)) {
		//Do something
	});

See [Dpd.js Reference] for more details.

# User Collection

A User Collection extends a Collection, adding the functionality needed to authenticate users with your app.

## Properties

User Collections can have the same properties as a Collection, with two added:

- `email` - Must be a valid email and must be unique.
- `password` - A read-only, encrypted password

## API

User Collections add three new methods to the standard Collection API:

### Logging in

Log in a user with their email and password. If successful, the browser will save a secure cookie for their session. This request responds with the session details:

	{
		"id": "s0446b993caaad577a..." //Session id - usually not needed
		"path": "/users" // The path of the User Collection - useful if you have different types of users.
		"uid": "ec54ad870eaca95f" //The id of the user
	}

**REST Example**

	POST /users/login 
	{"email": "test@test.com", "password": "1234"}

**dpd.js Example**

	dpd.users.login({'email': 'test@test.com', 'password': '1234'}, function(error, result) {
		//Do something
	});

### Logging out

Logging out will remove the session cookie on the browser and destroy the current session.

**REST Example**

	POST /users/logout 
	{"email": "test@test.com", "password": "1234"}

**dpd.js Example**

	dpd.users.login({'email': 'test@test.com', 'password': '1234'}, function(error, result) {
		//Do something
	});

### Getting the current user

Returns the user that is logged in.

**REST Example**

	GET /users/me

**dpd.js Example**

	dpd.users.me(function(error, result) {
		//Do something
	});