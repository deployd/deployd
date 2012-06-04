var configLoader = require('../lib/config-loader')
  , db = require('../lib/db')
  , sh = require('shelljs')
  , path = require('path')
  , fs = require('fs')
  , mkdirp = require('mkdirp')
  , TEST_DB = {name: 'test-db', host: 'localhost', port: 27017}
  , tester = db.connect(TEST_DB)
  , store = tester.createStore('resources')
  , Store = require('../lib/db').Store
  , basepath = './test/support/proj';

describe('config-loader', function() {
  beforeEach(function(done) {
    if (fs.existsSync(basepath)) {
      sh.rm('-r', basepath);
    }
    sh.mkdir('-p', basepath);
    store.remove(function () {
      store.find(function (err, result) {
        expect(err).to.not.exist;
        expect(result).to.not.exist;
        done(err);
      })
    })
  });

  describe('.loadConfig()', function() {
    it('should load resources into a store', function(done) {
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

      sh.mkdir('-p', path.join(basepath, '/resources'));
      fs.writeFileSync(path.join(basepath, '/resources', '/foo.collection.json'), JSON.stringify(resource1));
      fs.writeFileSync(path.join(basepath, '/resources', '/bar.collection.json'), JSON.stringify(resource2));

      configLoader.loadConfig(basepath, store, function() {
        store.find(function(err, resources) {
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
        })
        
      });

      
    });

    it('should update items already in a store', function(done) {
      var resource1 = {
          'path': '/foo'
        , 'type': 'Collection'
        , 'property': 'value'
      };
      var resource2 = {
          'path': '/bar'
        , 'type': 'Collection'
        , 'test': 'old'
      };
      var oldResource = {
          'path': '/baz'
        , 'type': 'Collection'
        , 'delete': 'this'
      }
      
      store.insert([resource1, resource2, oldResource], function() {
        resource2.test = 'value';

        sh.mkdir('-p', path.join(basepath, '/resources'));
        fs.writeFileSync(path.join(basepath, '/resources', '/foo.collection.json'), JSON.stringify(resource1));
        fs.writeFileSync(path.join(basepath, '/resources', '/bar.collection.json'), JSON.stringify(resource2));

        configLoader.loadConfig(basepath, store, function() {
          store.find(function(err, resources) {
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
          })
        });
      });
    });
  });
});