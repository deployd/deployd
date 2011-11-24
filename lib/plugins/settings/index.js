var app = require('../../app')
  , config = require('../../config').load()
  , Settings = require('./settings')
  , Setting = require('./setting')
  , graph = require('../graph')
  , Model = require('../../model')
;

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
    .find({name: req.body.name, plugin: req.body.plugin})
    .set(req.body)
    .notify(function(json) {
      if(req.body.plugin === 'graph') graph.refresh();
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
  .find({name: 'app'})
  .set(config)
  .set({name: 'app'})
  .save()
;
