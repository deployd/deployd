var Model = require('../../model');

module.exports = Model.spawn({
  
  collection: 'invites',
  plugin: 'apps',
  
  description: {
    secret: 'string',
    left: 'number'
  }
  
});