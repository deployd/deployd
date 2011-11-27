var app = require('../../app')
  , config = require('../../config').load()
  , Settings = require('./settings')
  , Setting = require('./setting')
  , models = require('../models')
  , Model = require('../../model')
;

app.post('/settings', function(req, res) {
  Settings
    .spawn()
    .for(req)
    .find({name: req.body.name, plugin: req.body.plugin})
    .set(req.body)
    .notify(function(json) {
      if(req.body.plugin === 'models') models.refresh();
      else if(json.collection) Model.refreshSettings(json.collection);
      res.send(json);
    })
    .save()
  ;
});

app.get('/settings/:name', function(req, res) {  
  Setting
    .spawn()
    .for(req)
    .find({plugin: req.param('name')})
    .notify(res)
    .fetch()
  ;
});

// create or update general app settings    
Setting
  .spawn()
  .find({plugin: 'app', name: 'app'})
  .set(config)
  .set({plugin: 'app', name: 'app'})
  .save()
;
