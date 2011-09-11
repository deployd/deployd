var app = require('../app')
  , users = require('../model/users')
;

app.get('/users', function(req, res) {
  users
  .fetch()
  .notify(res)
});