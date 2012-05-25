var Collection = require('../lib/resources/collection');

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
  
  describe('.authorize()', function(){
    it('should allow users to GET Collections', function(done) {
      freq('/foo', {}, function (req, res) {
        var r = new Collection({}, req, res);
        var errs = r.authorize();
        done(errs);
      })
    })
    
    it('should not allow users to PUT Collections without an _id', function(done) {
      freq('/foo', {method: 'PUT'}, function (req, res) {
        var r = new Collection({}, req, res);
        var errs = r.authorize();
        expect(errs).to.exist;
        done();
      })
    })
    
    it('should not allow users to DELETE Collections without an _id', function(done) {
      freq('/foo', {method: 'DELETE'}, function (req, res) {
        var r = new Collection({}, req, res);
        var errs = r.authorize();
        expect(errs).to.exist;
        done();
      })
    })
  })
})