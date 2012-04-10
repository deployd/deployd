describe('Users', function(){
  describe('POST /users', function(){
    it('should register a new user', function(done) {
      users.post(data.users[0], function (err, user) {
        expect(user._id).to.exist;
        expect(user.email).to.eql(data.users[0].email);
        expect(user.password).to.not.exist;
        
        // for use in GET /users test
        data.users[0]._id = user._id;
        
        done(err);
      })
    })
    
    it('should fail without a valid user (and not requested as root)', function(done) {
      var unAuthed = require('../lib/client').use('http://localhost:3003/users');
      
      unAuthed.post({foo: 'bar'}, function (err, res) {
        expect(err).to.exist;
        done();
      });
    })
  })
  
  describe('POST /users/login', function(){

    it('should not login if email and password are not provided', function(done) {
      users.use('/login').post({}, function (err, session, req, res) {
        expect(err).to.exist;
        done();
      });
    });
    
    it('should login if provided the correct credentials', function(done) {
      users.use('/login').post({email: data.users[0].email, password: data.users[0].password}, function (err, session, req, res) {
        expect(session._id).to.have.length(24);
        expect(session.user.password).to.not.exist;
        expect(res.headers['set-cookie'][0].indexOf(session._id) > -1).to.equal(true);
        done(err);
      });
    })
    
    it('should not respond to a GET', function(done) {
      users.use('/login').get(function (err, res) {
        expect(err).to.exist;
        done();
      })
    })
  })
  
  describe('GET /users/me', function(){
    it('should return the current session', function(done) {
      users.use('/login').post({email: data.users[0].email, password: data.users[0].password}, function (err, session, req, res) {
        client.use('/users/me').get(function (err, user) {
          expect(user).to.exist;
          expect(user._id).to.have.length(24);
          expect(user.password).to.not.exist;
          done(err);
        })
      })
    })
  })
  
  describe('POST /users/logout', function(){
    it('should logout the current user', function(done) {
      users.use('/login').post({email: data.users[0].email, password: data.users[0].password}, function (err, session, req, res) {
        unauthed.use('/users/logout').post(function (err, res) {
          expect(err).to.not.exist;
          unauthed.use('/users/me').get(function (err, res) {
            expect(err).to.exist;
            done();
          });
        });
      })
    })
    
    it('should not respond to DELETE', function(done) {
      users.use('/login').post({email: data.users[0].email, password: data.users[0].password}, function (err, session, req, res) {
        unauthed.use('/users/logout').del(function (err, res) {
          expect(err).to.exist;
          unauthed.use('/users/me').get(function (err, res) {
            expect(err).to.not.exist;
            done();
          });
        });
      })
    })
    
    it('should return an error if trying to logout twice', function(done) {
      client.use('/users/logout').post(function (err, body, req, res) {
        expect(err).to.exist;
        done();
      });
    })
  })
  
  describe('GET /users', function(){
    it('should return a user if an id is provided', function(done) {
      client.use('/users').get({_id: data.users[0]._id}, function (err, user) {
        expect(user).to.exist;
        expect(user).to.have.length(1);
        expect(user[0].password).to.not.exist;
        done(err);
      })
    })
    
    it('should not return a user when an _id is not provided', function(done) {
      var unAuthed = require('../lib/client').use('http://localhost:3003/users');
      
      unAuthed.get(function (err, res) {
        expect(err).to.exist;
        expect(res).to.not.exist;
        done();
      })
    })
    
    it('should return a user when an _id is not provided and requested as root', function(done) {
      client.use('/users').get(function (err, res) {
        expect(res).to.exist;
        done();
      })
    })
  })
})