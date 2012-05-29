describe('Event IO', function() {

  describe('On POST /likes', function() {
    it('should modify another object', function(done) {
      users.get(function(errU, user) {
        var user = user[0];
        var likes = user.likes || 0;
        unauthed.use('/likes').post({userId: user._id}, function(errL, like) {
          users.get({_id: user._id}, function(errU2, user2) {
            var user2 = user2[0];
            expect(user2.likes).to.equal(likes + 1);
            done(errU || errL || errU2);
          });
        });
      });
    });
  });

  describe('On GET /likes', function() {
    it('should get another object', function(done) {
      users.get(function(errU, user) {
        var user = user[0];
        unauthed.use('/likes').post({userId: user._id}, function(errL, like) {
          done(errL)
        });
      });
    });
  });
});