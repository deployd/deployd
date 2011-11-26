var Collection = require('../../collection')
  , Group = require('./group')
;

module.exports = Collection.spawn({
  collection: 'groups',
  plugin: 'users',
  model: Group
});