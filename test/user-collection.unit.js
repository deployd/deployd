var UserCollection = require('../lib/resources/user-collection')
	,	db = require('../lib/db');

describe('UserCollection', function() {
	describe('.handle(ctx)', function() {
		beforeEach(function() {
			var test = this;
			var properties = {
				name: {type: 'string'}
			};
			this.uc = new UserCollection('users', {db: db.create(TEST_DB), config: {properties: properties}});
			this.ctx = {
				req: {url: '/users', body: {}},
				res: {},
				done: function(err, res) {
					if(test.complete) test.complete(err, res);
				}
			};
		});

		it('should login a user when credentials are POSTed to "/login"', function(done) {
			var test = this;
			this.ctx.url = '/login';
			this.ctx.query = {};
			this.ctx.session = {
				set: function(changes) {
					expect(changes).to.eql({uid: '123', path: '/users'});
					return this;
				},
				save: function(fn) {
					expect(fn).to.be.a('function');
					fn();
				}
			};
			this.ctx.req.url = '/users/login';
			this.ctx.req.method = 'POST';
			this.ctx.req.body.email = 'foo@bar.com';
			this.ctx.req.body.password = 'abcd';
			this.uc.store.find = function(query, fn) {
				expect(query).to.eql({email: 'foo@bar.com', password: 'abcd'});
				fn(null, {id: '123', email: 'foo@bar.com'});
			};
			this.complete = function(err, res) {
				done();
			};

			this.uc.handle(this.ctx);
		});

		it('should logout a user when "/logout" is requested', function(done) {
			var test = this;
			var removed = false;
			this.ctx.url = '/logout';
			this.ctx.session = {
				remove: function(fn) {
					removed = true;
					expect(fn).to.be.a('function');
					fn();
				}
			};
			this.ctx.req.url = '/users/logout';
			this.ctx.req.method = 'POST';
			this.ctx.req.body.email = 'foo@bar.com';
			this.ctx.req.body.password = 'abcd';
			this.complete = function(err, res) {
				expect(removed).to.equal(true);
				done();
			};

			this.uc.handle(this.ctx);
		});

    it('should perform GET with including $fields', function(done) {
      this.ctx.url = '/';
      this.ctx.query = {$fields: {username: 1, email: 1}};
      this.ctx.req.url = '/users';
      this.ctx.req.method = 'GET';
      function test(e, r) {
        expect(e).to.not.exist;
        this.uc.handle(this.ctx);
      }
      this.complete = function(err, res) {
        expect(err).to.not.exist;
        expect(res[0]).to.have.keys(['id','username', 'email']);
        expect(res[0].username).to.eql('foo');
        expect(res[0].email).to.eql('foo@bar.com');
        this.uc.store.remove(function (err) {
          done(err);
        });
      };
      var testData = {username: 'foo', password: 'abcd', email:'foo@bar.com', name: 'foo'};
      this.uc.store.insert(testData, test.bind(this));
    });

    it('should perform GET with excluding $fields', function(done) {
      this.ctx.url = '/';
      this.ctx.query = {$fields: {username: 0, email: 0}};
      this.ctx.req.url = '/users';
      this.ctx.req.method = 'GET';
      function test(e, r) {
        expect(e).to.not.exist;
        this.uc.handle(this.ctx);
      }
      this.complete = function(err, res) {
        expect(err).to.not.exist;
        expect(res[0]).to.have.keys(['id','name']);
        expect(res[0].name).to.eql('foo');
        this.uc.store.remove(function (err) {
          done(err);
        });
      };
      var testData = {username: 'foo', password: 'abcd', email:'foo@bar.com', name: 'foo'};
      this.uc.store.insert(testData, test.bind(this));
    });

    it('should hide password when $fields{password: 1}', function(done) {
      this.ctx.url = '/';
      this.ctx.query = {$fields: {password: 1}};
      this.ctx.req.url = '/users';
      this.ctx.req.method = 'GET';
      function test(e, r) {
        expect(e).to.not.exist;
        this.uc.handle(this.ctx);
      }
      this.complete = function(err, res) {
        expect(err).to.not.exist;
        expect(res[0]).to.have.keys(['id','name', 'email', 'username']);
        this.uc.store.remove(function (err) {
          done(err);
        });
      };
      var testData = {username: 'foo', password: 'abcd', email:'foo@bar.com', name: 'foo'};
      this.uc.store.insert(testData, test.bind(this));
    });
	});

	describe('.handleSession(ctx)', function() {
		it('should attach the current user to the session', function(done) {
			var properties = {
				name: {type: 'string'}
			};
			var uc = new UserCollection('users', {db: db.create(TEST_DB), config: { properties: properties } } );

			var ctx = {
				session: {data: {path: '/users', uid: '123'}}
			};
			var found = false;
			uc.store.find = function(query, fn) {
				expect(query).to.eql({id: '123', $fields: {password: 0}});
				found = true;
				fn();
			};

			uc.handleSession(ctx, function() {
				expect(found).to.equal(true);
				done();
			});
		});
	});
});