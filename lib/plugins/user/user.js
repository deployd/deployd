var Model = require('../../model')
  , ObjectID = require('mongodb').BSONPure.ObjectID
  , _ = require('underscore')
;

module.exports = Model.spawn({
  
  initialize: function() {
    var _self = this;
    
    Model.initialize.apply(this, arguments);
  },
  
  collection: 'users',
  
  toQuery: function() {
    var uid = this.get('uid')
      , q = {uid: uid}
    ;
    
    if(!uid) this.error('You must include a user id (User.uid) to search for', 'Invalid Request');
    
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
    if(!this.get('uid') || !this.get('password')) this.error('User ID and password are required', 'Required Field');
    
    return this.fetch();
  },
  
  hash: function(password) {
    return password + 'hash!';
  }
  
});

