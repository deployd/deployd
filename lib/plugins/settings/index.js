var app = require('../../app')
  , config = require('../../config').load()
  , Settings = require('./settings')
  , Setting = require('./setting')
;

app.post('/setting', function (req, res) {
  Setting
    .spawn()
    .set(req.body)
    .notify(res)
    .save()
  ;
});

app.get('/settings', function(req, res) {
  Settings
    .spawn()
    .for(req)
    .notify(res)
    .fetch()
  ;
});

app.post('/settings', function(req, res) {
  Settings
    .spawn()
    .for(req)
    .find({name: req.body.name, plugin: req.body.name})
    .set(req.body)
    .notify(res)
    .save()
  ;
});

app.get('/settings/:name', function(req, res) {  
  Setting
    .spawn()
    .for(req)
    .find({name: req.param('name')})
    .notify(res)
    .fetch()
  ;
});

// create or update general app settings    
Setting
  .spawn()
  .find({name: 'app'})
  .set(config)
  .set({name: 'app'})
  .save()
;
