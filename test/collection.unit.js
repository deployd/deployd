var Collection = require('../lib/resources/collection')
  , db = require('../lib/db');

describe('collection', function(){
  describe('.validate(req)', function(){
    it('should validate the request', function() {
      var r = new Collection({
        properties: {
          title: {
            type: 'string'
          }
        }
      });
      
      var errs = r.validate({title: 'foobar'});
      
      expect(errs).to.not.exist;
    })
    
    it('should fail to validate the invalid request', function() {
      var r = new Collection({
        properties: {
          title: {
            type: 'string'
          }
        }
      });
      
      var errs = r.validate({title: 7});
      
      expect(errs).to.eql({'title': 'must be a string'});
    })
    
    it('should fail to validate the invalid request with multiple errors', function() {
      var r = new Collection({
        properties: {
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
        }
      });
      
      var errs = r.validate({title: 7, created: 'foo'});
      
      expect(errs).to.eql({title: 'must be a string', age: 'is required', created: 'must be a date'});
    })
  })
  
  describe('.sanitize(body)', function(){
    it('should remove properties outside the schema', function() {
      var r = new Collection({
        properties: {
          title: {
            type: 'string'
          }
        }
      });
      
      var sanitized = r.sanitize({foo: 7, bar: 8, title: 'foo'});
      
      expect(sanitized.foo).to.not.exist;
      expect(sanitized.bar).to.not.exist;
      expect(sanitized.title).to.equal('foo');
    })
    
    it('should convert int strings to numbers', function() {
      var r = new Collection({
        properties: {
          age: {
            type: 'number'
          }
        }
      });
      
      var sanitized = r.sanitize({age: '22'});
      expect(sanitized.age).to.equal(22);
    })
  })
  
  describe('.authorize(method, query)', function(){
    it('should allow users to GET Collections', function() {
      var r = new Collection();
      var err = r.authorize('GET', {});
      expect(err).to.not.exist;
    })
    
    it('should not allow users to PUT Collections without an _id', function() {
      var r = new Collection();
      var errs = r.authorize('PUT', {});
      expect(errs).to.exist;
    })
    
    it('should not allow users to DELETE Collections without an _id', function() {
      var r = new Collection();
      var errs = r.authorize('DELETE', {});
      expect(errs).to.exist;
    })
  })
  
  describe('.handle(req, res)', function(){
    it('should have a store', function() {
      var c = new Collection({path: '/foo', db: db.connect(TEST_DB)});
      expect(c.store).to.exist;
    })
    
    function example(method, path, properties, body, query, test, done, testData) {
      var c = new Collection({path: path, db: db.connect(TEST_DB), properties: properties});
      
      function t() {
        freq(path, {method: method, body: body, json: true}, function (req, res) {
          // faux body
          req.body = body;
          c.handle(req, res);
        }, function (req, res) {       
          test(req, res, method, path, properties, body, query);
          // cleanup
          c.store.remove(function (err) {
            done(err);
          })
        })
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
    })
    
    it('should handle GET', function(done) {
      var testData = [{test: true}, {test: false}];
      example('GET', '/foo', {test: {type: 'boolean'}}, null, null,
        function (req, res, method, path, properties, body) {
          expect(res.statusCode).to.equal(200);
        },
        done,
        testData
      );
    })
    
    it('should handle PUT', function(done) {
      var testData = [{test: true}, {test: false}];
      example('PUT', '/foo', {test: {type: 'boolean'}}, {test: false, _id: 7}, null,
        function (req, res, method, path, properties, body) {
          expect(res.statusCode).to.equal(200);
        },
        done,
        testData
      );
    })
    
    it('should handle DELETE', function(done) {
      example('DELETE', '/foo', {test: {type: 'boolean'}}, {test: false, _id: 7}, null,
        function (req, res, method, path, properties, body) {
          expect(res.statusCode).to.equal(200);
        },
        done
      );
    })
  })
  
  describe('.bind(settings)', function(){
    it('should bind events', function(done) {
      var settings = {path: '/foo', onGet: 'this.foo = Math.random();'}
        , c = new Collection();
        
      c.bind(settings).on('completedGet', function (result) {
        var item = result[0];
        expect(item.foo >= 0 && item.foo <= 1).to.equal(true);
        done();
      })
      
      freq('/foo', {}, function (req, res) {
        c.emit('after:get', [{foo: 0}], req, res);
      })
    })
  })
})