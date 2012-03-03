var expect = require('chai').expect
  , mdoq = require('mdoq')
  , client = require('../lib/client').use(mdoq.util.debug)
  , dpd = require('../')
  , server = dpd('My Todo App')
  , tclient = client.use('http://localhost:3003')
  , resources = tclient.use('/resources')
  , todos = tclient.use('/todos')
  , routes = tclient.use('/routes')
;

describe('Booting a server', function(){
  it('should have the given name', function() {
    var name = 'my simple server'
      , server = dpd(name);
      
    expect(server.name).to.equal(name);
  })
  
  it('should have a default name of deployd', function() {
    var server = dpd();
    expect(server.name).to.equal('deployd');
  })
  
  it('should start listening on the given port', function(done) {
    var server = dpd('test server')
      , port = 2304;
    
    server.on('listening', function () {
      // server emits listening more than once!
      if(!server.closing) server.close();
    });
    
    server.on('close', function () {
      server.closing = true;
      done();
    });
    
    server.listen(port);
  })
})

describe('Resource Types', function(){
  it('should be able to be described from a client', function(done) {
    var resource = {
      type: 'Collection',
      path: '/todos',
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
    };

    server.on('listening', function() {   
      // describe a new type of resource
      resources.post(resource, done);
    });

    server.listen(3003);
  })
  
  it('should now have a resource type', function(done) {
    resources.get(function (err, todos) {
      expect(todos).to.exist;
      expect(todos).to.have.length(1);
      expect(todos[0].path).to.equal('/todos');
      done(err);
    })
  })
  
  it('should save a new todo', function(done) {
    var eg = {title: 'feed the dog'};
    
    todos.post(eg, function (err) {
      todos.get(eg, function (err, todo) {
        // HACK - need first()
        if(todo.length) todo = todo[0];
        expect(todo.title).to.equal(eg.title);
        done(err);
      })
    })
  })
})