var app = require('../app')
  , users = require('../model/users')
;

app.get('/user', function(req, res) {
  users
  .fetch()
  .notify(res)
});