var Server = require('../lib/server')
	,	Db = require('../lib/db').Db
	,	Store = require('../lib/db').Store
	, Router = require('../lib/router');

describe('Server', function() {
	describe('.listen()', function() {
		it('should start a new deployd server', function(done) {
			var server = new Server()
				,	defaultOptions = {
					port: 2403,
					db: {
						name: 'deployd',
						port: 27017,
						host: '127.0.0.1'
					}
				};

			server.listen();
			expect(server.db instanceof	Db).to.equal(true);
			expect(server.options).to.eql(defaultOptions);
			server.on('listening', function () {
				done();
			});
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
