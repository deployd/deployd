var Model = require('../../model');

module.exports = Model.spawn({
  
  collection: 'settings',
  
  description: {
    type: {type: 'string', unique: true},
    description: 'object'
  },
  
  strict: false
  
});