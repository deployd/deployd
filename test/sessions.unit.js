var SessionStore = require('../lib/session').SessionStore
	,	db = require('../lib/db')
	, EventEmitter = require('events').EventEmitter
	, sinon = require('sinon');

describe('SessionStore', function() {
	it('should bind sockets to sessions', function() {
		var sockets = new EventEmitter()
			,	store = new SessionStore('sessions', db.create(TEST_DB), sockets)
			, fauxSocket = {
					handshake: {headers: {cookie: 'name=value; name2=value2; sid=123'}},
					on: function() {}
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
			  expect(session.isAnonymous()).to.be.true;
				done(err);
			});
		});
	});

	describe('.getSession(uid)', function() {
		it('should get back the created session', function(done) {
			var store = new SessionStore('sessions', db.create(TEST_DB));

			store.createSession(function (err, session) {
				// set the session uid
				session.set({uid: 'my-uid'}).save(function(err, data){

					// create again from store
					store.createSession(session.sid, function (err, session2) {
						// get back the session
						var s = store.getSession('my-uid');
						expect(s.sid).to.equal(session.sid);
						
						done(err);
					});
				});
			});
		});
	});
});

describe('Session', function() {
  var clock;
    
  function createSession(fn) {
		var store = new SessionStore('sessions', db.create(TEST_DB));

		store.createSession(function (err, session) {
			expect(err).not.exist;
			expect(session.data.anonymous).to.be.true;
			fn(err, session);
		});
  }
  
  beforeEach(function () {
    this.sinon = sinon.sandbox.create();
  });
  
  afterEach(function () {
    this.sinon.restore();
  });
  
  describe('.createSession()', function () {
    beforeEach(function () {
      clock = sinon.useFakeTimers(new Date(2015, 01, 01).getTime());
    });
    
    afterEach(function () {
      clock.restore();
    });
    
    it('should expire sessions after max age', function (done) {
      var store = new SessionStore('sessions', db.create(TEST_DB), undefined, { maxAge: 100000 });
      
      store.createSession(function (err, session) {
        session.set({ foo: 'bar' }).save(function (err, data) {
          expect(err).to.not.exist;
          store.createSession(session.sid, function (err, session2) {
            expect(session.sid).to.equal(session2.sid);
            // check that the session is still valid 1 tick before expiration
            clock.tick(99999);
            process.nextTick(function () {
              store.createSession(session.sid, function (err, session3) {
                expect(session.sid).to.equal(session3.sid);
                clock.tick(100001); // pass the threshold
                process.nextTick(function () {
                  store.createSession(session.sid, function (err, session4) {
                    expect(session4.data.anonymous).to.be.true;
                    store.find({ id: session.sid }, function (err, s) {
                      expect(s).to.not.exist;
                      done();
                    });
                  });
                });
              });
            });
          });
        });
      });
    });
  });


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

	it('should not crash process when inserting the same session to the database', function (done) {
		var store = new SessionStore('sessions', db.create(TEST_DB));
		var originalFind = store.find;
		store.find = sinon.stub(store, "find", function () {
			var myArgs = arguments;
			// simulate 10 ms latency for find function
			setTimeout(function() { originalFind.apply(store, myArgs); }, 10);
		});
			
		var callsLeft = 5;
		function callback(err) {
			expect(err).to.not.exist;
			callsLeft--;
			if (callsLeft == 0) return done();
		} 
		
		for (var i = 0; i< 5; i++) {
			setTimeout(function() {
				store.createSession("1c829fa9ed135d0301919aa70505cf36a39b35527b775e45e1523c354e0c5f2b0b1636f173a94e26082291ae9ad0e3e74cb5226bd0aa86ee9f7a3749d57cc74d", callback);
			}, 1);
		}
	});
		
	describe('.set(changes)', function() {
		it('should set the changes to a sessions data', function(done) {
			createSession(function (err, session) {
        session.set({ foo: 'bar' });
				expect(session.data).to.contain({anonymous: true, foo: 'bar'});
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
							expect(session.data).to.contain({id: session.sid, foo: 'bar'});
							done(err);
						});
					});
				});
			});
		});
	});
});
