// Testing Dependencies

expect = require('chai').expect
dpd = require('../')
root = {user: 'foo', must: 'have', multiple: 'keys'}
server = dpd.use('http://localhost:3003').storage('mongodb://localhost/deployd-testing-db')
client = require('mdoq').use(function (req, res, next) {
  req.headers['x-dssh-key'] = JSON.stringify(root);
  next();
}).use(require('../lib/client')).use('http://localhost:3003');

// mdoq-http pipe patch
client.pipe = function (d) {
  (this.req || (this.req = {})).destinationStream = d;
  return this;
}

// non-root access
unauthed = require('../lib/client').use('http://localhost:3003')
resources = client.use('/resources')
keys = dpd.use('/keys');
types = client.use('/types')
// use non-root for todos
todos = unauthed.use('/todos')
users = unauthed.use('/users')
sessions = client.use('/sessions')
dashboard = client.use('/__dashboard');
UserCollection = require('../lib/types').UserCollection
data = {
  resources: {
    todos: {
      type: 'Collection',
      path: '/todos',
      properties: {
        creator: {
          type: "string",
          optional: true
        },
        title: {
          type: "string",
          optional: false
        },
        completed: {
          type: "boolean"
        },
        order: {
          type: "number",
          optional: true
        },
        dateCompleted: {
          type: "date",
          optional: true
        }
      },
      onGet: 'this.isGet = true;',
      onDelete: '' +
        'if(this.title === "dont delete") {' +
        '  cancel("dont delete");' +
        '}' +
        'if(this.title === "blank cancel") {' +
        '  cancel();' +
        '}',
      onPut: 'this.isPut = true;',
      onPost: 'this.isPost = true;' + 
      'if (me) {' + 
      '  this.creator = me._id;' +
      '}',
    },
    users: {
      type: 'UserCollection',
      path: UserCollection.defaultPath,
      properties: {
        username: {
          type: 'string',
          optional: true
        },
        age: {
          type: 'number'
        }
      }
    },
    avatars: {
      type: 'Static',
      path: '/avatars'
    },
    index: {
      type: 'Static',
      path: '/'
    }
  },
  users: [{email: 'foo@bar.com', password: 'foobar', age: 21, username: "Foo Bar"}],
  todos: [{title: 'feed the dog', complete: false}, {title: 'blank cancel', complete: false}, {title: 'finish some stuff', complete: false}]
}

clear = function(done) {
  client.use('/todos').del(function (e) {
    sessions.del(function (err) {
      resources.del(function (error) {
        done();
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
        resources.post(data.resources.index, function (ee) {
          resources.post(data.resources.avatars, function (er) {
            resources.post(data.resources.users, function (err, b, req, res) {
              done(err || er || e);
            })
          })
        })
      })
    })
  })
})

afterEach(function(done){
  clear(function () {
    server.close()
    done()
  })
})
