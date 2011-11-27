var Model = require('../../model');

module.exports = Model.spawn({
  
  collection: 'settings',
  plugin: 'settings',
  
  description: {
    name: {type: 'string', unique: true, required: true},
    plugin: 'string',
    collection: 'string',
    description: 'object'
  },
  
  strict: false
  
});