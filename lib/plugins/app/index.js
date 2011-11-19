var app = require('../../app')
  , App = require('./app')
;

if(process.argv.length < 3) {
  require('./balancer');
}

app.get('/apps', function(req, res) {
  
});

app.post('/app', function(req, res) {
  var session = req.session
    , me = session && session.user && session.user.email
  ;
  
  App
    .spawn()
    .for(req)
    .set({name: req.param('name'), creator: me})
    .notify(res)
    .save()
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