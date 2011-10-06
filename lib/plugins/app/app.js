var Model = lib.require('model')
  , ObjectID = require('mongodb').BSONPure.ObjectID
  ,	exec = require('child_process').exec
  , _ = require('underscore')
  , mongodb = require('mongodb')
;

module.exports = Model.spawn({

  collection: 'apps',

  save: function() {
    var app = this.get('name').replace(' ', '-');
    // TODO: validate
    Model.save.apply(this, arguments);
    if(this.isNew()) {
      this.create(app, this.get('config'));
    } else {
      this.restart(app);
    }
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