var Resource = require('../lib/resource');
var Context = require('../lib/context');

describe('Context', function() {

  it('should have a url property', function(done) {
    freq('/foo/bar', null, function(req, res) {
      var r = new Resource({path: '/foo'});
      var ctx = new Context(r, req, res);

      expect(ctx.url).to.equal('/bar');
      done();
    });
  });

});