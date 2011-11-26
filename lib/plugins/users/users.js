var Collection = require('../../collection')
  , User = require('./user')
;

module.exports = Collection.spawn({
  collection: 'users',
  plugin: 'users',
  model: User
});