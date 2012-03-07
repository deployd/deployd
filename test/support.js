// Testing Dependencies

expect = require('chai').expect
dpd = require('../')
server = dpd.use('http://localhost:3003')
client = require('../lib/client').use('http://localhost:3003')
resources = client.use('/resources')
types = client.use('/types')
users = client.use('/users')
todos = client.use('/todos')
sessions = client.use('/sessions')
UserCollection = require('../lib/types').UserCollection
data = {
  resources: {
    todos: {
      type: 'Collection',
      path: '/todos',
      settings: {
        title: {
          description: "the title of the todo",
          type: "string",
          required: true
        },
        completed: {
          description: "the state of the todo",
          type: "boolean",
          default: false
        }
      }
    },
    users: {
      type: 'UserCollection',
      path: UserCollection.defaultPath,
      settings: UserCollection.settings
    }
  },
  users: [{email: 'foo@bar.com', password: 'foobar'}],
  todos: [{title: 'feed the dog', complete: false}, {title: 'wash the car', complete: false}, {title: 'finish some stuff', complete: false}]
}

clear = function(done) {
  todos.del(function (e) {
    // sessions.del(function (err) {
      resources.del(function (error) {
        done()
      })
    // })
  })
};

beforeEach(function(done){
  server.listen(function () {
    clear(function () {
      resources.post(data.resources.todos, function (e) {
        resources.post(data.resources.users, function (err) {
          done(err || e);
        })
      })
    })
  });
})

afterEach(function(done){
  clear(function () {
    server.close()
    done()
  })
})
