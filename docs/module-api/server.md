# Server

Each deployd instance uses a single server to manage IO as well as tie together resources. Deployd's `Server` extends node's `http.Server`. A `Server` is created with an options object that tells deployd what port to serve on and which database to connect to.

## Class: Server

Servers are created when calling the deployd exported function.

    var deployd = require('deployd')
      , options = {port: 3000}
      , server = deployd(options);
    
* `options` {Object}

  - port {Number} - the port to listen on
  - db {Object} - the database to connect to
    - port {Number} - the port of the database server
    - host {String} - the ip or domain of the database server
    - name {String} - the name of the database
    - credentials {Object} - credentials for the server
      - username {String}
      - password {String}
  - env {String} - the environment to run in.

*Note:* If `options.env` is "development", the dashboard will not require authentication and configuration will not be cached. Make sure to change this to "production" or something similar when deploying.

## Server.listen([port], [host])

Load any configuration and start listening for incoming connections.

    var dpd = require('deployd')
      , server = dpd()
  
    dpd.listen();
    dpd.on('listening', function() {
      console.log(server.options.port); // 2403
    });
    
## Server.createStore(namespace) 

Create a new `Store` for persisting data using the database info that was passed to the server when it was created.

    // Create a new server
    var server = new Server({port: 3000, db: {host: 'localhost', port: 27015, name: 'my-db'}});

    // Attach a store to the server
    var todos = server.createStore('todos');

    // Use the store to CRUD data
    todos.insert({name: 'go to the store', done: true}, ...); // see `Store` for more info
    
## Server.sockets

The **socket.io** sockets `Manager` object ([view source](https://github.com/LearnBoost/socket.io/blob/master/lib/manager.js)).

## Server.sessions

The server's `SessionStore`.

## Server.router

The server's `Router`.

## Server.resources

An `Array` of the server's resource instances. These a built from the config and type loaders.