var fs = require('fs') 
  , db = require('../lib/db')
  , config = require(__dirname + '/support/db-remote.config.json')
  , tester = db.create(config)
  , store = tester.createStore('test-store')
  , assert = require('assert')
  , mongodb = require('mongodb');

var mdb = new mongodb.Db(config.name, new mongodb.Server(config.host, config.port));

before(function(done){
  mdb.open(function (err) {
    if(err) {
      done(err);
    } else {
      mdb.removeUser(config.credentials.username, function (err) {
        if(err) return done(err);
        mdb.addUser(config.credentials.username, config.credentials.password, done)
      });
    }
  });
});

after(function(done){
  mdb.removeUser(config.credentials.username, function (err) {
    mdb.close();
    done(err);
  });
});

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