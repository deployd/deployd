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
    
    it('should proxy the request into its store', function(done) {  
      var c = new Collection({path: '/foo', db: db.connect(TEST_DB)});
      freq('/foo', {body: {test: true}, json: true}, function (req, res) {
        c.handle(req, res);
      }, function (req, res) {
        expect(req.body).to.eql({test: true});
        expect(res.statusCode).to.equal(200);
        c.store.first({test: true}, function (err, res) {
          expect(res).to.eql({test: true});
          done(err);
        })
      })
    })
  })
})