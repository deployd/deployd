describe('Users', function(){
  describe('POST /users', function(){
    it('should register a new user', function(done) {
      users.post(data.users[0], function (err, user) {
        expect(user._id).to.exist;
        delete user._id;
        expect(user).to.eql(data.users[0]);
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
      users.use('/login').post(data.users[0], done);
    })
  })
})