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
    
    it('should fail without a valid user', function(done) {
      users.post({foo: 'bar'}, function (err, res) {
        expect(err).to.exist;
        done();
      });
    })
  })
  
  describe('POST /users/login', function(){
    it('should login if provided the correct credentials', function(done) {
      users.use('/login').post(data.users[0], function (err, session, req, res) {
        expect(session._id).to.have.length(24);
        expect(session.user.password).to.not.exist;
        expect(res.headers['set-cookie'][0].indexOf(session._id) > -1).to.equal(true);
        done(err);
      });
    })
  })
  
  describe('GET /users/me', function(){
    it('should return the current session', function(done) {
      client.use('/users/me').get(function (err, session) {
        expect(session).to.exist;
        expect(session._id).to.have.length(24);
        expect(session.user).to.be.a('object');
        expect(session.user.password).to.not.exist;
        done(err);
      })
    })
  })
  
  describe('DELETE /users/logout', function(){
    it('should logout the current user', function(done) {
      // TODO fix mdoq-http bug - loses context if replace client with users
      client.use('/users/logout').del(done);
    })
    
    it('should return an error if trying to logout twice', function(done) {
      client.use('/users/logout').del(function (err, body, req, res) {
        expect(err).to.exist;
        // TODO confirm cookie is gone - mdoq-http doesnt include res for del()
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