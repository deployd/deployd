var app = lib.require('app')
  , User = require('./user')
  , Users = require('./users')
;

function user(action, params, res) {
  User
    .spawn()
    .set(params)
    .notify(res)
    [action]()
  ;
}

app.post('/user', function(req, res) {
  user('save', req.body, res);
});

app.post('/user/login', function(req, res) {
  user('login', req.body, {
    send: function(u) {
      u.auth = req.sessionID;
      res.send(req.session.user = u);
    }
  });
});

app.get('/me', function(req, res) {
  user('fetch', {uid: req.session.user.uid}, res);
});

app.del('/me', function(req, res) {
  var u = req.session.user;
  if(u) user('remove', u, res);
});

app.get('/user/:uid', function(req, res) {
  user('fetch', {uid: req.param('uid')}, res);
});

app.get('/users', function(req, res) {
  Users
    .spawn({
      query: req.params
    })
    .notify(res)
    .fetch()
  ;
});