var Model = require('../../model')
  , ObjectID = require('mongodb').BSONPure.ObjectID
  , _ = require('underscore')
  , crypto = require('crypto')
;

module.exports = Model.spawn({
  
  collection: 'users',
  plugin: 'users',
  
  description: {
    email: {type: 'email', unique: true},
    password: 'password',
    name: 'string',
    auth: 'string',
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
    
    return this
      .find({
        email: this.get('email'),
        password: this.get('password')
      })
      .fetch()
    ;
  },
  
  hash: function(password) {
    return crypto
      .createHash('md5')
      .update(password.toString())
      .digest('hex')
    ;
  },
  
  defineRoutes: function() {
    // routes in ./index.js
  }
  
});

