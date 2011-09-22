var Collection = lib.require('collection');

console.log(Collection.fetch);

module.exports = Collection.spawn({collection: 'users'});