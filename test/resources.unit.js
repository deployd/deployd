var resources = require('../lib/resources')
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