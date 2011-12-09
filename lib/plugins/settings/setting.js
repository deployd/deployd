var Model = require('../../model')
  , models = require('../models')
;

module.exports = Model.spawn({
  
  collection: 'settings',
  plugin: 'settings',
  
  description: {
    name: {type: 'string', unique: true, required: true},
    plugin: 'string',
    collection: 'string',
    description: 'object'
  },
  
  refresh: function(changes) {    
    if(!changes.errors) {
      if(changes.plugin === 'models') models.refresh();
      else if(changes.collection) Model.refreshSettings(changes.collection);
    }
    
    Model.refresh.apply(this, arguments);
  },
  
  strict: false
  
});