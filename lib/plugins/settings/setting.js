var Model = require('../../model');

module.exports = Model.spawn({
  
  collection: 'settings',
  plugin: 'setting',
  
  description: {
    name: {type: 'string', unique: true},
    type: 'string',
    description: 'object'
  },
  
  strict: false
  
});