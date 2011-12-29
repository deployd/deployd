var config = require('./config')
  , mongodb = require('mongodb')
  , ObjectID = require('mongodb').BSONPure.ObjectID
  , connectionString = config['db-host'] + config['db']
  , Db = mongodb.Db
  , Server = mongodb.Server
  , server = new Server(config['db-host'], 27017, {auto_reconnect: true, native_parser: true})
  , db = new Db(config['db'], server, {})
  , EventEmitter = require('events').EventEmitter
;

var loader = new EventEmitter();

// since we are using 'once'
loader.setMaxListeners(0);

db.open(function (err) {
  if(err) {
    loader.emit('error', err);
  } else {
    loader.emit('connected');
  }
});

function ready(fn) {
  return function() {
    var _self = this
      , args = arguments
    ;
    
    db.state === 'connected'
      ? fn.apply(this, arguments)
      : loader.once('connected', function () {
          fn.apply(_self, args);
        })
    ;
  }
}

function collection(db, model, fn) {
  db.collection(model.collection, fn);
}

module.exports = {
  
  db: db,
  
  find: ready(function(model) {
    var query = model.toQuery() || {}
      , id = model.get('_id') || (query && query._id)
      , _id = id && ObjectID(id)
    ;
    
    if(_id) query._id = _id;
    
    collection(db, model, function(err, collection) {
      // TODO limit 1 for models, allow all for collections
      // TODO remove password filter, add to model
      collection.find(query, {password: 0}).toArray(function(err, results) {
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
          if(err) model.error(err.message, err.name);
          model.refresh(changes);
        }
    ;
    
    if(_id && query) query._id = _id;
    if(_id) changes._id = _id;
    
    collection(db, model, function(err, collection) {
      if(query && Object.keys(query).length) {
        collection.update(query, changes, options, callback);
      } else {
        collection.insert(changes, callback)
      }
    }); 
  }),
  
  remove: ready(function(model) {
    collection(db, model, function(err, collection) {
      var query = model.toQuery() || {}
        , id = model.get('_id')
        , _id = id;
      
      if(typeof id === 'string') {
        _id = ObjectID(id);
      }
      
      _id && (query._id = _id);
      
      collection.remove(query);
      model.refresh({_id: null});
    });
  }),
  
  index: ready(function(model, property, options, fn) {
    collection(db, model, function(err, collection) {
      var index = {};
      index[property] = 1;
      collection.ensureIndex(index, options, fn);
    });
  }),
  
  dropDatabase: function (database, fn) {
    var Db = mongodb.Db
      , Server = mongodb.Server
      , server = new Server(config['db-host'], 27017, {auto_reconnect: true, native_parser: true})
      , dropDb = new Db(database, server, {})
    ;
    
    dropDb.open(function () {
      dropDb.dropDatabase(function (err, result) {
        fn();
      });
    });
  }
}
  
