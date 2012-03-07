describe('Types', function(){
  describe('GET /types', function(){
    it('should return an object describing all the available types', function(done) {
      types.get(function (err, all) {
        expect(all).to.be.a('object');
        expect(all).to.eql(require('../lib/types'));
        done(err);
      })
    })
  })
})