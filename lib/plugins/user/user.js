var Model = require('../../model')
  , ObjectID = require('mongodb').BSONPure.ObjectID
  , _ = require('underscore')
;

module.exports = Model.spawn({
  
  collection: 'users',
  
  plugin: 'user',
  
  description: {
    email: {type: 'email', unique: true},
    password: 'password',
    name: 'string',
    auth: 'string',
    removed: 'boolean',
    group: 'string'
  },
  
  allowed: {
    read: 'creator',
    write: 'creator',
    remove: 'creator'
  },
  
  toQuery: function() {
    var email = this.get('email')
      , q = {email: email}
    ;
    
    if(!email) this.error('You must include an email (User.email) to search for', 'Invalid Request');
    
    return q;
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
  }
  
});

