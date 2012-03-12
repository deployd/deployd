// Testing Dependencies

expect = require('chai').expect
dpd = require('../')
root = {user: 'foo', must: 'have', multiple: 'keys'}
server = dpd.use('http://localhost:3003').storage('mongodb://localhost/deployd-testing-db')
client = require('mdoq').use('http://localhost:3003').use(function (req, res, next) {
  req.headers['x-dssh-key'] = JSON.stringify(root);
  next();
}).use(require('../lib/client'));
resources = client.use('/resources')
keys = dpd.use('/keys');
types = client.use('/types')
users = client.use('/users')
// use non-root for todos
todos = require('../lib/client').use('http://localhost:3003/todos')
sessions = client.use('/sessions')
UserCollection = require('../lib/types').UserCollection
data = {
  resources: {
    todos: {
      type: 'Collection',
      path: '/todos',
      properties: {
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
      properties: UserCollection.properties
    }
  },
  users: [{email: 'foo@bar.com', password: 'foobar'}],
  todos: [{title: 'feed the dog', complete: false}, {title: 'wash the car', complete: false}, {title: 'finish some stuff', complete: false}]
}

clear = function(done) {
  todos.del(function (e) {
    sessions.del(function (err) {
      resources.del(function (error) {
        done()
      })
    })
  })
};

before(function(done){
  // remove old key
  keys.del(function () {
    // authorize root key
    dpd.use('/keys').post(root, function (err, key) {
      // _id must be included
      root._id = key._id;
      done(err);
    })
  })
})

beforeEach(function(done){
  server.listen(function () {
    clear(function () {
      resources.post(data.resources.todos, function (e) {
        resources.post(data.resources.users, function (err, b, req, res) {
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
