var resources = require('../lib/resources')
  , InternalResources = resources.InternalResources
  , Files = require('../lib/resources/files')
  , config = require('../lib/config-loader')
  , sh = require('shelljs')
  , fs = require('fs')
  , db = require('../lib/db').connect({name: 'test-db', host: 'localhost', port: 27017})
  , testCollection = {type: 'Collection', path: '/my-objects', properties: {title: {type: 'string'}}}
  , Collection = require('../lib/resources/collection')
  , ClientLib = require('../lib/resources/client-lib')
  , configPath = './test/support/proj'
  , Dashboard = require('../lib/resources/dashboard');

describe('resources', function(){
  describe('.build(resourceConfig, server)', function(){
    it('should return a set of resource instances', function(done) {
      resources.build([testCollection], {db: db}, function(err, resourceList) {
        expect(resourceList).to.have.length(5);

        expect(resourceList[0].properties).to.be.a('object');
        expect(resourceList[0] instanceof Collection).to.equal(true);

        done(err);
      });
    });

    it('should add internal resources', function(done) {
      resources.build([], {}, function(err, resourceList) {
        expect(resourceList).to.have.length(4);

        expect(resourceList[0] instanceof Files).to.equal(true);
        expect(resourceList[1] instanceof ClientLib).to.equal(true);
        expect(resourceList[2] instanceof InternalResources).to.equal(true);
        expect(resourceList[3] instanceof Dashboard).to.equal(true);      

        done(err);  
      });
    });
  })
})

describe('InternalResources', function() {
  describe('.handle(ctx)', function() {
    beforeEach(function(done) {
      // reset
      sh.rm('-rf', __dirname + '/support/proj');
      if(!sh.test('-d', __dirname + '/support/proj')) {
        sh.mkdir(__dirname + '/support/proj');
      }
      
      this.ir = new InternalResources({path: '/__resources', configPath: configPath}, {});
      config.saveConfig({}, configPath, function(err) {
        done(err);
      });
    });


    it('should require root access', function(done) {
      var r = {path: '/foo', type: 'Bar'}
        , created = false;

      this.ir.handle({req: {method: 'POST', url: '/__resources'}, body: r, done: function(err, resource) {
        expect(resource).to.not.exist;
        expect(err).to.exist;
        expect(err.statusCode).to.equal(401);
        done();
      }});
    });

    it('should create a resource when handling a POST request', function(done) {
      var r = {path: '/foo', type: 'Bar'}
        , created = false;

      this.ir.handle({req: {method: 'POST', url: '/__resources', isRoot: true}, body: r, done: function(err, resource) {
        expect(resource.path).to.equal('/foo');
        expect(resource.type).to.equal('Bar');
        config.loadConfig(configPath, function(err, resourceList) {
          expect(Object.keys(resourceList)).to.have.length(1);
        });
        done();
      }});
    });

    it('should update a resource when handling a PUT request', function(done) {
      var r = {path: '/foo', type: 'Bar', val: 1};
      var test = this;

      config.saveConfig({'foo': r}, configPath, function(err) {

        r.val = 2;
        test.ir.handle({req: {method: 'PUT', url: '/__resources/foo', isRoot: true}, url: '/foo', body: r, done: function() {

          config.loadConfig(configPath, function(err, resourceList) {
            expect(Object.keys(resourceList)).to.have.length(1);
            expect(resourceList['foo'].val).to.equal(2);
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

      config.saveConfig({'foo': q, 'bar': q2}, configPath, function() {
        test.ir.handle({req: {method: 'GET', url: '/__resources', isRoot: true}, url: '/', done: function(err, result) {
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

    it('should find a single resource when handling a GET request', function(done) {
      var q = {path: '/foo', type: 'Bar'}
        , q2 = {path: '/bar', type: 'Bar'}
        , test = this;

      config.saveConfig({'foo': q, 'bar': q2}, configPath, function() {
        test.ir.handle({req: {method: 'GET', url: '/__resources/bar', isRoot: true}, url: '/bar', done: function(err, result) {
          expect(result).to.eql(q2);
          done();
        }}, function() {
          throw Error("next called");
        });
      });
    });

    it('should delete a resource when handling a DELETE request', function(done) {
      var q = {path: '/foo', type: 'Bar'}
        , q2 = {path: '/bar', type: 'Bar'}
        , test = this;

        config.saveConfig({'foo': q, 'bar': q2}, configPath, function() {
          test.ir.handle({req: {method: 'DELETE', url: '/__resources/bar', isRoot: true}, url: '/bar', done: function() {
            config.loadConfig(configPath, function(err, result) {
              expect(Object.keys(result)).to.have.length(1);
              done(err);
            });
            
          }}, function() {
            throw Error("next called");
          });
        });
    });
  });
});