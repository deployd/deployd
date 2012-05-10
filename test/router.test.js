/**
 * Router Unit Test
 */

describe('Router Middleware', function(){

  var router = require('mdoq').use(require('../lib/router'))
  
  it('should determine filename', function(done) {
    router.use('/index.html').get(function () {
      expect(this.req.filename).to.equal('index.html');
      done();
    })
  })
  
  it('should determine nested filenames', function(done) {
    router.use('/a/b/c/d/e/f/g/h/index.html').get(function () {
      expect(this.req.filename).to.equal('index.html');
      done();
    })
  })
  
  it('should determine the resource path', function(done) {
    router.use('/').get(function () {
      expect(this.req.resource.path).to.equal('/');
      expect(this.req.resource.type).to.equal('Static');
      done();
    })
  })
  
  
  it('should find resources by id', function(done) {
    // use a fake id, but it should validate as an id
    var _id = '4faaed0cbc270e7992000043';
    router.use('/todos/' + _id).get(function () {
      expect(this.req._id).to.equal(_id);
      expect(this.req.query._id).to.equal(_id);
      expect(this.req.filename).to.not.exist;
      done();
    })
  })
  
  it('should only find resources at their paths', function(done) {
    router.use('/todos/foo').get(function () {
      expect(this.req.resource).to.not.exist;
      done();
    })
  })
  
})