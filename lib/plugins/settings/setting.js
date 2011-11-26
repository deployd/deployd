var Model = require('../../model');

module.exports = Model.spawn({
  
  collection: 'settings',
  plugin: 'settings',
  
  description: {
    plugin: 'string',
    description: 'object'
  },
  
  strict: false
  
});