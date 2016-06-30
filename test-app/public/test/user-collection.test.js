var credentials = {
	username: 'foo@bar.com',
	password: '123456'
};

describe('User Collection', function() {
	describe('dpd.users', function() {
		describe('.post', function() {
			it('should create a user', function(done) {
				dpd.users.post(credentials, function (user, err) {
					if(!user) {
						throw 'user did not exist';
					}
					expect(user.id.length).to.equal(16);
					delete user.id;
					expect(user).to.contain({username: credentials.username});
					done(err);
				});
			});

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

      it('should properly receive emitToUsers messages', function(done) {
        dpd.socketReady(function() {
          dpd.users.once('created', function(u) {
            expect(u).to.contain({ username: 'foo2' });
            done();
          });
        });

        dpd.users.post({ username: 'foo', password: 'bar', admin: true })
        .then(function(res){
          expect(res).to.exist;
          return dpd.users.login({ username: 'foo', password: 'bar'});
        })
        .then(function(res){
          dpd.users.post({ username: 'foo2', password: 'bar' });
        });
      });

      it('should properly show username and password errors', function(done) {
        dpd.users.post({}, function(res, err) {
          expect(res).to.not.exist;
          expect(err.errors.username).to.be.ok;
          expect(err.errors.password).to.be.ok;
          done();
        });
      });

      it('should update if id is passed in the body', function(done) {
        chain(function(next) {
          dpd.users.post({username: 'foo', password: 'bar'}, next);
        }).chain(function(next, res, err) {
          dpd.users.post({id: res.id, username: 'test'}, next);
        }).chain(function(next, res, err) {
          done(err);
        });
      });

      it('should update if id is passed in the url', function(done) {
        chain(function(next) {
          dpd.users.post({username: 'foo', password: 'bar'}, next);
        }).chain(function(next, res, err) {
          dpd.users.post(res.id, {username: 'test'}, next);
        }).chain(function(next, res, err) {
          done(err);
        });
      });
		});
		describe('.login(credentials, fn)', function() {
			it('should login a user', function(done) {
				dpd.users.post(credentials, function (user, err) {
					expect(user.id.length).to.equal(16);
					dpd.users.login(credentials, function (session, err) {
						expect(session.id.length).to.equal(128);
						expect(session.uid.length).to.equal(16);
						done(err);
					});
				});
			});

      it('should not crash the server when called without a body', function(done) {
        dpd.users.login(null, function(session, err) {
          expect(err).to.exist;
          done();
        });
      });

      it('should not crash the server when logging in with an invalid password', function(done) {
        dpd.users.post({username: 'foo@bar.com', password: '123456'})
        .then(function(res) {
          expect(res).to.exist;
          expect(res.username).to.equal('foo@bar.com');
          dpd.users.login({username: 'foo@bar.com', password: {}}, function(session, err) {
            expect(err).to.exist;
            done();
          });
        });
      });

      it('should not crash the server when creating an user with an invalid password', function(done) {
        dpd.users.post({username: 'foo@bar.com', password: {length: 10}})
        .fail(function(err) {
          expect(err).to.exist;
          expect(err.errors.password).to.equal('is required');
          done();
        });
      });

      it('should not crash the server when called without a password', function(done) {
        dpd.users.post({username: 'foo@bar.com', password: '123456'})
        .then(function(res) {
          expect(res).to.exist;
          expect(res.username).to.equal('foo@bar.com');
          dpd.users.login({username: 'foo@bar.com'}, function(session, err) {
            expect(err).to.exist;
            done();
          });
        });
      });

      it('should call login event and provide access to user in event', function(done) {
        dpd.users.post(credentials, function (user, err) {
          expect(user.id.length).to.equal(16);

          dpd.socketReady(function() {
            dpd.users.once('test_event', function(u) {
              expect(u['this']).to.eql(user);
              done();
            });

            dpd.users.login(credentials, function (session, err) {
              expect(session.id.length).to.equal(128);
              expect(session.uid.length).to.equal(16);
              expect(err).to.not.exist;
            });
          });
        });
      });

      // see the code in login.js in the users collection for more details about what these tests assume
      it('should allow canceling login from login event', function (done) {
        dpd.users.post({username: 'foo@bar.com', password: '123456'}, function (user, err) {
          expect(user.id.length).to.equal(16);
          dpd.users.login({username: 'foo@bar.com', password: '123456', authtoken: '$BAD_AUTH'}, function (session, err) {
            expect(err).to.exist;
            expect(err.message).to.equal('bad auth');
            done();
          });
        });
      });

      it('should allow updating the user from the login event', function (done) {
        dpd.users.post({ username: 'foo2@bar.com', password: '123456' }, function (user, err) {
          expect(user.id.length).to.equal(16);
          expect(user.lastLoginTime).to.not.exist;
          dpd.users.login({ username: 'foo2@bar.com', password: '123456' }, function (session, err) {
            expect(session.id.length).to.equal(128);
            expect(session.uid.length).to.equal(16);
            expect(err).to.not.exist;
            dpd.users.get(session.uid, function (user, err) {
              expect(err).to.not.exist;
              expect(user.lastLoginTime).to.be.above(0);
              done();
            });
          });
        });
      });

      it('should allow updating the user from the login event when login fails', function (done) {
        dpd.users.post({ username: 'foo3@bar.com', password: '123456' }, function (user, err) {
          expect(user.id.length).to.equal(16);

          // try 4 bad logins; the logic in the login event will ban the user after 3 failed attempts
          chain(function (next) {
            dpd.users.login({ username: 'foo3@bar.com', password: 'bad' }, next);
          }).chain(function (next, session, err) {
            expect(err).to.exist;
            expect(err.message).to.equal('bad credentials');
            expect(session).to.not.exist;
            dpd.users.login({ username: 'foo3@bar.com', password: 'bad' }, next);
          }).chain(function (next) {
            dpd.users.login({ username: 'foo3@bar.com', password: 'bad' }, next);
          }).chain(function (next) {
            dpd.users.login({ username: 'foo3@bar.com', password: 'bad' }, next);
          }).chain(function (next, session, err) {
            // user should be banned
            expect(err).to.exist;
            expect(err.message).to.equal('banned');
            expect(session).to.not.exist;
            // remove ban
            dpd.users.put(user.id, { banned: false }, next);
          }).chain(function (next, user, err) {
            expect(err).to.not.exist;
            // try a proper login this time
            dpd.users.login({ username: 'foo3@bar.com', password: '123456' }, next);
          }).chain(function (next, session, err) {
            expect(session.id.length).to.equal(128);
            expect(session.uid.length).to.equal(16);
            expect(err).to.not.exist;
            done();
          });
        });
      });

      it('should not call other events after update of user from login event', function (done) {
        dpd.users.post({ username: '$SKIP_EVENTS_TEST', password: '123456' })
        .then(function (user) {
          expect(user.id.length).to.equal(16);
          return dpd.users.login( { username: '$SKIP_EVENTS_TEST', password: '123456' });
        })
        .then(function(session) {
          expect(session.id.length).to.equal(128);
          expect(session.uid.length).to.equal(16);
          done();
        })
        .fail(function(err) {
          done(err.message);
        });
      });

      it('should call login event even when user does not exist', function (done) {
        dpd.users.login({ username: 'foo123456@bar.com', password: '123456' }, function (session, err) {
          expect(err).to.exist;
          expect(err.message).to.equal('no such user');
          expect(session).to.not.exist;
          done();
        });
      });

      it('should not crash server when login is called repeatedly', function (done) {
        this.timeout(10000);
        dpd.users.post({ username: 'foo@bar.com', password: '123456' }, function (user, err) {
          expect(user.id.length).to.equal(16);
          var numDone = 0;
          var numTries = 20;
          function loginDone(session, err) {
            numDone++;
            expect(session).to.exist;
            expect(err).to.not.exist;
            if (numDone == numTries) {
              done();
            } else {
              doLogin();
            }
          }
          function doLogin() {
            dpd.users.login({ username: 'foo@bar.com', password: '123456' }, loginDone);
          }

          doLogin();
        });
      });

      it('should allow login with Authorization: Bearer HTTP header ', function (done) {
        // ensure we're logged out
        dpd.users.logout(function() {
          // setting this header will disable setting a sid cookie by deployd
          _dpd.ajax.headers = { Authorization: "Bearer" };
          dpd.users.post({ username: 'authheader', password: '123456' }, function (user, err) {
            expect(user.id.length).to.equal(16);
            expect(user.lastLoginTime).to.not.exist;
            dpd.users.login({ username: 'authheader', password: '123456' }).then(function (session) {
              _dpd.ajax.headers = { Authorization: "Bearer " + session.id };
              dpd.users.me({showUsername: true}, function (me, err) {
                _dpd.ajax.headers = null;
                expect(me).to.exist;
                expect(me.username).to.equal("authheader");
                done();
              });
            });
          });
        });
      });
    });


		describe('.me(fn)', function() {
			it('should return the current user', function(done) {
				dpd.users.post(credentials, function (user, err) {
					expect(user.id.length).to.equal(16);
					dpd.users.login(credentials, function (session, err) {
						dpd.users.me(function (me, err) {
							expect(me).to.exist;
							expect(me.id.length).to.equal(16);
							done(err);
						});
					});
				});
      });

      it('should invalidate session if username or password is changed', function (done) {
        dpd.users.post({ username: 'foo123@bar.com', password: '123456' }).then(function (user) {
          expect(user.id.length).to.equal(16);
          return dpd.users.login({ username: 'foo123@bar.com', password: '123456' });
        })
        .then(function (session) {
          expect(session).to.exist;
          expect(session.id.length).to.equal(128);
          return dpd.users.me();
        })
        // test changing username:
        .then(function (user) {
          return dpd.users.put(user.id, { username: 'foo1234@bar.com' });
        })
        .then(function (user) {
          expect(user).to.exist;
          return dpd.users.me();
        })
        .then(function (user) {
          expect(user).to.equal('');
          return dpd.users.login({ username: 'foo1234@bar.com', password: '123456' });
        })
        .then(function (session) {
          expect(session).to.exist;
          expect(session.id.length).to.equal(128);
          return dpd.users.me();
        })
        // test changing password:
        .then(function (user) {
          return dpd.users.put(user.id, { password: '1234567' });
        })
        .then(function (user) {
          expect(user).to.exist;
          return dpd.users.me();
        })
        .then(function (user) {
          expect(user).to.equal('');
          return dpd.users.login({ username: 'foo1234@bar.com', password: '1234567' });
        })
        .then(function (session) {
          expect(session).to.exist;
          expect(session.id.length).to.equal(128);
          return dpd.users.me();
        })
        .then(function (user) {
          expect(user).to.exist;
          done();
        })
        .fail(function (err) {
          done(err);
        });
      });
		});
		describe('.del({id: \'...\'}, fn)', function() {
			it('should remove a user', function(done) {
				dpd.users.post(credentials, function (user, err) {
					expect(user.id.length).to.equal(16);
					dpd.users.del({id: user.id}, function (res, err) {
						expect(err).to.not.exist;
						expect(res.count).to.equal(1);
						dpd.users.get({id: user.id}, function (user) {
							expect(user).to.not.exist;
							done(err);
						});
					});
				});
			});
		});
		describe('dpd.users.on("changed", fn)', function() {
      it('should respond to the changed event (in AfterCommit) on post', function(done) {
        dpd.socketReady(function() {
          dpd.users.once('changed', function() {
            done();
          });

          dpd.users.post({username: 'foo@bar.com', password: '123456'});
        });
      });

      it('should respond to the changed event (in AfterCommit) on put', function(done) {
        dpd.users.post({username: 'foo2@bar.com', password: '123456'}, function(item) {
          dpd.socketReady(function() {
            dpd.users.once('changed', function() {
              done();
            });

            dpd.users.put(item.id, {username: 'foo3@bar.com'});
          });
        });
      });

      it('should respond to the changed event (in AfterCommit) on del', function(done) {
        dpd.users.post({username: 'foo2@bar.com', password: '123456'}, function(item) {
          dpd.socketReady(function() {
            dpd.users.once('changed', function() {
              done();
            });

            dpd.users.del(item.id);
          });
        });
      });
    });

    describe('dpd.users.put({}, fn)', function() {
      it('should allow omitting username and password', function(done) {
        chain(function(next) {
          dpd.users.post({username: 'foo', password: 'bar'}, next);
        }).chain(function(next, res, err) {
          dpd.users.put(res.id, {reputation: 10}, next);
        }).chain(function(next, res, err) {
          if(err) return done(err);
          expect(res.reputation).to.equal(10);
          done(err);
        });
      });

      it('should not allow nulled password', function(done) {
        var uid;
        chain(function(next) {
          dpd.users.post(credentials, next);
        }).chain(function(next, res, err) {
          uid = res.id;
          dpd.users.login(credentials, next);
        }).chain(function(next, res, err) {
          dpd.users.put(uid, {password: null}, next);
        }).chain(function(next, res, err) {
          expect(err).to.exist.with.property('errors');
          expect(err.errors).to.have.property('password');
          done(res);
        });
      });

      it('should not allow empty password string', function(done) {
        var uid;
        chain(function(next) {
          dpd.users.post(credentials, next);
        }).chain(function(next, res, err) {uid = res.id;
          dpd.users.login(credentials, next);
        }).chain(function(next, res, err) {
          dpd.users.put(uid, {password: ''}, next);
        }).chain(function(next, res, err) {
          expect(err).to.exist.with.property('errors');
          expect(err.errors).to.have.property('password');
          done(res);
        });
      });

      it('should not allow unauthenticated changes to username or password', function(done) {
        chain(function(next) {
          dpd.users.post({username: 'foo', password: 'bar'}, next);
        }).chain(function(next, res, err) {
          dpd.users.put(res.id, {username: 'changed', password: 'changed'}, next);
        }).chain(function(next, res, err) {
          expect(res.username).to.equal('foo');
          dpd.users.login({username: 'changed', password: 'changed'}, next);
        }).chain(function(next, res, err) {
          expect(err).to.exist;
          done();
        });
      });

      it('should allow authenticated changes to username or password', function(done) {
        var id;
        chain(function(next) {
          dpd.users.post({username: 'foo', password: 'bar'}, next);
        }).chain(function(next, res, err) {
          id = res.id;
          dpd.users.login({username: 'foo', password: 'bar'}, next);
        }).chain(function(next) {
          dpd.users.put(id, {username: 'changed', password: 'changed'}, next);
        }).chain(function(next, res, err) {
          if(err) return done(err);
          expect(res.username).to.equal('changed');
          dpd.users.login({username: 'changed', password: 'changed'}, next);
        }).chain(function(next, res, err) {
          if(err) return done(err);
          done();
        });
      });

      it('should allow changes to username and password via events', function(done) {
        chain(function(next) {
          dpd.users.post({username: 'foo', password: 'bar'}, next);
        }).chain(function(next, res, err) {
          if(err) return done(err);
          dpd.users.put(res.id, {displayName: "$CHANGEPASSWORD"}, next);
        }).chain(function(next, res, err) {
          if(err) return done(err);
          dpd.users.login({username: 'foo', password: 'changed'}, next);
        }).chain(function(next, res, err) {
          if(err) return done(err);
          done();
        });
      });

      it('should return true for isMe()', function(done) {
        var id;
        chain(function(next) {
          dpd.users.post({username: 'foo', password: 'bar'}, next);
        }).chain(function(next, res, err) {
          id = res.id;
          dpd.users.login({username: 'foo', password: 'bar'}, next);
        }).chain(function(next, res, err) {
          dpd.users.put(id, {displayName: "Foo Bar!"}, next);
        }).chain(function(next, res, err) {
          if(err) return done(err);
          expect(res.isMe).to.equal(true);
          done(err);
        });
      });

      it('should return false for isMe()', function(done) {
        var id;
        chain(function(next) {
          dpd.users.post({username: 'foo', password: 'bar'}, next);
        }).chain(function(next, res, err) {
          id = res.id;
          dpd.users.put(id, {displayName: "Foo Bar!"}, next);
        }).chain(function(next, res, err) {
          if(err) return done(err);
          expect(res.isMe).to.equal(false);
          done(err);
        });
      });
    });

    afterEach(function (done) {
      this.timeout(10000);
      dpd.users.logout(function () {
        // delete all users
        dpd.users.del({id: { $ne: null } }, function (users) {
          done();
        });
      });
    });
	});

  describe('dpd.emptyusers', function() {
    describe('.post()', function() {
      it('should store a username', function(done) {
        chain(function(next) {
          dpd.emptyusers.post({username: "hello", password: "password"}, next);
        }).chain(function(next, res, err) {
          if (err) return done(err);
          expect(res).to.exist;
          expect(res.username).to.equal("hello");
          dpd.emptyusers.get(res.id, next);
        }).chain(function(next, res, err) {
          if (err) return done(err);
          expect(res).to.exist;
          expect(res.username).to.equal("hello");
          done();
        });
      });
    });

    afterEach(function(done) {
      dpd.emptyusers.logout(function() {
        cleanCollection(dpd.emptyusers, function() {
          done();
        });
      });
    });
  });
});
