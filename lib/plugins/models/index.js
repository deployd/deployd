var Settings = require('../settings/settings')
  , Setting = require('../settings/setting')
  , Model = require('../../model')
  , types = require('../../types').validators
  , app = require('../../app')
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

app.get('/types', function(req, res) {
  res.send(Object.keys(types));
});

// initial refresh
refresh();

// create or update general models settings    
Setting
  .spawn()
  .unlock()
  .set({
    plugin: 'models'
  })
  .save()
;


