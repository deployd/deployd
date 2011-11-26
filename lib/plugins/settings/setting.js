var Model = require('../../model');

module.exports = Model.spawn({
  
  collection: 'settings',
  plugin: 'settings',
  
  description: {
    name: {type: 'string'},
    type: 'string',
    description: 'object'
  },
  
  strict: false
  
});