# deployd

Extensible, distributed resource server.

## features

 - Any-Size File Storage
 - Queryable JSON Collections
 - Validation
 - Authentication
 - Proxy and Redirection
 - Extensible via Middleware
 
## Installation

    $ [sudo] npm install deployd -g
    
## Starting / Stopping

You can start and stop the server with the `dpd` CLI or with the node module.

    var dpd = require('deployd')
      .use('http://localhost:3333')
      // optionally specify which storage resource to use
      // currently only mongodb is supported
      .storage('mongodb://localhost/my-dpd-storage')
      // tell deployd to listen
      .listen()
    ;
    
or

    $ dpd
    $ deployd is running at http://localhost:2304

## Client

The deployd api is entirely available over http. A basic http client is bundled.

    var client = require('deployd').client.use('http://localhost:2304')
      , resources = client.use('/resources')
      , types = client.use('/types');

## Node.js Module

The HTTP Client and node module api are the same. 

    var dpd = require('deployd').use('http://localhost:2304')
      , resources = dpd.use('/resources')
      , types = dpd.use('/types');

## Types

`types.get([query], [callback])` or `/types` will return a description of the available resource types.

## Collections

### Create a collection

Give the collection a URL and some validation and documents will only be inserted if they pass validation.

    function done(err, collection) { ... }
    
    resources.post({
      path: '/todos',
      type: 'Collection',
      settings: {
        title: {
          description: 'the title of the todo',
          type: 'string',
          required: true
        },
        completed: {
          description: 'the state of the todo',
          type: 'boolean',
          default: false
        }
      }
    }, done);
    
### Add a document to the collection

    client.use('/todos').post({title: 'feed the dog'}, function(err, todo) {
      console.info(err || 'it worked! saved with _id', todo._id);
    });
    
## Users

### Creating Users

Register a user by `POST`ing a valid user object to `/users`.

    var user = {
      email: 'foo@bar.com',
      password: 'foobar'
    };
    
    client.use('/users').post(user, function(err, user) {
      console.info(err || 'registered user id: ' + user._id);
    });
    
### Login

Login a user by `POST`ing a valid credentials object to `/users/login`.

    var credentials = {email: 'foo@bar.com', password: 'foobar'};

    client.use('/users/login').post(credentials, function(err, session) {
      console.info(err || 'logged in user id: ' + session.user._id);
    });

### Logout

Logout a user by making any request to `/users/logout`.

    client.use('/users/logout').get(function(err) {
      console.info(err || 'logged out current user');
    });

### Deleting Users

Remove a user by sending a `DELETE` request to `/users?_id=<user._id>`.

    client.use('/users').get({_id: user._id}).del(function(err) {
      console.info(err || 'deleted user id: ' + user._id);
    });