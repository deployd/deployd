var Settings = require('../settings/settings')
  , Setting = require('../settings/setting')
  , Model = require('../../model')
;

var models = module.exports.models = {};
var refresh = module.exports.refresh = function() {
  Settings
    .spawn()
    .find({plugin: 'models'})
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

// create or update general models settings    
Setting
  .spawn()
  .unlock()
  .set({
    plugin: 'models'
  })
  .notify(function(json) {
    console.log(json);
  })
  .save()
;


