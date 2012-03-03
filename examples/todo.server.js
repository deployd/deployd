var dpd = require('deployd')
  , server = dpd('My Todo App')
  , client = require('mdoq').require('mdoq-http').use('http://user:pass@localhost:3000')
  , resources = client.use('/resources')
  , todos = client.use('/todos')
;

var description = {
  type: 'data',
  name: 'todo',
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

server.on('listening', function() {
  // describe a new type of resource
  resources.use('/todos').post(description, function(err, description) {
    console.info('added todo description to resource graph');
    
    // todos are now available
    todos.post({title: 'feed the dog'}, function(err, todo) {
      console.log('err', err, 'todo', todo);
    });
  });
});

server.listen(3000);