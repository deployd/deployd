# Deployd

***Deployd** lets you quickly build secure, dynamic JavaScript and Mobile apps without writing backend code. Instead you boot a simple server that is very good at securely proxying requests to a storage layer such as a database. This enables your un-trusted client code to do things it never could before, such as write directly to a database without a custom application running in-between.*

Instead of reinventing a protocol, deployd embraces HTTP. This means that any HTTP client, such as a JavaScript app, a mobile app, or even another server, can securely interact with your data without having to setup a web server and write a custom backend.

## Quick start

Currently deployd requires mongodb to be installed. You can download mongodb [here](http://www.mongodb.org/downloads). It also requires `node.js` >= v0.6.0. You can download node [here](http://nodejs.org/#download).

Install **deployd** from npm. `sudo` may be required depending on your setup.

    $ [sudo] npm install deployd -g
    
Create an `index.html` file in a new directory.

    <!doctype html>
    <html>
      <head>
        <script src="http://code.jquery.com/jquery-1.7.2.min.js"></script>
        <script src="/dpd.js"></script>
        <script> console.log(dpd); </script>
      </head>
      <body>
      </body>
    </html>

Run the following command from the same directory where you created index.html. *See `dpd -h` for more info on how to use the command line interface.*

    $ dpd -d
    
This will open up the dashboard where you can manage your deployd server. You can create resources and manage their data.

Create some resources in the dashboard. If you open up `http://localhost:2403` in a browser with a console (Chrome, Firefox) you should see the `dpd` object logged out. This is an api to all of your collections.

If you created a `/todos` collection you could add a new todo with:

    dpd.todos.save({title: 'Foo the bar', completed: true}, function(todo) {
      console.log(todo);
    });
    
If you created a `/users` user collection you could log in a user with:

    dpd.users.login({email: 'foo@bar.com', password: 'mypassword'}, function(user) {
      console.log(user);
    });

## How does it work?

### Storage

Deployd greatly simplifies web and mobile app development by acting as a proxy between untrusted clients (browser, phones, etc) and your database, allowing you to do more on the client than ever before. This added benefit also comes with added responsibility to secure the newly opened APIs directly to your data. Deployd solves this by validating every request against rules you define in the dashboard or in familiar JavaScript.

Once a request is validated for input, authorization, and passes any [custom validation](#Collection-Event-Handlers), it is proxied to the storage engine (database abstraction). This means you do not have to write backend code to expose data to your clients. Data is instantly available.

### REST

Deployd uses REST to expose database commands to clients.

REST is a web service design pattern that conforms closely to HTTP itself. In Deployd, HTTP methods or verbs have meaning:
  
  * **GET** - Load a resource without modifying it (this is a browser's default method)
  * **POST** - Create a resource, or send data to a special that doesn't fit within these methods
  * **PUT** - Update an existing resource
  * **DELETE** - Destroy an existing resource

In Deployd, HTTP response codes are also important:

  * **200** OK - The request succeeded
  * **204** No Content - The request succeeded, but there is no content to return (for example, after a deletion, or requesting an empty list)
  * **400** Bad Request - The request did not pass validation. Change the parameters and try again.
  * **401** Unauthorized - The request's session does not have permission to access that resource. 
  * **404** Not Found - That URL does not reference an existing resource
  * **500** Internal Server Error - Deployd has failed to process the request due to an unexpected error.

Deployd exposes everything, even low level functionality, securely over http (with the appropriate auth keys). This lets you use deployd however you want as long as your client can speak http.

### Resources

Deployd servers are built using resources. Each resource handles its own unique URL. For example a list of todos could be served as a collection resource.

    GET /todos?q={"$orderby": "created"}

Deployd will route this to the `/todos` collection resource and hand it off to its module. The collection resource will execute a fetch from the storage engine passing the query `{"$orderby": "created"}` and execute the `GET` event handler if one has been attached, passing the event handler the current session and data retrieved. Finally, the http response will be handed the final object, potentially modified by an event handler.

<hr />

# JavaScript Client API

Its very easy to access the deployd api from browser JavaScript. Just include `<script src="/dpd.js"></script>`. Deployd automatically builds and generates your data api for you.

## Collections

Each collection gets several methods to create/update, read/query, and delete data. The following examples assume you have created a `/todos` collection.

<h3 class="code">save(data, callback) </h3>

Save the provided data object to the collection:

    dpd.todos.save({creator: 'ritch', title: 'foo the bar', order: 7, done: false}, function(todo, err) {
      if(err) return console.log(err);
      console.log(todo); // {title: 'foo the bar', order: 7, done: false, _id: "4b5783300334000000000aa9"}
    });
    
If the object already has an `_id` the existing object in the collection with the matching id will be updated.

    dpd.todos.save({_id: "4b5783300334000000000aa9", done: true}, function(todo, err) {
      if(err) return console.log(err);
      console.log(todo); // {title: 'foo the bar', order: 7, done: true, _id: "4b5783300334000000000aa9"}
    });

<h3 class="code">post(data, callback) </h3>

Creates the provided object in the collection:

    dpd.todos.post({creator: 'ritch', title: 'foo the bar', order: 7, done: false}, function(todo, err) {
      if(err) return console.log(err);
      console.log(todo); // {title: 'foo the bar', order: 7, done: false, _id: "4b5783300334000000000aa9"}
    });

<h3 class="code">get([query], callback)</h3>

Query the collection using the optional [mongo query object](http://www.mongodb.org/display/DOCS/Advanced+Queries).

Get all the todos with a creator `'ritch'`:

    dpd.todos.get({creator: 'ritch'}, function(todos, err) {
      if(err) return console.log(err);
      console.log(todos); // [{title: 'foo the bar', order: 7, done: true}, ...]
    });

<h3 class="code">first([query | id], callback) or getOne([query | id], callback)</h3>

Get the first object from the collection using the optional [mongo query object](http://www.mongodb.org/display/DOCS/Advanced+Queries) or an id.

Get a todo by id:

    dpd.todos.first("4b5783300334000000000aa9", function(todo, err) {
      if(err) return console.log(err);
      console.log(todo); // {title: 'foo the bar', order: 7, done: true, _id: "4b5783300334000000000aa9"}
    });

Get a todo with specified properties:

    dpd.todos.first({creator: 'ritch', title: 'foo the bar'}, function(todo, err) {
      if(err) return console.log(err);
      console.log(todo); // {title: 'foo the bar', creator: 'ritch', order: 7, done: true, _id: "4b5783300334000000000aa9"}
    });

<h3 class="code">put([id], data, callback)</h3>

Updates the object with the specified id with the provided properties. If no id is provided, it will be inferred from the data's `_id` property.

Update a todo:

    dpd.todos.put("4b5783300334000000000aa9", {order: 3}, function(todo, err)) {
      if(err) return console.log(err);
      console.log(todo); // {title: 'foo the bar', creator: 'ritch', order: 3, done: true, _id: "4b5783300334000000000aa9"}
    });

<h3 class="code">del(id, callback)</h3>

Delete the object from the collection with the specified id.

Delete a todo by id:

    dpd.todos.del("4b5783300334000000000aa9", function(success, err) {
      if(err) return console.log(err);
      console.log(success); // true
    });

## Users Collection

Users collections include methods to login and logout users as well as return the current user. Each users collection gets the same methods to create/update, read/query, and delete data as a regular collection. The following examples assume you have created a `/users` collection.

<h3 class="code">users.post(user, callback)</h3>

Register a new user. Passwords will automatically be removed from responses.

    dpd.users.post({email: 'foo@bar.com', password: 'mypassword'}, function(user, err) {
      if(err) return console.log(err);
      console.log(user); // {email: 'foo@bar.com', _id: "4b5783300334000000000aa9"}
    });

<h3 class="code">users.login(credentials, callback)</h3>

Login a user with the given credentials.

    dpd.users.first({email: 'foo@bar.com', password: 'mypassword'}, function(user, err) {
      if(err) return console.log(err);
      console.log(user); // {email: 'foo@bar.com', _id: "4b5783300334000000000aa9"}
    });
    
<h3 class="code">users.me(callback)</h3>

Get the currently logged in user.

    dpd.users.me(function(user, err) {
      if(err) return console.log(err);
      console.log(user); // {email: 'foo@bar.com', _id: "4b5783300334000000000aa9"}
    });

<h3 class="code">users.logout(callback)</h3>

Logout the current user.

    dpd.users.logout(function(success, err) {
      if(err) return console.log(err);
      console.log(success); // true
    });