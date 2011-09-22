var config = require('./config').load('db.json')
  , mongodb = require('mongodb')
  , db
;

function ready(fn) {
  return function() {
    var _self = this
      , args = arguments
    ;
    
    db
      ? fn.apply(this, arguments)
      : mongodb.connect(config.url, safely(function(err, _db) {
          db = _db;
          fn.apply(_self, args);
        }))
    ;
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

function collection(db, model, fn) {
  db.collection(model.collection, safely(fn));
}

module.exports = {
  
  find: ready(function(model) {
    var query = model.toQuery();
    
    collection(db, model, function(err, collection) {
      collection.find(query, safely(function(err, result) {
        result.toArray(function(err, arr) {
          model.refresh(arr);
        })
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
  
