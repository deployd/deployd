var sandbox, scriptSrc;

describe('dpd.js client library', function(){
  beforeEach(function () { 
    sandbox = sinon.sandbox.create();
    // store script src in case we change it from a test
    scriptSrc = document.querySelector('script[src$="dpd.js"]').src;
  });
    
  afterEach(function () { 
    sandbox.restore();
    // restore script src
    document.querySelector('script[src$="dpd.js"]').src = scriptSrc;
    // make dpd.js acknowledge the change of API location
    dpd.setBaseUrl();
  });
  
  function doAsserts(serverUrl, done) {
    sandbox.useFakeServer();
    sandbox.server.respondWith(serverUrl + '/hello', [200, { "Content-Type": "application/json" }, '{ "ok": true }']);
    sandbox.server.autoRespond = true;
    sandbox.stub(io, "connect").returns({ on: function() {} });
    
    dpd.on('test', function(){
      // used to force socket.io to connect
    });
    
    dpd('/hello').get(function (res, err) {
      expect(res).to.exist;
      expect(res.ok).to.be.true;
      expect(io.connect.calledWith(serverUrl)).to.be.true;
      done();
    });
  }
  
  it('should allow overriding server root via setBaseUrl', function(done) {  
    dpd.setBaseUrl('http://the-api-is-here.domain.api:22');
    doAsserts('http://the-api-is-here.domain.api:22', done);
  });
  
  it('should allow overriding server root via script tag src', function(done) {
    // change the src of the script temporarily
    document.querySelector('script[src$="dpd.js"]').src = 'http://the-api-is-there.domain.api:1111/dpd.js';
    dpd.setBaseUrl();
    doAsserts('http://the-api-is-there.domain.api:1111', done);
  });
});
