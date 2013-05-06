var UserCollection = require('../lib/resources/user-collection')
	,	db = require('../lib/db');

var salt = '46af958aca7b8bb4a0b8dbf05fbde3f322d74a779b383ccab181990d921a32274b6ce153d3f071cf0616020a03f36605f5877c651131c8e7b380f660bd36111d718eae3786202e56e398eb66a04ddd0bb48fa4e9ab73bd12270758b89aad241cb8fca4876cc8ed33b01100307e70ff99afc6bf4649595a4b78ac205c230a184b'
	, hash = '868025549afbfb28a372ad10b3a701196bec57325f76580a32bc3b0c82c3a111'
	, plain = 'abcd'
		
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
					expect(changes).to.have.property('uid', '123');
					return this;
				},
				save: function(fn) {
					expect(fn).to.be.a('function');
					fn();
				}
			};
			this.ctx.req.url = '/users/login';
			this.ctx.req.method = 'POST';
			this.ctx.req.body.username = 'foo@bar.com';
			this.ctx.req.body.password = plain;
			this.ctx.req.body.role = 'owner';
			this.uc.store.first = function(query, fn) {
				expect(query).to.eql({username: 'foo@bar.com'});
				fn(null, {id: '123', username: 'foo@bar.com', password:salt+hash});
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
				session: {data: {path: '/users', uid: '123', role:'owner'}}
			};
			uc.store.find = function(query, fn) {
				expect(query).to.eql({id: '123', $fields: {password: 0}});
				fn(null, {id: '123', username: 'foo@bar.com'});
			};

			uc.handleSession(ctx, function(err) {
				expect(ctx.session.user).to.eql({id: '123', username: 'foo@bar.com'});
				expect(ctx.session.data).to.have.property('role', 'owner')
				done();
			});
		});
	});
});