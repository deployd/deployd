var app = require('../../app')
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

app.get('/user/logout', function(req, res) {
  req.session.destroy(function() {
    res.send({auth: null})
  })
});

app.get('/me', function(req, res) {
  user('fetch', {email: req.session.user.email}, res);
});

app.del('/me', function(req, res) {
  var u = req.session.user;
  if(u) user('remove', u, res);
});

app.get('/user/:uid', function(req, res) {
  user('fetch', {email: req.param('uid')}, res);
});

app.post('/user/:user/group', function(req, res) {
  var user = req.param('user');
  if(user) {
    User
      .spawn()
      .set({email: user, group: req.param('group')})
      .notify(res)
      .save()
    ;
  }
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