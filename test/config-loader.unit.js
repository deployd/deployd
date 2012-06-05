var configLoader = require('../lib/config-loader')
  , sh = require('shelljs')
  , path = require('path')
  , fs = require('fs')
  , basepath = './test/support/proj';

describe('config-loader', function() {
  beforeEach(function() {
    if (fs.existsSync(basepath)) {
      sh.rm('-rf', basepath);
    }
    sh.mkdir('-p', basepath);
  });

  describe('.loadConfig()', function() {
    it('should load resources', function(done) {
      var resource1 = {
          'path': '/foo'
        , 'type': 'Collection'
        , 'property': 'value'
      };
      var resource2 = {
          'path': '/bar'
        , 'type': 'Collection'
        , 'test': 'value'
      };

      fs.writeFileSync(path.join(basepath, '/resources.json'), JSON.stringify([resource1, resource2]));

      configLoader.loadConfig(basepath, function(err, resources) {
        expect(resources.length).to.equal(2);
        resources.forEach(function(r) {
          if (r.path === '/foo') {
            expect(r.type).to.equal('Collection');
            expect(r.property).to.equal('value');
          } else if (r.path === '/bar') {
            expect(r.type).to.equal('Collection');
            expect(r.test).to.equal('value');
          } else {
            throw Error("unexpected path " + r.path);
          }
        });
        done();
      });
    });
  });

  describe('.saveConfig()', function() {
    it('should save resources', function(done) {
      var resource1 = {
          'path': '/foo'
        , 'type': 'Collection'
        , 'property': 'value'
      };
      var resource2 = {
          'path': '/bar'
        , 'type': 'Collection'
        , 'test': 'value'
      };

      configLoader.saveConfig([resource1, resource2], basepath, function(err) {
        var resourcePath = path.join(basepath, '/resources.json');
        
        var resources = JSON.parse(fs.readFileSync(resourcePath));

        expect(resources.length).to.equal(2);
        expect(resources[0]).to.deep.equal(resource1);
        expect(resources[1]).to.deep.equal(resource2);

        done(err);
      });
    });
  });
});