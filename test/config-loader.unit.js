var configLoader = require('../lib/config-loader')
  , sh = require('shelljs')
  , path = require('path')
  , fs = require('fs')
  , db = require('../lib/db').create({name: 'test-db', host: 'localhost', port: 27017})
  , Server = require('../lib/server')
  , Collection = require('../lib/modules/collection')
  , Files = require('../lib/internal-resources/files')
  , ClientLib = require('../lib/internal-resources/client-lib')
  , InternalResources = require('../lib/internal-resources/internal-resources')
  , InternalModules = require('../lib/internal-resources/internal-modules')
  , Dashboard = require('../lib/internal-resources/dashboard')
  , basepath = './test/support/proj';

describe('config-loader', function() {
  beforeEach(function() {
    if (fs.existsSync(basepath)) {
      sh.rm('-rf', basepath);
    }
    sh.mkdir('-p', basepath);
    ('{}').to(path.join(basepath, 'app.dpd'));
    this.server = new Server();
  });

  describe('.loadConfig()', function() {


    it('should load resources', function(done) {
      this.timeout(10000);
      
      sh.mkdir('-p', path.join(basepath, 'resources/foo'));
      sh.mkdir('-p', path.join(basepath, 'resources/bar'));
      JSON.stringify({type: "Collection", val: 1}).to(path.join(basepath, 'resources/foo/config.json'));
      JSON.stringify({type: "Collection", val: 2}).to(path.join(basepath, 'resources/bar/config.json'));

      configLoader.loadConfig(basepath, this.server, function(err, result) {
        if (err) return done(err);
        var resources = result.resources;
        expect(resources).to.have.length(7);
        expect(resources.filter(function(r) { return r.name == 'foo';})).to.have.length(1);
        expect(resources.filter(function(r) { return r.name == 'bar';})).to.have.length(1);
        done();  
      });
    });

    it('should return a set of resource instances', function(done) {
      sh.mkdir('-p', path.join(basepath, 'resources/foo'));
      JSON.stringify({type: "Collection", properties: {}}).to(path.join(basepath, 'resources/foo/config.json'));

      configLoader.loadConfig(basepath, {db: db}, function(err, result) {

        var resourceList = result.resources;

        expect(resourceList).to.have.length(6);

        expect(resourceList[0].config.properties).to.be.a('object');
        expect(resourceList[0] instanceof Collection).to.equal(true);

        done(err);
      });
    });

    it('should add internal resources', function(done) {
      sh.mkdir('-p', path.join(basepath, 'resources'));

      configLoader.loadConfig(basepath, {}, function(err, result) {
        if (err) return done(err);

        var resourceList = result.resources;

        expect(resourceList).to.have.length(5);

        expect(resourceList[0] instanceof Files).to.equal(true);
        expect(resourceList[1] instanceof ClientLib).to.equal(true);
        expect(resourceList[2] instanceof InternalResources).to.equal(true);
        expect(resourceList[3] instanceof InternalModules).to.equal(true);
        expect(resourceList[4] instanceof Dashboard).to.equal(true);      

        done(err);  
      });
    });

    it('should not attempt to load files', function(done) {
      sh.mkdir('-p', path.join(basepath, 'resources'));
      ('').to(path.join(basepath, 'resources/.DS_STORE'));

      configLoader.loadConfig(basepath, {}, function(err, resourceList) {
        if (err) return done(err);
        done();
      });
    });

    it('should throw a sane error when looking for config.json', function(done) {
      sh.mkdir('-p', path.join(basepath, 'resources/foo'));

      configLoader.loadConfig(basepath, {}, function(err, resourceList) {
        expect(err).to.exist;
        expect(err.message).to.equal("Expected file: " + path.join('resources', 'foo', 'config.json'));
        done();
      });
    });
  });
});