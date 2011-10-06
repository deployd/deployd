var config = require('./config').load('db.json')
  , mongodb = require('mongodb')
  , APP_NAME = process.argv[0] || 'deployd'
  , db
;

function ready(fn) {
  return function() {
    var _self = this
      , args = arguments
    ;
    
    db
      ? fn.apply(this, arguments)
      : mongodb.connect(config.host + APP_NAME, safely(function(err, _db) {
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
    
    if(!query) throw new Error('model does not return a query object from toQuery()');
    
    collection(db, model, function(err, collection) {
      
      collection
        .find(query)
        .toArray(function(err, results) {
          if(err) throw err;
          model.refresh(results);
        })
      ;
    });
  }),
  
  upsert: ready(function(model) {
    var query = model.toQuery()
      , changes = model.toJSON()
      , options = {safe: true}
      , callback = safely(function(err, result) {
          model.refresh(changes);
        })
    ;
    
    collection(db, model, function(err, collection) {
      if(query && query._id) {        
        collection.update(query, changes, options, callback);
      } else {
        collection.insert(changes, callback)
      }
    });
  }),
  
  remove: ready(function(model) {
    collection(db, model, function(err, collection) {
      collection.remove(model.toQuery()._id);
      console.log('remove', model);
      model.refresh({removed: true});
    });
  })
  
}
  
