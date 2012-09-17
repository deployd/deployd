var Collection = require('../lib/resources/collection')
  , db = require('../lib/db');

describe('collection', function(){
  function createCollection(properties) {
    return new Collection('objects', {
      config: {
        properties: properties
      }
    });
  }

  describe('.validate(req)', function(){
    it('should validate the request', function() {
      var r = createCollection({
        title: {
          type: 'string'
        }
      });
      
      var errs = r.validate({title: 'foobar'});
      
      expect(errs).to.not.exist;
    });
    
    it('should fail to validate the invalid request', function() {
      var r = createCollection({
        title: {
          type: 'string'
        }
      });
      
      var errs = r.validate({title: 7});
      
      expect(errs).to.eql({'title': 'must be a string'});
    });
    
    it('should fail to validate the invalid request with multiple errors', function() {
      var r = createCollection({
        title: {
          type: 'string',
          required: true
        },
        age: {
          type: 'number',
          required: true
        },
        created: {
          type: 'date'
        }
      });
      
      var errs = r.validate({title: 7, created: 'foo'}, true);
      
      expect(errs).to.eql({title: 'must be a string', age: 'is required', created: 'must be a date'});
    });
  });
  
  describe('.sanitize(body)', function(){
    it('should remove properties outside the schema', function() {
      var r = createCollection({
        title: {
          type: 'string'
        }
      });
      
      var sanitized = r.sanitize({foo: 7, bar: 8, title: 'foo'});
      
      expect(sanitized.foo).to.not.exist;
      expect(sanitized.bar).to.not.exist;
      expect(sanitized.title).to.equal('foo');
    });
    
    it('should convert int strings to numbers', function() {
      var r = createCollection({
        age: {
          type: 'number'
        }
      });
      
      var sanitized = r.sanitize({age: '22'});
      expect(sanitized.age).to.equal(22);
    });
  });
  
  describe('.handle(ctx)', function(){
    it('should have a store', function() {
      var c = new Collection('foo', { db: db.create(TEST_DB) });
      expect(c.store).to.exist;
    });
    
    function example(method, path, properties, body, query, test, done, testData) {
      var c = new Collection(path, {db: db.create(TEST_DB), config: { properties: properties } });
      
      function t() {
        freq(path, {method: method, url: '',  body: body, json: true}, function (req, res) {
          // faux body
          req.body = body;
          req.query = query;
          c.handle({req: req, res: res, query: query || {}, session: {}, done: function() {res.end();}});
        }, function (req, res) {       
          test(req, res, method, path, properties, body, query);
          // cleanup
          c.store.remove(function (err) {
            done(err);
          });
        });
      }
      
      if(testData) {
        c.store.insert(testData, t);
      } else {
        t();
      }
    }
    
    it('should handle POST', function(done) {
      example('POST', '/foo', {test: {type: 'boolean'}}, {test: true}, null,
        function (req, res, method, path, properties, body) {
            expect(req.body).to.eql(body);
            expect(res.statusCode).to.equal(200);
        },
        done
      );
    });
    
    it('should handle GET', function(done) {
      var testData = [{test: true}, {test: false}];
      example('GET', '/foo', {test: {type: 'boolean'}}, null, null,
        function (req, res, method, path, properties, body) {
          expect(res.statusCode).to.equal(200);
        },
        done,
        testData
      );
    });

    it('should handle GET without data', function(done) {
      var testData = [];
      example('GET', '/foo', {test: {type: 'boolean'}}, null, null,
        function (req, res, method, path, properties, body) {
          expect(res.statusCode).to.equal(200);
        },
        done,
        testData
      );
    });
    
    it('should handle PUT', function(done) {
      var testData = [{test: true}, {test: false}];
      example('PUT', '/foo', {test: {type: 'boolean'}}, {test: false, id: 7}, null,
        function (req, res, method, path, properties, body) {
          expect(res.statusCode).to.equal(200);
        },
        done,
        testData
      );
    });
    
    it('should handle DELETE', function(done) {
      example('DELETE', '/foo', {test: {type: 'boolean'}}, null, {id: 7},
        function (req, res, method, path, properties, body) {
          expect(res.statusCode).to.equal(200);
        },
        done
      );
    });
  });

  describe('.save()', function() {
    it('should save the provided data', function(done) {
      var c = new Collection('counts', {db: db.create(TEST_DB), config: { properties: {count: {type: 'number'}}}});

      c.save({session: {}, body: {count: 1}, query: {}, dpd: {}}, function (err, item) {
        expect(item.id).to.exist;
        expect(err).to.not.exist;
        done();
      });
    });

    it('should pass commands like $inc', function(done) {
      var c = new Collection('counts', {db: db.create(TEST_DB), config: { properties: {count: {type: 'number'}}}});

      c.save({body: {count: 1}}, function (err, item) {
        expect(item.id).to.exist;
        expect(err).to.not.exist;
        c.save({body: {count: {$inc: 100}}, query: {id: item.id}}, function (err, updated) {
          expect(err).to.not.exist;
          expect(updated).to.exist;
          expect(updated.count).to.equal(101);
          done(err);
        });
      });
    });

    // it('should pass commands to the validation listener', function(done) {
    //   var c = new Collection({
    //     onValidate: 'if(typeof this.count != "object") throw "didnt pass command to listener"',
    //     properties: {
    //       count: {type: 'number'}
    //     }
    //   });

    //   c.save({}, {count: {$inc: 100}}, {id: 'foo'}, {}, done);
    // });
  });

  describe('.get()', function() {
    it('should return the provided data', function(done) {
      var c = new Collection('foo', {db: db.create(TEST_DB), config: { properties: {count: {type: 'number'}}}});

      c.save({body: {count: 1}}, function (err, item) {
        c.find({}, function (err, items) {
          expect(items.length).to.equal(1);
          done(err);
        });
      });
    });

    it('should return the provided data in sorted order', function(done) {
      var c = new Collection('sort', { db: db.create(TEST_DB), config: { properties: {count: {type: 'number'}}}});

      c.save({body: {count: 1}}, function (err, item) {
        c.save({body: {count: 3}}, function (err, item) {
          c.save({body: {count: 2}}, function (err, item) {
            c.find({query: {$sort: {count: 1}}}, function (err, items) {
              expect(items.length).to.equal(3);
              for(var i = 0; i < 3; i++) {
                delete items[i].id;
              }
              expect(items).to.eql([{count: 1}, {count: 2}, {count: 3}]);
              done(err);
            });
          });
        });
      });
    });
  });

  describe('.execCommands(type, obj)', function() {
    it('$inc - should increment numbers', function() {
      var c = new Collection()
        , item = {count: 7};

      c.execCommands('update', item, {count: {$inc: 7}});
      expect(item.count).to.equal(14);
      c.execCommands('update', item, {count: {$inc: -7}});
      expect(item.count).to.equal(7);
    });

    it('$push - should add an object to an array', function() {
      var c = new Collection()
        , item = {names: ['joe', 'bob']};

      c.execCommands('update', item, {names: {$push: 'sam'}});
      expect(item.names).to.eql(['joe', 'bob', 'sam']);
    });

    it('$pushAll - should add an array of objects to an array', function() {
      var c = new Collection()
        , item = {names: ['joe', 'bob']};

      c.execCommands('update', item, {names: {$pushAll: ['jim', 'sam']}});
      expect(item.names).to.eql(['joe', 'bob', 'jim', 'sam']);
    });

    it('should not throw', function() {
      var c = new Collection()
        , item = {names: 78};

      c.execCommands('update', item, {names: {$pushAll: ['jim', 'sam']}});
    });
  });
});