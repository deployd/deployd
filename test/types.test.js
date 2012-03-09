describe('Available Types', function(){
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

describe('Property Types', function(){
  describe('GET /property-types', function(){
    it('should return an object describing the availalbe property types', function(done) {
      client.use('/property-types').get(function (err, res) {
        expect(res).to.eql(require('../lib/property-types'));
        done(err);
      })
    })
  })
})