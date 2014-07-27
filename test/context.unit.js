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
});