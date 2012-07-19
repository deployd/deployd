var Deployment = require('../lib/client/deploy').Deployment
  , sh = require('shelljs')
  , http = require('http')
  , fs = require('fs');

describe('Deployment', function(){
  it('should sanitize the name', function() {
    var d = new Deployment(__dirname + '/../test-app', 'ritch');
    
    expect(d.name).to.equal('test-app');
    expect(d.user).to.equal('ritch');
  });
  
  it('should allow a custom subdomain', function() {
    var d = new Deployment(__dirname + '/../test-app', 'ritch', 'custom-subdomain');
    
    expect(d.name).to.equal('custom-subdomain');
    expect(d.user).to.equal('ritch');
    expect(d.subdomain).to.equal(d.name);
  });
  
  function shouldSanitizeAs(input, output) {
    expect(Deployment.prototype.sanitize(input)).to.equal(output);    
  }
  
  it('should sanitize all the following names', function() {
    shouldSanitizeAs(' a b c ', 'a-b-c');
    shouldSanitizeAs('a     b', 'a-b');
    shouldSanitizeAs('a.b.c', 'a-b-c');    
  });
  
  function shouldError(input) {
    try {
      Deployment.prototype.sanitize(input);
    } catch(e) {
      return;
    }
    
    throw new Error('should have errored for input: ' + input);
  }
  
  it('should error for the following names', function() {
    shouldError('???');
    shouldError('');
    shouldError('-');
    shouldError('');
    shouldError('/');
    shouldError('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa');
  });
  
  describe('.package()', function () {
    it('should create a package of the given app', function(done) {
      var d = new Deployment(__dirname + '/../test-app', 'ritch')
        , tarball = d.path + '/.dpd/package.tgz';
      
      d.package(tarball, function (err) {
        done(err);
        sh.rm(tarball);
      });
    });
  });

  describe('.publish()', function() {
    it('should make an http request to POSTing a tar, username, key, and subdomain', function(done) {
      var d = new Deployment(__dirname + '/../test-app', 'ritch')
        , tar = __dirname + '/../test-app/.dpd/package.tgz'
        , port = 7007
        , requested = false
        , url = 'http://localhost:' + port + '/'
        , key = Math.random().toString()
        , size = 0;


      http.createServer(function (req, res) {
        req
          .on('data', function (data) {
            size += data.length;
          })
          .on('end', function () {
            res.end();
          });
        expect(req.method).to.equal('POST');
        expect(req.headers['x-remote-key']).to.equal(key);
        expect(req.headers['x-app-user']).to.equal(d.user);
        expect('http://' + req.headers.host + req.url).to.equal(url);
        requested = true;
      })
      .listen(port)
      .on('listening', function () {      
        d.package(tar, function (err) {
          d.publish(url, tar, key, function (err) {
            if(err) console.log(err);
            expect(size).to.equal(fs.statSync(tar).size);
            if(!requested) throw new Error('failed to make a request to the server');
            done();
            sh.rm(tar);
          });
        });
      });
    });

    it('should error gracefully', function(done) {
      var d = new Deployment(__dirname + '/../test-app', 'test-app', 'ritch')
        , tar = __dirname + '/../test-app/.dpd/package.tgz'
        , port = 7008
        , requested = false
        , url = 'http://localhost:' + port + '/'
        , key = Math.random().toString()
        , errMessage = 'an error occured';


      http.createServer(function (req, res) {
        res.statusCode = 500;
        res.end(errMessage);
        requested = true;
      })
      .listen(port)
      .on('listening', function () {      
        d.package(tar, function (err) {
          d.publish(url, tar, key, function (err) {
            expect(err.message).to.equal(errMessage);
            if(!requested) throw new Error('failed to make a request to the server');
            done();
            sh.rm(tar);
          });
        });
      });
    });
  });
});