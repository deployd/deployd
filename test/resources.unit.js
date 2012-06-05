var resources = require('../lib/resources')
  , InternalResources = resources.InternalResources
  , Files = require('../lib/resources/files')
  , config = require('../lib/config-loader')
  , sh = require('shelljs')
  , fs = require('fs')
  , db = require('../lib/db').connect({name: 'test-db', host: 'localhost', port: 27017})
  , testCollection = {type: 'Collection', path: '/my-objects', properties: {title: {type: 'string'}}}
  , Collection = require('../lib/resources/collection')
  , configPath = './test/support/proj';

describe('resources', function(){
  describe('.build(resourceConfig, server)', function(){
    it('should return a set of resource instances', function() {
      var resourceList = resources.build([testCollection], {db: db});
      expect(resourceList).to.have.length(3);

      expect(resourceList[0].properties).to.be.a('object');
      expect(resourceList[0] instanceof Collection).to.equal(true);
    });

    it('should add internal resources', function() {
      var resourceList = resources.build([], {});
      expect(resourceList).to.have.length(2);

      expect(resourceList[0] instanceof InternalResources).to.equal(true);
      expect(resourceList[1] instanceof Files).to.equal(true);
    });
  })
})

describe('InternalResources', function() {
  describe('.handle(ctx)', function() {
    beforeEach(function(done) {
      this.ir = new InternalResources({path: '/__resources', configPath: configPath}, {});
      config.saveConfig([], configPath, function(err) {
        done(err);
      })
    });

    it('should create a resource when handling a POST request', function(done) {
      var r = {path: '/foo', type: 'Bar'}
        , created = false;

      this.ir.handle({req: {method: 'POST', url: '/__resources'}, body: r, done: function(resource) {
        expect(resource.path).to.equal('/foo');
        expect(resource.type).to.equal('Bar');
        config.loadConfig(configPath, function(err, resourceList) {
          expect(resourceList).to.have.length(1);
        });
        done();
      }});
    });

    it('should updating a resource when handling a PUT request', function(done) {
      var r = {path: '/foo', type: 'Bar', val: 1};
      var test = this;

      config.saveConfig([r], configPath, function(err) {

        r.val = 2;
        test.ir.handle({req: {method: 'PUT', url: '/__resources/0'}, url: '/0', body: r, done: function() {

          config.loadConfig(configPath, function(err, resourceList) {
            expect(resourceList).to.have.length(1);
            expect(resourceList[0].val).to.equal(2);
            done();
          });
        }}, function() {
          throw Error("next called");
        });
      });
    });

    it('should find all resources when handling a GET request', function(done) {
      var q = {path: '/foo', type: 'Bar'}
        , q2 = {path: '/bar', type: 'Bar'}
        , test = this;

      config.saveConfig([q, q2], configPath, function() {
        test.ir.handle({req: {method: 'GET', url: '/__resources'}, url: '/', done: function(result) {
          expect(result).to.have.length(2);
          result.forEach(function(r) {
            expect(r.id).to.exist;
          });
          done();
        }}, function() {
          throw Error("next called");
        });
      });
    });
  });
});