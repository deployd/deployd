var rewire = require('rewire')
  ,	Server = rewire('../lib/server')
  ,	Db = require('../lib/db').Db
  ,	Store = require('../lib/db').Store
  ,	Router = require('../lib/router')
  ,	sh = require('shelljs')
  ,	sinon = require('sinon');

function MockServer () {}
MockServer.prototype.listen = function () {};

Server.__set__('process', {});
Server.__set__('http', {
  Server: MockServer
});

describe('Server', function() {
  describe('.listen()', function() {
    beforeEach(function() {
      sh.cd('./test/support/proj');
      sh.rm('-rf', 'resources');
      sh.mkdir('resources');
    });

    it('should start a new deployd server', function() {
      var PORT = genPort();
      var opts = {
          port: PORT,
          db: {
            name: 'deployd',
            port: 27017,
            host: '127.0.0.1'
          }
      };
      var server = new Server(opts);

      server.listen();

      expect(server.db instanceof  Db).to.equal(true);
      expect(server.options).to.eql(opts);
    });

    afterEach(function() {
      sh.cd('../../../');
    });
  });

  describe('.createStore(namespace)', function() {
    it('should create a store with the given name', function() {
      var server = new Server()
        ,	store = server.createStore('foo');

      expect(store instanceof Store).to.equal(true);
      expect(server.stores.foo).to.equal(store);
    });
  });


  describe('.route()', function () {
    it('should be on the prototype', function () {
      var server = new Server();
      expect(typeof server.route).to.equal('function');
      expect(server.route.toString()).to.contain('req, res');
    });


    it('should call config.loadConfig', function () {
      var server = new Server();
      var req = {url: 'foo'};
      var res = {body: 'bar'};
      var config = require('../lib/config-loader');
      config.loadConfig = sinon.spy();

      server.route(req, res);

      expect(config.loadConfig.callCount).to.equal(1);
    });


    it('should set a resources array on the server', function () {
      var server = new Server();
      var req = {url: 'foo', headers: {accept: '*'}};
      var res = {body: 'bar', on: function () {}};

      var configLoader = require('../lib/config-loader');
      configLoader.loadConfig = function (path, server, callback) {
        callback.call(server, null, ['foo']);
      };

      expect(Array.isArray(server.resources)).to.equal(false);

      server.route(req, res);

      expect(Array.isArray(server.resources)).to.equal(true);
    });
  });


  describe('.handleRequest()', function () {
    it('should be on the prototype', function () {
      var server = new Server();
      expect(typeof server.handleRequest).to.equal('function');
      expect(server.handleRequest.toString()).to.contain('req, res');
    });
  });
});
