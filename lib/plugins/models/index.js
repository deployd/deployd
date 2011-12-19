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
    .notify(function(models) {
      models.forEach(function(model) {
        if(model.name && model.collection) {
          var m = models[model.name] = Model.spawn({
             description: model.description,
             allowed: model.allowed,
             collection: model.collection,
             plugin: model.plugin
          });
          
          m.updateSettings();
          m.defineRoutes(app);
        }
      });
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


