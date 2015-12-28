var SessionStore = require('../lib/session').SessionStore
  , db = require('../lib/db')
  , EventEmitter = require('events').EventEmitter
  , sinon = require('sinon');

describe('SessionStore', function() {
  it('should allow binding multiple sockets to a single session', function(done) {
    var store = new SessionStore('sessions', db.create(TEST_DB))
      , sid = store.createUniqueIdentifier();

    store.createSession(function (err, session) {
      session.save(function(err, data){
        var sockets = new EventEmitter()
          ,  store = new SessionStore('sessions', db.create(TEST_DB), sockets);

        for(var i = 1; i < 9; i++) {
          fauxSocket = {
                id: 'abcd' + i,
                handshake: {headers: {cookie: 'name=value; name2=value2; sid=' + data.id}},
                on: function() {}
              };

          sockets.emit('connection', fauxSocket);
          expect(store.socketIndex[data.id]['abcd' + i]).to.equal(fauxSocket);
        }
        done();
      });
    });
  });

  describe('.createUniqueIdentifier()', function() {
    it('should create a session id', function() {
      var store = new SessionStore()
        , sid = store.createUniqueIdentifier();

      expect(sid.length).to.equal(128);
    });
  });

  describe('.createSession(fn)', function() {
    it('should create a session', function(done) {
      var store = new SessionStore('sessions', db.create(TEST_DB))
        , sid = store.createUniqueIdentifier();

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
            var s = store.getSession('my-uid', session.sid);
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
      clock = sinon.useFakeTimers(new Date(2015, 01, 01).getTime(), "Date");
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
                    // give the code in createSession some time to clean up inactive sessions
                    clock.restore();
                    setTimeout(function() {
                      store.find({ id: session.sid }, function (err, s) {
                        expect(s).to.not.exist;
                        done();
                      });
                    }, 300);
                  });
                });
              });
            });
          });
        });
      });
    });
  });

  // mock socket io functionality
  function createMockSocketIo() {
    var sockets = new EventEmitter();
    var rooms = {};

    sockets.to = sinon.spy(function(channel) {
      return {
        emit: function(event, data) {
          rooms[channel].forEach(function(em) {
            em.emit(event, data);
          });
        }
      };
    });

    sockets.createClient = function(name) {
      var fauxSocket = new EventEmitter();
      fauxSocket.id = name;
      fauxSocket.rooms = [];
      fauxSocket.handshake = { headers: {} };
      fauxSocket.join = sinon.spy(function(channel, fn) {
        rooms[channel] = rooms[channel] || [];
        rooms[channel].push(fauxSocket);
        if (fauxSocket.rooms.indexOf(channel) === -1) fauxSocket.rooms.push(channel);
        if (fn) setTimeout(fn, 1);
      });
      fauxSocket.leave = sinon.spy(function(channel, fn) {
        rooms[channel] = rooms[channel] || [];
        var index = rooms[channel];
        if (index !== -1) rooms[channel].splice(index, 1);
        if (fauxSocket.rooms.indexOf(channel) !== -1) fauxSocket.rooms.splice(fauxSocket.rooms.indexOf(channel), 1);
        if (fn) setTimeout(fn, 1);
      });
      fauxSocket.on('disconnect', function() {
        Object.keys(rooms).forEach(function(room) {
          fauxSocket.leave(room);
        });
      });
      return fauxSocket;
    };
    return sockets;
  }

  function createMockPubSub() {
    var pubsub = new EventEmitter();

    var pub = {
      publish: sinon.spy(function(channel, data) {
        pubsub.emit('message', channel, data);
      })
    };

    var sub = {
      subscribe: sinon.spy(function(channel) {

      }),
      on: sinon.spy(function() {
        return pubsub.on.apply(pubsub, arguments);
      })
    };

    return {pub: pub, sub: sub};
  }

  it('should make sockets available even before they exist', function(done) {
    this.timeout(100);

    var sockets = createMockSocketIo()
      ,  fauxSocket = sockets.createClient()
      ,  store = new SessionStore('sessions', db.create(TEST_DB), sockets);

    store.createSession(function (err, session) {
      session.save(function(err, data){

        // generate faux headers
        fauxSocket.id = 'test123';
        fauxSocket.handshake = { headers: {cookie: 'name=value; name2=value2; sid=' + data.id} };

        // bind to an event even before a connection has been made
        session.socket.on('test', function (data) {
          expect(data).to.equal(123);
          done();
        });

        sockets.emit('connection', fauxSocket);

        fauxSocket.emit('test', 123);
      });
    });
  });


  it('should bind multiple sockets to the same session id', function(done) {
    var sockets = createMockSocketIo()
      , store = new SessionStore('sessions', db.create(TEST_DB), sockets)
      , total = 5
      , remainingTo = total
      , remainingFrom = total;

    store.createSession(function (err, session) {
      session.save(function(err, data){
        // bind to an event even before a connection has been made
        session.socket.on('message TO server', function (data) {
          expect(data).to.equal("message from " + (total - remainingTo));
          remainingTo--;
          if (remainingTo === 0 && remainingFrom === 0) done();
        });

        for (var i = 0; i < total; i++){
          var fauxSocket = sockets.createClient('testSocket' + i);
          // generate faux headers
          fauxSocket.handshake = { headers: {cookie: 'name=value; name2=value2; sid=' + data.id} };

          sockets.emit('connection', fauxSocket);

          fauxSocket.emit('message TO server', "message from " + i);

          fauxSocket.on('message FROM server', function(data) {
            // must receive all events
            expect(data).to.equal("hello");
            remainingFrom--;
            if (remainingTo === 0 && remainingFrom === 0) done();
          });
        }

        session.socket.emit('message FROM server', "hello");
      });
    });
  });

  it('should not bind multiple sessions to the same socket', function(done) {
    var sockets = createMockSocketIo()
      , store = new SessionStore('sessions', db.create(TEST_DB), sockets)
      , calls = 0;

    var sessions = [];

    var createSession = function(fn) {
      return store.createSession(function (err, session) {
        session.save(function(err, data){
          sessions.push(data);
          fn(err, data, session);
        });
      });
    };

    createSession(function(err, data, session1){
      var fauxSocket = sockets.createClient('testSocket1');
      sockets.emit('connection', fauxSocket);
      fauxSocket.emit('server:setSession', { sid: data.id });
      var handler = sinon.spy();
      fauxSocket.on('hello', handler);

      createSession(function(err, data, session2){
        fauxSocket.emit('server:setSession', { sid: data.id });
        // this message shouldn't be received:
        session1.socket.emit('hello', 'message from server to session1');
        // this message should be received:
        session2.socket.emit('hello', 'message from server to session2');
        expect(handler.calledOnce).to.be.true;
        expect(handler.firstCall.calledWith('message from server to session2')).to.be.true;
        done();
      });
    });
  });

  it('should rebind socket to rooms on reconnect', function(done) {
    var sockets = createMockSocketIo()
      , store = new SessionStore('sessions', db.create(TEST_DB), sockets)
      , calls = 0;

    var sessions = [];

    var createSession = function(fn) {
      return store.createSession(function (err, session) {
        session.save(function(err, data){
          sessions.push(data);
          fn(err, data, session);
        });
      });
    };

    createSession(function(err, data, session1){
      var fauxSocket = sockets.createClient('socket1');
      sockets.emit('connection', fauxSocket);
      fauxSocket.emit('server:setSession', { sid: data.id });
      session1.joinRoom('administrators');

      var handler = sinon.spy();
      fauxSocket.on('test', handler);
      session1.emitToRoom('administrators', 'test', 'message 1');
      expect(handler.calledWith('message 1')).to.be.true;

      fauxSocket.emit('disconnect');

      var fauxSocket2 = sockets.createClient('socket2');
      sockets.emit('connection', fauxSocket2);

      fauxSocket2.emit('server:setSession', { sid: data.id });

      // this will be called asynchronously, tap into it
      var originalJoin = fauxSocket2.join;
      fauxSocket2.join = function(channel) {
        originalJoin.apply(fauxSocket2, arguments);
        // rejoins room
        expect(channel).to.equal('administrators');

        fauxSocket2.on('test', handler);
        session1.emitToRoom('administrators', 'test', 'message 2');
        expect(handler.calledWith('message 2')).to.be.true;
        expect(handler.calledTwice).to.be.true;
        done();
        fauxSocket2.join = originalJoin;
      };
    });

  });

  it('should allow joining multiple rooms at once', function(done) {
    var sockets = createMockSocketIo()
      , store = new SessionStore('sessions', db.create(TEST_DB), sockets)
      , calls = 0;

    var sessions = [];

    var createSession = function(fn) {
      return store.createSession(function (err, session) {
        session.save(function(err, data){
          sessions.push(data);
          fn(err, data, session);
        });
      });
    };

    createSession(function(err, data, session1){
      var fauxSocket = sockets.createClient('socket1');
      sockets.emit('connection', fauxSocket);
      fauxSocket.emit('server:setSession', { sid: data.id });
      session1.joinRoom(['administrators', 'users']);
      var remaining = 2;

      var handler = sinon.spy();

      fauxSocket.on('test', handler);
      session1.emitToRoom('administrators', 'test', 'for admins');
      session1.emitToRoom('users', 'test', 'for users');
      expect(handler.firstCall.calledWith('for admins')).to.be.true;
      expect(handler.secondCall.calledWith('for users')).to.be.true;
      expect(handler.calledTwice).to.be.true;
      done();
    });
  });


  it('should bind multiple sessions to the same user id', function(done) {
    var sockets = createMockSocketIo()
      , store = new SessionStore('sessions', db.create(TEST_DB), sockets)
      , totalSockets = 5
      , remainingFrom = totalSockets * 3;

    var fauxUsers = { get: function (q, fn) {
      fn([{ id: "abc123" }]);
    }};

    var sessions = [];

    var createSessionForUser = function(uid, fn) {
      return store.createSession(function (err, session) {
        session.set({uid: uid}).save(function(err, data){
          sessions.push(data);
          fn(err, data, session);
        });
      });
    };

    var bindSession = function(data, session){
      // simulate totalSockets connections per user
      for (var i = 0; i < totalSockets; i++){
        var fauxSocket = sockets.createClient('testSocket' + i);
        // generate faux headers
        fauxSocket.handshake = { headers: {cookie: 'name=value; name2=value2; sid=' + data.id} };

        sockets.emit('connection', fauxSocket);

        // asserts here:
        fauxSocket.on('hey', function(data) {
          // must receive all events
          expect(data).to.equal("test");
          remainingFrom--;
          if (remainingFrom === 0) done();
        });
      }
    };

    // session #1
    createSessionForUser("abc123", function(err, data, session){
      bindSession(data, session);
      // session #2 (some other user id)
      createSessionForUser("abc234", function(err, data, session){
        bindSession(data, session);
        // session #3
        createSessionForUser("abc123", function(err, data, session){
          bindSession(data, session);
          // session #4
          createSessionForUser("abc123", function(err, data, session){
            bindSession(data, session);
            // emit
            session.emitToUsers(fauxUsers, {}, "hey", "test");
          });
        });
      });
    });
  });

  it('should join channels across nodes via pubsub', function(done) {
    var pubsub = createMockPubSub();
    var database = db.create(TEST_DB);
    var remaining = 3;

    function createStore(sockets) {
      return new SessionStore('sessions', database, sockets, {
          pubClient: pubsub.pub,
          subClient: pubsub.sub
        });
    }

    var createSession = function(store, sid, fn) {
      return store.createSession(sid, function (err, session) {
        session.save(function(err, data){
          fn(err, data, session);
        });
      });
    };

    // create two mock nodes
    var sockets1 = createMockSocketIo();
    var sockets2 = createMockSocketIo();

    var store1 = createStore(sockets1);
    var store2 = createStore(sockets2);

    expect(store1.pubClient).to.equal(pubsub.pub);
    expect(store1.subClient).to.equal(pubsub.sub);
    expect(store2.pubClient).to.equal(pubsub.pub);
    expect(store2.subClient).to.equal(pubsub.sub);

    // create a session store
    createSession(store1, null, function(err, data, session) {
      // assume socket connects to the first node
      var fauxSocket = sockets1.createClient('testSocket1');
      sockets1.emit('connection', fauxSocket);
      fauxSocket.emit('server:setsession', { sid: data.id });

      // test that the uid room is joined
      session.set({uid: 'user1'});

      var originalRefresh = store1.refreshSessionRooms;
      store1.refreshSessionRooms = function(sid, fn) {
        // need to ensure this is called
        expect(sid).to.equal(session.sid);
        originalRefresh.apply(store1, arguments);
        expect(fauxSocket.rooms).to.include('dpd_uid:user1'); // should not leave user channel
        remaining-- || done();
      };

      // later on, second node receives a request for the session id to join a specific room
      // this can happen with load balancing
      createSession(store2, session.sid, function(err, data, session2) {
        session2.joinRoom('administrators');

        // the only connection between the two stores is via pubsub, otherwise they have separate
        // socket instances, etc
        var originalJoin = fauxSocket.join;
        fauxSocket.join = function(channel) {
          // ensure this is called
          originalJoin.apply(fauxSocket, arguments);
          expect(channel).to.equal('administrators');
          session2.leaveRoom('administrators');

          remaining-- || done();
        };

        var originalLeave = fauxSocket.leave;
        fauxSocket.leave = function(channel) {
          // ensure this is called
          originalLeave.apply(fauxSocket, arguments);
          expect(channel).to.equal('administrators');
          remaining-- || done();
        };
      });

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
      if (callsLeft === 0) return done();
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

    it('should unjoin all channels', function(done) {
      var sockets = createMockSocketIo()
        , store = new SessionStore('sessions', db.create(TEST_DB), sockets);

      store.createSession(function (err, session) {
        session.set({foo: 'bar'}).save(function (err, data) {
          session.store.first({id: session.sid}, function (err, sdata) {
            var fauxSocket = sockets.createClient('socket1');
            sockets.emit('connection', fauxSocket);
            fauxSocket.emit('server:setSession', { sid: session.sid });
            session.joinRoom('administrators');
            expect(fauxSocket.rooms).to.include('administrators');
            expect(sdata.foo).to.equal('bar');
            session.remove(function () {
              expect(fauxSocket.rooms).to.not.include('administrators');
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
