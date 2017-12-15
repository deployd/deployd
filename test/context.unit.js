var Resource = require('../lib/resource')
  , Context = require('../lib/context')
  , Stream = require('stream').Stream;

describe('Context', function() {

  describe('.url', function() {
    it('should not have the base url', function(done) {
      freq('/foo/bar', null, function(req, res) {
        var r = new Resource('foo', {});
        var ctx = new Context(r, req, res, {});

        expect(ctx.url).to.equal('/bar');
        done();
      });
    });  
  });

  describe('.done', function() {
    it('should provide default headers', function(done) {
      freq('/foo/bar', null, function(req, res) {
        var r = new Resource('foo', {});
        var ctx = new Context(r, req, res, {});
        
        var response = 'callback(123)';

        ctx.done(null, response);
        expect(ctx.res.getHeader('Content-Type')).to.equal('text/html; charset=utf-8');
        expect(ctx.res.getHeader('Cache-Control')).to.equal('no-cache, no-store, must-revalidate');
        expect(ctx.res.getHeader('Pragma')).to.equal('no-cache');
        expect(ctx.res.getHeader('Expires')).to.equal('0');
        expect(ctx.res.getHeader('Content-Length')).to.equal(response.length);

        done();
      });
    });  

    it('should not overwrite headers', function(done) {
      freq('/foo/bar', null, function(req, res) {
        var r = new Resource('foo', {});
        var ctx = new Context(r, req, res, {});
        
        ctx.res.setHeader('Content-Type', 'text/javascript');
        ctx.done(null, 'callback(123)');
        expect(ctx.res.getHeader('Content-Type')).to.equal('text/javascript');
        done();
      });
    });  
  });
});