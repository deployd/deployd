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

      // fs.writeFileSync(path.join(basepath, '/app.dpd'), JSON.stringify({'123': resource1, '456': resource2}));

      configLoader.saveConfig({'123': resource1, '456': resource2}, basepath, function(err) {
        configLoader.loadConfig(basepath, function(err, resources) {
          
          expect(Object.keys(resources)).to.have.length(2);
          expect(resources['foo'].path).equal('/foo');
          expect(resources['foo'].type).equal('Collection');
          expect(resources['foo'].property).equal('value');
          expect(resources['bar'].path).equal('/bar');
          expect(resources['bar'].type).equal('Collection');
          expect(resources['bar'].test).equal('value');

          done();
        });
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
        
        configLoader.loadConfig(basepath, function(err, resources) {
          expect(Object.keys(resources)).to.have.length(2);
          expect(resources.foo).to.eql(resource1);
          expect(resources.bar).to.eql(resource2);
        });


        done(err);
      });
    });
  });
});