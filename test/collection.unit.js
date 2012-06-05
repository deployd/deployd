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
  
  describe('.handle(ctx)', function(){
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
          req.query = query;
          c.handle({req: req, res: res, session: {}, done: function() {res.end()}});
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
      example('PUT', '/foo', {test: {type: 'boolean'}}, {test: false, id: 7}, null,
        function (req, res, method, path, properties, body) {
          expect(res.statusCode).to.equal(200);
        },
        done,
        testData
      );
    })
    
    it('should handle DELETE', function(done) {
      example('DELETE', '/foo', {test: {type: 'boolean'}}, null, {id: 7},
        function (req, res, method, path, properties, body) {
          expect(res.statusCode).to.equal(200);
        },
        done
      );
    })
  })
  
  describe('.execListener(method, session, query, item, fn)', function(){
    it('should execute a Get listener', function(done) {
      var c = new Collection({
        onGet: 'this.foo = 2 + 2;'
      });
      
      var items = [{foo: 1}, {foo: 1}, {foo: 1}];
      c.execListener('Get', {}, {}, items, function (err) {
        for(var i = 0; i < items.length; i++) {
          expect(items[i].foo).to.equal(4);
        }
        done(err);
      })
    })
    
    it('should be able to perform io', function(done) {
      var widgets = db.connect(TEST_DB).createStore('widgets');
      
      var c = new Collection({
        onGet: 'var item = this; widgets.insert({foo:"bar"}, function(err, widget) { item.id = widget.id })',
        resources: {
          widgets: widgets
        }
      });
      
      var items = [{id: 1}, {id: 1}, {id: 1}];
      c.execListener('Get', {}, {}, items, function (err, result) {
        for(var i = 0; i < items.length; i++) {
          expect(result[i].id).to.not.equal(1);
        }
        done(err);
      })
    })
    
    it('should have access to a validation dsl cancel() method', function(done) {
      var c = new Collection({
        onGet: 'cancel("testing error", 123)'
      });
      
      c.execListener('Get', {}, {}, [{a:'b'}], function (err) {
        expect(err.toString()).to.equal('Error: testing error');
        expect(err.status).to.equal(123);
        done();
      })
    })
    
    it('should have access to a validation dsl hide() method', function(done) {
      var c = new Collection({
        onGet: 'hide("secret")'
      });
      
      var items = [{secret: 'foobar'}];
      c.execListener('Get', {}, {}, items, function (err, result) {
        expect(result[0].secret).to.not.equal('foobar');
        expect(result[0].secret).to.not.exist;
        done();
      })
    })
    
    it('should return errors when the error() method is called', function(done) {
      var c = new Collection({
        onPost: 'error("foo", "must not be bar")'
      });
      
      c.execListener('Post', {}, {}, {foo: 'bar'}, function (err, result) {
        expect(result).to.eql({"foo": "must not be bar"});
        done();
      })
    })
    
    it('should protect values from being changed via protect()', function(done) {
      var c = new Collection({
        onPut: 'protect("foo")'
      });
      
      c.execListener('Put', {}, {}, {foo: 'bar'}, function (err, result) {
        expect(result.foo).to.not.exist;
        done();
      })
    })
  })
})