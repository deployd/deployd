var db = module.exports = {}
  , util = require('util')
  , EventEmitter = require('events').EventEmitter
  , mongodb = require('mongodb');

db.connect = function (options, fn) {
  var db = new Db(options);
  db.open(fn);
  return db;
}

function Db(options) {
  this.options = options;
}
util.inherits(Db, EventEmitter);
db.Db = Db;

Db.prototype.createStore = function (namespace) {
  return new Store(namespace, this);
}

Db.prototype.open = function (fn) {
  var self = this
    , mdb = new mongodb.Db(this.options.name, new mongodb.Server(this.options.host, this.options.port));
  
  self.connecting = true;  
  self._mdb = mdb;
  mdb.open(function (err) {
    self.connecting = false;
    if(err) return fn && fn(err);
    self.emit('connected');
  })
}

function Store(namespace, db) {
  this.namespace = namespace;
  this._db = db;
}

function collection(store, fn) {
  var db = store._db
    , mdb = db._mdb;
  
  function execute(err) {
    if(err) return fn(err);
    
    mdb.collection(store.namespace, function (err, collection) {
      if(err || !collection) return fn(err || Error('collection was undefined or an error occured'));
      
      fn(null, collection)
    }); 
  }
  
  if(db.connecting) {
    db.once('connected', execute);
  } else {
    execute();
  }
};

Store.prototype.insert = function (object, fn) {
  collection(this, function (err, col) {
    col.insert(object, function (err, result) {
      if(Array.isArray(result) && !Array.isArray(object)) result = result[0];
      fn(err, result);
    });
  });
};

Store.prototype.find = function (query, fn) {
  if(typeof query == 'function') {
    fn = query;
    query = {};
  }
  collection(this, function (err, col) {
    col.find(query).toArray(function (err, arr) {
      if(arr.length === 0) arr = undefined;
      fn(err, arr);
    });
  });
};

Store.prototype.first = function (query, fn) {
  collection(this, function (err, col) {
    col.findOne(query, fn);
  });
};

Store.prototype.update = function (query, object, fn) {
  collection(this, function (err, col) {
    col.update(query, object, fn);
  });
};

Store.prototype.remove = function (query, fn) {
  collection(this, function (err, col) {
    col.remove(query, fn);
  });
};

Store.prototype.rename = function (namespace, fn) {
  collection(this, function (err, col) {
    col.rename(namespace, fn);
  });
};

