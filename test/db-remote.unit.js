var fs = require('fs') 
  , db = require('../lib/db')
  , configContents = fs.readFileSync('db-remote.config.json','utf8')
  , config = JSON.parse(configContents)
  , tester = db.create(config)
  , store = tester.createStore('test-store')
  , Store = require('../lib/db').Store
  , assert = require('assert')
  ; 
  
if (config.host == 'foo.com') {
    console.warn('Before you run db-remote.unit.js tests, set up the configuration in "db-remote.config.json".')
    return;
}

beforeEach(function(done){
  store.remove(function () {
    store.find(function (err, result) {
      assert.equal(err, null);
      assert.equal(result.length, 0);
      done(err);
    });
  });
});

describe('db', function(){
  describe('.create(options)', function(){
    it('should connect to a remote database', function(done) {
      store.find(function (err, empty) {
        assert.equal(empty.length, 0)
        done(err);
      });
    });
  });
});

describe('store', function(){

  describe('.find(query, fn)', function(){
    it('should not find anything when the store is empty', function(done) {
      store.find(function (err, empty) {
        assert.equal(empty.length, 0);
        done(err);
      });
    });
    
    it('should pass the query to the underlying database', function(done) {
      store.insert([{i:1},{i:2},{i:3}], function () {
        store.find({i: {$lt: 3}}, function (err, result) {
          assert.equal(result.length, 2);
          result.forEach(function (obj) {
            assert.equal(typeof obj.id, 'string')
          });
          done(err);
        });
      });
    });
    
    // TODO: convert the rest of the tests
  });
});