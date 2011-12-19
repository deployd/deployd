var app = require('../../app')
  , config = require('../../config')
  , Settings = require('./settings')
  , Setting = require('./setting')
  , models = require('../models')
  , Model = require('../../model')
;

// app.post('/settings', function(req, res) {
//   console.log('settings....');
//   
//   Setting
//     .spawn()
//     .for(req)
//     .find({name: req.body.name, plugin: req.body.plugin})
//     .set(req.body)
//     .notify(function(json) {
//       console.log(req.body);
//       if(req.body.plugin === 'models') models.refresh();
//       else if(json.collection) Model.refreshSettings(json.collection);
//       res.send(json);
//     })
//     .save()
//   ;
// });

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
  .unlock()
  .find({name: 'app'})
  .set(config)
  .set({name: 'app'})
  .save()
;
