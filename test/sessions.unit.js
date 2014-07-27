var SessionStore = require('../lib/session').SessionStore
	,	db = require('../lib/db')
	, EventEmitter = require('events').EventEmitter;

describe('SessionStore', function() {
	it('should bind sockets to sessions', function() {
		var sockets = new EventEmitter()
			,	store = new SessionStore('sessions', db.create(TEST_DB), sockets)
			, fauxSocket = {
					handshake: {headers: {cookie: 'name=value; name2=value2; sid=123'}}
				};

		sockets.emit('connection', fauxSocket);

		expect(store.socketIndex['123']).to.equal(fauxSocket);
	});

	describe('.createUniqueIdentifier()', function() {
		it('should create a session id', function() {
			var store = new SessionStore()
				,	sid = store.createUniqueIdentifier();

			expect(sid.length).to.equal(128);
		});
	});

	describe('.createSession(fn)', function() {
		it('should create a session', function(done) {
			var store = new SessionStore('sessions', db.create(TEST_DB))
				,	sid = store.createUniqueIdentifier();

			store.createSession(function (err, session) {
				expect(session.sid).to.have.length(128);
				done(err);
			});
		});
	});
});

describe('Session', function() {
	function createSession(fn) {
		var store = new SessionStore('sessions', db.create(TEST_DB));

		store.createSession(function (err, session) {
			expect(session.sid).to.have.length(128);
			fn(err, session);
		});
	}

	it('should make sockets available even before they exist', function(done) {
		this.timeout(100);

		var sockets = new EventEmitter()
			,	fauxSocket = new EventEmitter()
			,	store = new SessionStore('sessions', db.create(TEST_DB), sockets);

		store.createSession(function (err, session) {
			// generate faux headers
			fauxSocket.handshake = { headers: {cookie: 'name=value; name2=value2; sid=' + session.sid} };
			
			// bind to an event even before a connection has been made
			session.socket.on('test', function (data) {
				expect(data).to.equal(123);
				done();
			});

			sockets.emit('connection', fauxSocket);

			fauxSocket.emit('test', 123);
		});
	});

	describe('.set(changes)', function() {
		it('should set the changes to a sessions data', function(done) {
			createSession(function (err, session) {
				session.set({foo: 'bar'});
				expect(session.data).to.eql({id: session.sid, foo: 'bar'});
				done(err);
			});
		});
	});

	describe('.save(fn)', function() {
		it('should persist the session data in the store', function(done) {
			createSession(function (err, session) {
				session.set({foo: 'bar'}).save(function (err, data) {
					session.store.first({id: session.sid}, function (err, sdata) {
						expect(sdata.foo).to.equal('bar');
						done(err);
					});
				});
			});
		});
	});

	describe('.remove(fn)', function() {
		it('should remove the session data from the store', function(done) {
			createSession(function (err, session) {
				session.set({foo: 'bar'}).save(function (err, data) {
					session.store.first({id: session.sid}, function (err, sdata) {
						expect(sdata.foo).to.equal('bar');
						session.remove(function () {
							session.store.first({id: session.sid}, function (err, sdata) {
								expect(sdata).to.not.exist;
								done(err);
							});
						});
					});
				});
			});
		});
	});

	describe('.fetch(fn)', function() {
		it('should fetch the session data from the store', function(done) {
			createSession(function (err, session) {
				session.set({foo: 'bar'}).save(function (err, data) {
					session.store.first({id: session.sid}, function (err, sdata) {
						session.data = {id: session.sid, foo: 'not-bar'};
						session.fetch(function (err) {
							expect(session.data).to.eql({id: session.sid, foo: 'bar'});
							done(err);
						});
					});
				});
			});
		});
	});
});