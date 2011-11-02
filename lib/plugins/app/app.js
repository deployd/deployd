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
      , app = name && name.replace(/ /g, '-')
      , creator = this.get('creator')
    ;
    
    console.log(app);
    
    if(app && creator) {
      if(this.isNew()) {
        this.create(app, {name: name});
      } else {
        this.restart(app);
      }
    } else {
      app || this.error('App.name is required.', 'App');
      creator || this.error('Must be logged in to create an app.', 'App');
    }
    
    Model.save.apply(this, arguments);
  },

  create: function(app, config) {
    var _self = this;
    
    mongodb.connect('mongodb://localhost/' + app, function(err, db) {
      db.collection('config', function(err, collection) {
        collection.insert(config, function(err) {
          _self.restart(app);
        });
      });
    });
  },

  restart: function(app) {
    exec('deployd ' + app);
  }

});