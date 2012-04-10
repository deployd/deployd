describe("Dashboard", function() {

  it('should redirect from root', function(done) {
    dashboard.get(function(err, result) {
      expect(result).to.exist;
      done(err);
    });
  });

  it('should render HTML', function(done) {
    dashboard.use('/').get(function(err, result) {
      expect(result).to.exist;
      expect(result.indexOf('<!DOCTYPE html>')).to.not.equal(-1);
      done(err);
    });
  });  

  it('should return a static asset from a folder', function(done) {
    dashboard.use('/js/app.js').get(function(err, result) {
      expect(result).to.exist;
      done(err);
    });
  });

  it('should return a 404 for a bad filename', function(done) {
    dashboard.use('/bogus/file').get(function(err, result) {
      expect(result).to.not.exist;
      done();
    });
  });
});