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

      fs.writeFileSync(path.join(basepath, '/app.dpd'), JSON.stringify({'123': resource1, '456': resource2}));

      configLoader.loadConfig(basepath, function(err, resources) {
        expect(Object.keys(resources)).to.have.length(2);
        expect(resources['123'].path).equal('/foo');
        expect(resources['123'].type).equal('Collection');
        expect(resources['123'].property).equal('value');
        expect(resources['456'].path).equal('/bar');
        expect(resources['456'].type).equal('Collection');
        expect(resources['456'].test).equal('value');
        
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

      configLoader.saveConfig({'123': resource1, '456': resource2}, basepath, function(err) {
        var resourcePath = path.join(basepath, '/app.dpd');
        
        var resources = JSON.parse(fs.readFileSync(resourcePath));

        expect(Object.keys(resources)).to.have.length(2);
        expect(resources['123']).to.eql(resource1);
        expect(resources['456']).to.eql(resource2);

        done(err);
      });
    });
  });
});