var app = lib.require('app')
  , users = require('./users')
;

console.log('loaded user controller');

app.get('/users', function(req, res) {
  users
    .fetch()
    .notify(res)
  ;
});