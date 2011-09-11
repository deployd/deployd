var config = require('../config').load('db.json')
  , mongodb = require('mongodb')
  , db
;

function ready(fn) {
  return function() {
    var _self = this
      , args = arguments;
    db ? fn.apply(_self, args) : this.connect(safely(function() {
      fn.apply(_self, args);
    }));
  }
}

function error(err) {
  console.error('A database error has occured.');
  throw err;
}

function safely(fn) {
  return function(err) {
    err ? error(err) : fn.apply(this, arguments);
  }
}

function collection(mongo, model, fn) {
  mongo.collection(model.collection, safely(fn));
}

module.exports = {
  
  connect: function(fn) {
    mongodb.connect(config.url, fn);
  },
  
  find: ready(function(model) {
    var query = model.toQuery();
    
    collection(db, model, function(err, collection) {
      collection.find(query, safely(function(err, result) {
        model.refresh(result);
      }));
    });
  }),
  
  upsert: ready(function(model) {
    var query = model.toQuery()
      , changes = model.toJSON()
      , options = {
        safe: true,
        multi: true,
        upsert: true
      }
    ;
    
    collection(db, model, function(err, collection) {
      collection.update(query, changes, options, safely(function(err, result) {
        model.refresh(result);
      }));
    });
  }),
  
  remove: ready(function(model) {
    collection(db, model, function(err, collection) {
      collection.remove(model.toQuery(), safely(function(err, result) {
        model.refresh();
      }));
    });
  })
  
}
  
