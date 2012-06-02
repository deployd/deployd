var Resource = require('../lib/resource')
  , Context = require('../lib/context')
  , Stream = require('stream').Stream;

describe('Context', function() {

  describe('.url', function() {
    it('should not have the base url', function(done) {
      freq('/foo/bar', null, function(req, res) {
        var r = new Resource({path: '/foo'});
        var ctx = new Context(r, req, res);

        expect(ctx.url).to.equal('/bar');
        done();
      });
    });  
  });
  

  describe('.parseBody()', function() {
    beforeEach(function() {
      this.r = new Resource({path: '/foo'});
      this.req = new Stream();
      this.req.url = '/foo';
      this.res = new Stream();
      this.req.headers =  {'content-type': 'application/json'};
    });

    it ('should parse json', function(done) {
      var obj = {foo: 'bar'}
        , ctx = new Context(this.r, this.req, this.res);

      ctx.parseBody(function(err, result) {
        expect(err).to.not.exist;
        expect(result).to.eql(obj);
        done();
      });
      this.req.emit('data', JSON.stringify(obj));
      this.req.emit('end');
    });

    it('should parse json in chunks', function(done) {
      var ctx = new Context(this.r, this.req, this.res)
        , test = this;

      var chunks = ['{"fo',
                  , 'o": "bar"'
                  , ', "bar"'
                  , ': "baz"'
                  , '}'];

      ctx.parseBody(function(err, result) {
        expect(err).to.not.exist;
        expect(result).to.eql({"foo": "bar", "bar": "baz"});
        done();
      });
      chunks.forEach(function(c) {
        test.req.emit('data', c);
      })
      test.req.emit('end');
    });

    it('should parse a form url-encoded value', function(done) {
      var ctx = new Context(this.r, this.req, this.res)
        , value = "foo=bar&bar=baz";

      this.req.headers['content-type'] = 'application/x-www-form-urlencoded';
      ctx.parseBody(function(err, result) {
        expect(err).to.not.exist;
        expect(result).to.eql({"foo": "bar", "bar": "baz"});
        done();
      });
      this.req.emit('data', value);
      this.req.emit('end');
    });
  });



});