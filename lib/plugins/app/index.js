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
    , me = session && session.user.uid
  ;
  
  App
    .spawn()
    .set({name: req.param('name'), creator: me})
    .notify(res)
    .save()
  ;
});

app.get('/app/:id', function(req, res) {
  App
    .spawn()
    .set({_id: req.param('id')})
    .notify(res)
    .fetch()
  ;
});

app.del('/app/:id', function(req, res) {
  App
    .spawn()
    .notify(res)
    .remove()
  ;
});

// views

app.get('/my/apps', function(req, res) {
  res.render(__dirname + '/views/index.ejs', {layout: false});
});