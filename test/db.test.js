var db = require('db')
  , User = require('plugins/user/user')
;

var user = User.spawn();

exports.module = {
  'db.find()': function() {
    user.notify({
      send: function(u) {
        assert.ok(u._id);
      }
    })
    db.find(user);
  }
}