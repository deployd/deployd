var Model = require('../../model')
  , ObjectID = require('mongodb').BSONPure.ObjectID
  ,	exec = require('child_process').exec
  , _ = require('underscore')
  , mongodb = require('mongodb')
;

module.exports = Model.spawn({
  
  collection: 'apps',
  
  save: function() {
    var name = this.get('name')
      , host = this.toHostName()
      , creator = this.get('creator')
    ;
    
    if(host && creator) {
      if(this.isNew()) {
        this.set({name: name, host: host, db: this.toDatabaseName(), creator: creator});
      } else {
        this.restart(host);
      }
      
      Model.save.apply(this, arguments);
    } else {
      host || this.error('App.name is required.', 'App');
      creator || this.error('Must be logged in to create an app.', 'App');
    }
  },
  
  toHostName: function() {
    var name = this.get('name')
      , app = name && name.replace(/ /g, '-')
      , creator = this.get('creator')
    ;
    
    return app.toLowerCase();
  },
  
  toDatabaseName: function() {
    return this.toHostName().replace(/\./g, ':');
  }
  
});