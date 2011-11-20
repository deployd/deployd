var app = require('../../app')
  , config = require('../../config').load()
  , Settings = require('./settings')
  , Setting = require('./setting')
;

app.get('/settings', function(req, res) {
  Settings
    .spawn()
    .for(req)
    .notify(res)
    .fetch()
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

var Model = require('../../model').spawn();
Model.unlock();
Model.collection = 'system.indexes';
Model.notify(function(data) {
    config.indexes = data;
    
    Setting
      .spawn()
      .find({name: 'app'})
      .set(config)
      .set({name: 'app'})
      .save()
    ;
}).fetch();

// create or update app settings
