var Model = require('../../model')
  , ObjectID = require('mongodb').BSONPure.ObjectID
  , _ = require('underscore')
;

module.exports = Model.spawn({
  
  collection: 'users',
  plugin: 'users',
  
  description: {
    email: {type: 'email', unique: true},
    password: 'password',
    name: 'string',
    auth: 'string',
    removed: 'boolean',
    groups: 'object'
  },
  
  allowed: {
    read: 'public',
    write: 'creator',
    remove: 'creator',
    create: 'public',
    special: {
      groups: {read: 'public', write: 'root'},
      email: {read: 'creator'}
    }
  },
  
  toJSON: function() {
    var j = Model.toJSON.apply(this, arguments);
    
    // remove password before sending to clients
    delete j.password;
    
    return j;
  },
  
  set: function(changes) {
    // prevent ever storing a real password
    changes.password && (changes.password = this.hash(changes.password));
    
    return Model.set.apply(this, arguments);
  },
  
  login: function() {
    if(!this.get('email') || !this.get('password')) this.error('User email and password are required', 'Required Field');
    
    return this.fetch();
  },
  
  hash: function(password) {
    return password + 'hash!';
  },
  
  defineRoutes: function() {
    // routes in ./index.js
  }
  
});

