var app = require('../../app')
  , App = require('./app')
  , Invite = require('./invite')
;

if(process.argv.length < 3) {
  require('./balancer');
}

app.post('/app', function(req, res) {
  var session = req.session
    , me = session && session.user && session.user.email
    , secret = req.param('secret')
    , app = App.spawn().for(req).notify(res)
  ;
  
  Invite
    .spawn()
    .unlock()
    .find({secret: secret})
    .set({left: 0})
    .notify(function(json) {
      if(json.errors || !json.left) {
        app.error('Invalid secret');
      }
      
      app
        .set({name: req.param('name'), creator: me})
        .save()
      ;
    })
    .fetch()
  ;
  

});

app.get('/app/:id', function(req, res) {
  App
    .spawn()
    .for(req)
    .set({_id: req.param('id')})
    .notify(res)
    .fetch()
  ;
});

app.del('/app/:id', function(req, res) {
  App
    .spawn()
    .for(req)
    .notify(res)
    .remove()
  ;
});

// views
app.get('/my/apps', function(req, res) {
  res.render(__dirname + '/views/index.ejs');
});

app.get('/login', function(req, res) {
  res.render(__dirname + '/views/login.ejs');
});