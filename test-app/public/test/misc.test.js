describe('404s', function(){
  it('should not prevent a server from responding', function(done) {
    this.timeout(5000);
    
    var tests = 50;
    var remaining = tests;
    
    while(tests--) {
      dpd('/').post({foo: 'bar'}, function (res, err) {
        remaining--;
        if(!remaining) {
          done();
        }
      });
    }
  });
});