# Deployd

Extensible, distributed resource server.

## Features

 - Store JSON or Files
 - Dynamic Queries
 - Validation
 - Authentication
 - Proxy 3rd party services
 - No configuration required

## Hello World

    var dpd = require('deployd')
      , server = dpd()
      , client = require('mdoq').require('mdoq-http').use('http://localhost:3000')
      , resources = client.use('/resources')
      , todos = client.use('/todos')
    ;

    var description = {
      type: 'Data',
      properties: {
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
    };

    resources.use('/todos').post(description, function(err, description) {
      console.info('added todo description to resource graph');
    });

    server.listen('localhost', 3000);

Once the server is listening, we can interact with resources over http:

    server.on('listening', function () {
      todos.post({title: 'feed the dog'}, function(err, todo) {
        console.log(todo._id); // the todos unique identifier
        todos
          .use('/' + todo._id)
          .put({completed: true}, function (err, todo) {
            console.log(todo); // {title: 'feed the dog', completed: true}
          })
        ;
      })
    })

## Resource Graph

Here is a sample resource graph for the above todo application

    // using the client from the hello world example
    resources.get(function(err, resources) {
      console.log(resources);
    });
    
output:

    {
      '/todos': {
        type: 'Data',
        properties: {
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
      }
    }

## Resource Types

    resources.use('/todos').get(function(err, todos) {
      console.log(todos)
    });

outputs:

    {
      type: 'Data',
      properties: {
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
    }
