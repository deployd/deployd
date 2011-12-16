var spawn = require('child_process').spawn
  , assert = require('assert')
  , dpd = require('../lib/dpd')
;
  
// these tests simulate real usage
// spinning up multiple users and
// apps as well as faux app users
// and data

describe('deploydapp.com', function() {
  it('boot', function(done) {
    process.chdir(__dirname + '/../');
    spawn('node', ['index.js'])
      .stdout
      .once('data', done)
    ;
  });
});

var testUser = {email: 'test@test.com', password: 'test'}
  , testApp = {name: 'test-app'};

describe('users', function() {
  
  describe('POST /users', function() {
    it('should create a new user', function(done) {
      dpd('/users', testUser, function(err, user) {
        user._id.should.be.a('string');
        user.should.equal(testUser);
        should.not.exist(user.password);
        should.not.exist(user.errors);
      });
    });
  });

  describe('POST /users/login', function() {
    it('should login a user', function(done) {
      dpd('/users/login', testUser, function(err, user) {
        user._id.should.be.a('string');
        user.auth.should.be.a('string');
        should.not.exist(user.password);
        should.not.exist(user.errors);
        done();
      });
    });
  });

});

describe('POST /apps', function() {
  it('should create a new app', function(done) {
    dpd('/apps', app, function(err, app) {
      app.should.equal(testApp);
      app.creator.should.equal(testUser.email);
      should.not.exist(app.errors);
    })
  })
})

