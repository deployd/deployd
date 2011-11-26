var Collection = require('../../collection')
  , App = require('./app')
;

module.exports = Collection.spawn({
  collection: 'apps',
  plugin: 'apps',
  model: App
});