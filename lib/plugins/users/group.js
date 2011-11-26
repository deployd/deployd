var Model = require('../../model');

var Group = module.exports = Model.spawn({
  
  collection: 'groups',
  plugin: 'users',
  
  description: {
    name: {type: 'string', unique: true},
    creator: 'string'
  },
  
  allowed: {
    read: 'root',
    write: 'creator',
    remove: 'creator',
    create: 'root'
  }

});

var defaults = ['root', 'admin', 'public'];

defaults.forEach(function(group) {
  var g = {name: group, creator: 'root'};
  
  Group
    .spawn()
    .unlock()
    .find(g)
    .set(g)
    .save()
  ;
});