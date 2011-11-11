var app = require('../../app')
  , config = require('../../config').load()
  , Settings = require('./settings')
  , Setting = require('./setting')
;

app.get('/settings', function(req, res) {
  Settings
    .spawn()
    .notify(res)
    .fetch()
  ;
});

app.get('/settings/:type', function(req, res) {  
  Setting
    .spawn()
    .find({type: req.param('type')})
    .notify(res)
    .fetch()
  ;
});

// create or update app settings
Setting
  .spawn()
  .find({type: 'app'})
  .set(config)
  .set({type: 'app'})
  .save()
;