var config = require('./config').load()
  , mongodb = require('mongodb')
  , ObjectID = require('mongodb').BSONPure.ObjectID
  , connectionString = config['db-host'] + config['db']
  , db
;

function ready(fn) {
  return function() {
    var _self = this
      , args = arguments
    ;
    
    db
      ? fn.apply(this, arguments)
      : mongodb.connect(connectionString, function(err, _db) {
          if(err || !_db) throw 'Could not connect to' + connectionString + ' (' + err + ')';
          db = _db;
          fn.apply(_self, args);
        })
    ;
  }
}

function collection(db, model, fn) {
  db.collection(model.collection, fn);
}

module.exports = {
  
  find: ready(function(model) {
    var query = model.toQuery() || {}
      , id = model.get('_id') || (query && query._id)
      , _id = id && ObjectID(id)
    ;
    
    if(_id) query._id = _id;
    
    collection(db, model, function(err, collection) {
      // TODO limit 1 for models, allow all for collections
      collection.find(query).toArray(function(err, results) {
        if(err) throw err;
        model.refresh(results);
      });
    });
  }),
  
  upsert: ready(function(model) {
    var query = model.toQuery()
      , changes = model.attributes
      , options = {safe: true, upsert: true}
      , id = model.get('_id')
      , _id = id && ObjectID(id)
      , callback = function(err, result) {
          model.refresh(changes);
        }
    ;
    
    if(_id && query) query._id = _id;
    
    collection(db, model, function(err, collection) {
      if(query) {
        collection.update(query, changes, options, callback);
      } else {
        collection.insert(changes, callback)
      }
    }); 
  }),
  
  remove: ready(function(model) {
    collection(db, model, function(err, collection) {
      var id = model.get('_id')
        , _id = id && ObjectID(id)
      ;
      
      collection.remove({_id: _id});
      model.refresh({removed: true});
    });
  }),
  
  index: ready(function(model, property, options, fn) {
    collection(db, model, function(err, collection) {
      var index = {};
      index[property] = 1;
      
      collection.ensureIndex(index, options, fn);
    });
  })
  
}
  
