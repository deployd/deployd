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