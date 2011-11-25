var Settings = require('../settings/settings')
  , Setting = require('../settings/settings')
  , Model = require('../../model')
;

var models = module.exports.models = {};
var refresh = module.exports.refresh = function() {
  Settings
    .spawn()
    .find({plugin: 'graph'})
    .notify(function(model) {
      var m = models[model.name] = Model.spawn();
      m.description = model.description;
      m.allowed = model.allowed;
      m.collection = model.collection;
      m.plugin = model.plugin;
    })
    .fetch()
  ;
}

// initial refresh
refresh();

// create or update general graph settings    
Setting
  .spawn()
  .set({plugin: 'graph', name: 'graph'})
  .save()
;


