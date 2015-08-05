var rewire = require('rewire')
,	attach = rewire('../lib/attach')
,	Db = require('../lib/db').Db
,	Store = require('../lib/db').Store
,	Router = require('../lib/router')
,	sh = require('shelljs')
,	sinon = require('sinon')
,	fs = require('fs')
, configLoader = require('../lib/config-loader')
, basepath = './test/support/proj';


function MockServer () {}
MockServer.prototype.listen = function () {};
MockServer.prototype.on = function () {};

describe('attach', function() {
    var old_loadConfig = null;
    beforeEach(function() {
        if (fs.existsSync(basepath)) {
            sh.rm('-rf', basepath);
        }
        sh.mkdir('-p', basepath);
        old_loadConfig = configLoader.loadConfig;
    });
    afterEach(function() {
        if (fs.existsSync(basepath)) {
            sh.rm('-rf', basepath);
        }
        configLoader.loadConfig = old_loadConfig;
        delete process.server;
    });

    var fakeHttpServer = new MockServer();
    var fakeSocketIo = {sockets:{on:function(){}}};
    var PORT;
    var opts;

    describe('overall', function() {
        beforeEach(function() {
            sh.cd(basepath);
            sh.rm('-rf', 'resources');
            //sh.mkdir('resources');

            PORT = genPort();
            opts = {
                port: PORT,
                db: {
                    name: 'deployd',
                    port: 27017,
                    host: '127.0.0.1'
                },
                socketIo: fakeSocketIo,
            };
        });

        it('should start a new deployd server', function() {
            var server = attach(fakeHttpServer, opts);

            server.listen();

            expect(server.db instanceof  Db).to.equal(true);
            expect(server.options).to.eql(opts);
        });

        it('.createStore(namespace): should create a store with the given name', function() {
            var server = attach(fakeHttpServer, opts)
            ,	store = server.createStore('foo');

            expect(store instanceof Store).to.equal(true);
            expect(server.stores.foo).to.equal(store);
        });

        it('.route(): should be on the prototype', function () {
            var server = attach(fakeHttpServer, opts);
            expect(typeof server.route).to.equal('function');
            expect(server.route.toString()).to.contain('req, res');
        });


        it('.route(): should call config.loadConfig', function () {
            var server = attach(fakeHttpServer, opts);
            var req = {url: 'foo'};
            var res = {body: 'bar'};

            configLoader.loadConfig = sinon.spy();
            server.route(req, res);

            expect(configLoader.loadConfig.callCount).to.equal(1);
        });


        it('.handleRequest(): should set a resources array on the server', function () {
            var server = attach(fakeHttpServer, opts);
            var req = {url: 'foo', headers: {accept: '*'}};
            var res = {body: 'bar', on: function () {}};

            configLoader.loadConfig = function (path, server, callback) {
                callback.call(server, null, ['foo']);
            };

            expect(Array.isArray(server.resources)).to.equal(false);

            server.route(req, res);

            expect(Array.isArray(server.resources)).to.equal(true);
        });



        afterEach(function() {
            sh.cd('../../../');
        });
    });

});
