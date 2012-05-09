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
  
})