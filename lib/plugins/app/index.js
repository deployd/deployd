var app = require('../../app')
  , App = require('./app')
;

app.get('/apps', function() {
  
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

app.get('/app/:id', function() {
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
})