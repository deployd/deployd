var app = require('../../app')
  , Group = require('./group')
  , Groups = require('./groups')
  , User = require('./user')
  , Users = require('./users')
  , ObjectID = require('mongodb').BSON
;

function user(action, params, req, res) {
  User
    .spawn()
    .for(req)
    .set(params)
    .notify(res)
    [action]()
  ;
}

app.post('/users', function(req, res) {
  user('save', req.body, req, res);
});

app.post('/users/login', function(req, res) {
  user('login', req.body, req, {
    send: function(u) {
      if(!u.errors) {
        u.auth = req.sessionID;
        req.session.user = u;
      } else {
        u.errors = [{"message":"The Username or Password were incorrect","type":"Login"}];
      }
      res.send(u);
    }
  });
});

app.get('/users/logout', function(req, res) {
  req.session.destroy(function() {
    res.send({auth: null});    
  });
});

app.get('/me', function(req, res) {
  User
    .spawn()
    .for(req)
    .find({email: req.session.user && req.session.user.email})
    .notify(res)
    .fetch()
  ;
});

app.del('/me', function(req, res) {
  var u = req.session.user;
  if(u) user('remove', u, req, res);
});

app.get('/users/:id', function(req, res) {
  User
    .spawn()
    .for(req)
    .find({_id: req.param('id')})
    .notify(res)
    .fetch()
  ;
});

app.post('/users/:email/group', function(req, res) {
  var changes = {}
    , group = req.body && req.body.group
    , user = User.spawn().notify(res)
  ;

  // TODO: re-impelement for security
  // if(group === 'root') {
  //   user.error('Cannot add users to the root group', 'Permissions');
  //   user.fetch();
  //   return;
  // }
  
  // TODO validate group
  changes['groups.' + group] = 1;
  user
    .for(req)
    .find({email: req.param('email')})
    .set({$set: changes})
    .save()
  ;
});

app.get('/users', function(req, res) {
  Users
    .spawn({
      query: req.params
    })
    .for(req)
    .notify(res)
    .fetch()
  ;
});
