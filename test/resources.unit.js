var resources = require('../lib/resources')
  , InternalResources = resources.InternalResources
  , db = require('../lib/db').connect({name: 'test-db', host: 'localhost', port: 27017})
  , store = db.createStore('resources')
  , testCollection = {type: 'Collection', path: '/my-objects', properties: {title: {type: 'string'}}}
  , Collection = require('../lib/resources/collection');

beforeEach(function(done){
  store.remove(function (err) {
    store.insert(testCollection, done)
  })
})

describe('resources', function(){
  describe('.build(store)', function(){
    it('should return a set of resource instances', function(done) {
      resources.build(store).find(function (err, resources) {
        expect(resources).to.have.length(1);
        expect(resources[0].properties).to.be.a('object');
        expect(resources[0] instanceof Collection).to.equal(true);
        done(err);
      })
    })
  })
})

describe('InternalResources', function() {
  describe('.handle(ctx)', function() {
    it('should create a resource when handling a POST request', function(done) {
      var r = {path: '/foo', type: 'Bar'};

      var ir = new InternalResources({path: '/__resources', server: {
        defineResource: function(des, fn) {
          des.id = '123';
          expect(des).to.equal(r);
          fn(null, des);
          done();
        }
      }});

      ir.handle({req: {method: 'POST', url: '/__resources'}, body: r, done: function() {}});
    });

    it('should create a resource when handling a PUT request', function(done) {
      var r = {path: '/foo', type: 'Bar'};

      var ir = new InternalResources({path: '/__resources', server: {
        defineResource: function(des, fn) {
          des.id = '123';
          expect(des).to.equal(r);
          fn(null, des);
          done();
        }
      }});

      ir.handle({req: {method: 'PUT', url: '/__resources'}, body: r, done: function() {}});
    });

    it('should find a resource when handling a GET request', function(done) {
      var q = {path: '/foo', type: 'Bar'}
        , ir = new InternalResources({path: '/__resources'});

      ir.store = {
        find: function(query, fn) {
          expect(query).to.equal(q);
          done();
        }
      };

      ir.handle({req: {method: 'GET', url: '/__resources'}, query: q, done: function() {}});
    });

    it('should delete a resource when handling a DELETE request', function(done) {
      var q = {path: '/foo', type: 'Bar'}
        , ir = new InternalResources({path: '/__resources'});

      ir.store = {
        remove: function(query, fn) {
          expect(query).to.equal(q);
          done();
        }
      };

      ir.handle({req: {method: 'DELETE', url: '/__resources'}, query: q, done: function() {}});
    });
  });
});