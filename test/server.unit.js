var Server = require('../lib/server')
	,	Db = require('../lib/db').Db
	,	Store = require('../lib/db').Store
	, Router = require('../lib/router')
	, sh = require('shelljs');

describe('Server', function() {
	describe('.listen()', function() {
		beforeEach(function() {
			sh.cd('./test/support/proj');
			sh.rm('-rf', 'resources');
			sh.mkdir('resources');
		});

		it('should start a new deployd server', function(done) {
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

			expect(server.db instanceof	Db).to.equal(true);
			expect(server.options).to.eql(opts);
			server.on('listening', function () {
				server.close();
				done();
			});
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

});
