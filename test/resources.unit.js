var InternalResources = require('../lib/resources/internal-resources')
  , Files = require('../lib/resources/files')
  , config = require('../lib/config-loader')
  , sh = require('shelljs')
  , fs = require('fs')
  , path = require('path')
  , testCollection = {type: 'Collection', path: '/my-objects', properties: {title: {type: 'string'}}}
  , Collection = require('../lib/resources/collection')
  , ClientLib = require('../lib/resources/client-lib')
  , configPath = './test/support/proj'
  , Dashboard = require('../lib/resources/dashboard');

describe('InternalResources', function() {
  describe('.handle(ctx)', function() {
    beforeEach(function() {
      // reset
      sh.rm('-rf', __dirname + '/support/proj');
      if(!sh.test('-d', __dirname + '/support/proj')) {
        sh.mkdir(__dirname + '/support/proj');
        sh.mkdir('-p', __dirname + '/support/proj/resources');
      }

      this.ir = new InternalResources('__resources', {config: {configPath: configPath}});
    });


    it('should require root access', function(done) {
      var r = {type: 'Bar'}
        , created = false;

      this.ir.handle({req: {method: 'POST', url: '/__resources/foo'}, body: r, done: function(err, resource) {
        expect(resource).to.not.exist;
        expect(err).to.exist;
        expect(err.statusCode).to.equal(401);
        done();
      }});
    });

    it('should not allow a generic POST', function(done) {
      var r = {type: 'Bar'}
        , created = false;

      this.ir.handle({req: {method: 'POST', url: '/__resources', isRoot: true}, body: r, done: function(err, resource) {
        expect(resource).to.not.exist;
        expect(err).to.exist;
        expect(err.statusCode).to.equal(400);
        done();
      }});
    });


    it('should create a resource when handling a POST request', function(done) {
      var r = {type: 'Bar'}
        , created = false;

      this.ir.handle({req: {method: 'POST', url: '/__resources/foo', isRoot: true}, url: '/foo', body: r, done: function(err, resource) {
        if (err) return done(err);
        expect(resource.type).to.equal('Bar');
        var file = path.join(configPath, '/resources/foo/config.json');
        expect(sh.test('-f', file)).to.be.ok;
        expect(JSON.parse(sh.cat(file)).type).to.equal('Bar');
        done();
      }});
    });

    it('should save a file when handling a POST request', function(done) {
      var r = {type: 'Bar'}
        , created = false;

      sh.mkdir('-p', path.join(configPath, 'resources/foo'));
      JSON.stringify(r).to(path.join(configPath, 'resources/foo/config.json'));

      this.ir.handle({req: {method: 'POST', url: '/__resources/foo/get.js', isRoot: true}, url: '/foo/get.js', body: {value: "this.foo = 'bar';"}, done: function(err, resource) {
        if (err) return done(err);
        var fileVal = sh.cat(path.join(configPath, 'resources/foo/get.js'));
        expect(fileVal.toString()).to.exist.and.to.equal("this.foo = 'bar';");
        done();
      }});
    });

    it('should update a resource when handling a PUT request', function(done) {
      var r = {type: 'Bar', val: 1};
      var test = this;

      sh.mkdir('-p', path.join(configPath, 'resources/foo'));
      JSON.stringify(r).to(path.join(configPath, 'resources/foo/config.json'));

      r.val = 2;
      test.ir.handle({req: {method: 'PUT', url: '/__resources/foo', isRoot: true}, url: '/foo', body: r, done: function() {
        var file = path.join(configPath, '/resources/foo/config.json');
        expect(JSON.parse(sh.cat(file)).val).to.equal(2);
        done();
      }}, function() {
        throw Error("next called");
      });

    });

    it('should partially update a resource when handing a PUT request', function(done) {
      var r = {type: 'Bar', val: 1, other: 'test'};
      var test = this;

      sh.mkdir('-p', path.join(configPath, 'resources/foo'));
      JSON.stringify(r).to(path.join(configPath, 'resources/foo/config.json'));
      test.ir.handle({req: {method: 'PUT', url: '/__resources/foo', isRoot: true}, url: '/foo', body: {val: 2}, done: function() {
        var file = path.join(configPath, '/resources/foo/config.json');
        var json = JSON.parse(sh.cat(file));
        expect(json.val).to.equal(2);
        expect(json.other).to.equal('test');
        done();
      }}, function() {
        throw Error("next called");
      });

    });

    it('should update a resource when handing a PUT request with $setAll', function(done) {
      var r = {type: 'Bar', val: 1, other: 'test'};
      var test = this;

      sh.mkdir('-p', path.join(configPath, 'resources/foo'));
      JSON.stringify(r).to(path.join(configPath, 'resources/foo/config.json'));
      test.ir.handle({req: {method: 'PUT', url: '/__resources/foo', isRoot: true}, url: '/foo', body: {type: 'Bar', val: 2, $setAll: true}, done: function() {
        var file = path.join(configPath, '/resources/foo/config.json');
        var json = JSON.parse(sh.cat(file));

        expect(json.val).to.equal(2);
        expect(json.other).to.not.exist;
        done();
      }}, function() {
        throw Error("next called");
      });

    });

    it('should find all resources when handling a GET request', function(done) {
      var q = {type: 'Bar'}
        , q2 = {type: 'Bar'}
        , test = this;

      sh.mkdir('-p', path.join(configPath, 'resources/foo'));
      sh.mkdir('-p', path.join(configPath, 'resources/bar'));
      JSON.stringify(q).to(path.join(configPath, 'resources/foo/config.json'));
      JSON.stringify(q2).to(path.join(configPath, 'resources/bar/config.json'));

      test.ir.handle({req: {method: 'GET', url: '/__resources', isRoot: true}, url: '/', done: function(err, result) {
        if (err) return done(err);
        expect(result).to.have.length(2);
        result.forEach(function(r) {
          expect(r.id).to.exist;
        });
        done();
      }}, function() {
        throw Error("next called");
      });
    });

    it('should find a single resource when handling a GET request', function(done) {
      var q = {type: 'Bar'}
        , q2 = {type: 'Bar'}
        , test = this;

      sh.mkdir('-p', path.join(configPath, 'resources/foo'));
      sh.mkdir('-p', path.join(configPath, 'resources/bar'));
      JSON.stringify(q).to(path.join(configPath, 'resources/foo/config.json'));
      JSON.stringify(q2).to(path.join(configPath, 'resources/bar/config.json'));

      test.ir.handle({req: {method: 'GET', url: '/__resources/bar', isRoot: true}, url: '/bar', done: function(err, result) {
        if (err) return done(err);
        expect(result).to.exist;
        expect(result.id).to.equal('bar');
        expect(result.type).to.equal('Bar');
        done();
      }}, function() {
        throw Error("next called");
      });
    });

    it('should delete a resource when handling a DELETE request', function(done) {
      var q = {path: '/foo', type: 'Bar'}
        , q2 = {path: '/bar', type: 'Bar'}
        , test = this;

        sh.mkdir('-p', path.join(configPath, 'resources/foo'));
        sh.mkdir('-p', path.join(configPath, 'resources/bar'));
        JSON.stringify(q).to(path.join(configPath, 'resources/foo/config.json'));
        JSON.stringify(q2).to(path.join(configPath, 'resources/bar/config.json'));

        test.ir.handle({req: {method: 'DELETE', url: '/__resources/bar', isRoot: true}, url: '/bar', done: function() {
          expect(sh.test('-d', path.join(configPath, 'resources/bar'))).to.not.be.ok;
          done();
        }}, function() {
          throw Error("next called");
        });
    });

    it('should call callbacks for config changes with errors', function(done) {
      var file = path.join(configPath, 'resources/foo/config.json');

      sh.mkdir('-p', path.join(configPath, 'resources/foo'));
      JSON.stringify({type: 'Foo'}).to(file);

      this.ir.handle(
        {
          server: {
            resources: [
              {
                name: 'foo',
                config: {},
                configChanged: function(config, fn){
                  return fn('ERROR');
                }
              }
            ]
          },
          url: '/foo',
          body: {type: 'Foo', value: {something: 'new config'}},
          req: {
            method: 'PUT',
            url: '/__resources/foo',
            isRoot: true
          },
          done: function(err){
            expect(err).to.exist.and.to.equal('ERROR');
            done();
          }
      }
    );


    });
    it('should call callbacks for resource deletion with errors', function(done) {
      var file = path.join(configPath, 'resources/foo/config.json');

      sh.mkdir('-p', path.join(configPath, 'resources/foo'));
      JSON.stringify({type: 'Foo'}).to(file);

      this.ir.handle(
        {
          server: {
            resources: [
              {
                name: 'foo',
                config: {},
                configDeleted: function(config, fn){
                  return fn('ERROR');
                }
              }
            ]
          },
          url: '/foo',
          body: {type: 'Foo', value: {something: 'new config'}},
          req: {
            method: 'DELETE',
            url: '/__resources/foo',
            isRoot: true
          },
          done: function(err){
            expect(err).to.exist.and.to.equal('ERROR');
            done();
          }
        }
      );
    });
  });
});
