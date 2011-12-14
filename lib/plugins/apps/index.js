var app = require('../../app')
  , App = require('./app')
  , Apps = require('./apps')
  , Invite = require('./invite')
;

if(process.argv.length < 3) {
  require('./balancer');
}

app.post('/apps', function(req, res) {
  var session = req.session
    , me = session && session.user && session.user.email
    , secret = req.param('secret')
    , app = App.spawn().for(req).notify(res)
    , name = req.param('name')
  ;
  
  if(!me) return res.send({error: 'Not Allowed'});
  
  Invite
    .spawn()
    .unlock()
    .find({secret: secret})
    .set({left: 0})
    .notify(function(json) {
      if(json.errors || !json.left) {
        app.error('Invalid secret');
      }
      
      App
        .spawn()

        .find({name: name})
        .notify(function(json) {
          if(json.name === name) {
            app.error('App already exists with this name');
          }
            app
              // TODO: remove when 'user' create permission is supported
              .unlock()
              .set({name: name, creator: me})
              .save()
            ;
        })
        .fetch()
      ;

    })
    .fetch()
  ;
  

});

app.del('/apps', function(req, res) {
  var app = App
    .spawn()
    .for(req)
    .find({name: req.param('name')})
    .notify(function(json) {
      app
        .notify(res)
        .remove()
      ;
    })
    .fetch()
  ;
});

// views
app.get('/my/apps', function(req, res) {
  if(req.session && req.session.user) {
    res.render(__dirname + '/views/index.ejs');
  } else {
    res.redirect('/');
  }
});

app.get('/login', function(req, res) {
  res.render(__dirname + '/views/login.ejs');
});