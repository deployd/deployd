var credentials = {
	username: 'foo@bar.com',
	password: '123456'
}

describe('User Collection', function() {
	describe('dpd.users', function() {
		describe('.post', function() {
			it('should create a user', function(done) {
				dpd.users.post(credentials, function (user, err) {
					if(!user) {
						throw 'user did not exist';
					}
					expect(user.id.length).to.equal(16)
					delete user.id;
					expect(user).to.eql({username: credentials.username});
					done(err);
				})
			})

			it('should validate for duplicate username', function(done) {
				chain(function(next) {
					dpd.users.post(credentials, next);
				}).chain(function(next) {
					dpd.users.post(credentials, next);
				}).chain(function(next, result, err) {
					expect(result).to.not.exist;
					expect(err.errors.username).to.be.ok;
					done();
				});
			});
		})
		describe('.login(credentials, fn)', function() {
			it('should login a user', function(done) {
				dpd.users.post(credentials, function (user, err) {
					expect(user.id.length).to.equal(16)
					dpd.users.login(credentials, function (session, err) {
						expect(session.id.length).to.equal(128)
						expect(session.uid.length).to.equal(16)
						done(err);
					})
				})
			})
		})
		describe('.me(fn)', function() {
			it('should return the current user', function(done) {
				dpd.users.post(credentials, function (user, err) {
					expect(user.id.length).to.equal(16)
					dpd.users.login(credentials, function (session, err) {
						dpd.users.me(function (me, err) {
							expect(me).to.exist;
							expect(me.id.length).to.equal(16);
							done(err);
						})
					})
				})
			})
		})
		describe('.del({id: \'...\'}, fn)', function() {
			it('should remove a user', function(done) {
				dpd.users.post(credentials, function (user, err) {
					expect(user.id.length).to.equal(16)
					dpd.users.del({id: user.id}, function (session, err) {
						dpd.users.get({id: user.id}, function (user) {
							expect(user).to.not.exist;
							done(err);
						})
					})
				})
			})
		})
		describe('dpd.users.on("changed", fn)', function() {
      it('should respond to the built-in changed event on post', function(done) {
        dpd.users.on('changed', function() {
          done();
        });

        dpd.users.post({username: 'foo@bar.com', password: '123456'});
      })
      
      it('should respond to the built-in changed event on put', function(done) {
        dpd.todos.post({username: 'foo2@bar.com', password: '123456'}, function(item) {
          dpd.todos.on('changed', function() {
            done();
          });
          
          dpd.todos.put(item.id, {username: 'foo3@bar.com'});
        });
      })
      
      it('should respond to the built-in changed event on del', function(done) {
        dpd.todos.post({title: 'changed - create'}, function(item) {
          dpd.todos.on('changed', function() {
            done();
          });
          
          dpd.todos.del(item.id);
        });
      })
    })
	})

	afterEach(function (done) {
		this.timeout(10000);
		dpd.users.logout(function () {
			dpd.users.get(function (users) {
				var total = users.length;
				if(total === 0) return done();
				users.forEach(function(user) {
					dpd.users.del({id: user.id}, function () {
						total--;
						if(!total) {
							done();
						}
					})
				})
			})			
		})
	})

})

