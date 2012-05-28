var db = module.exports = {}
  , util = require('util')
  , EventEmitter = require('events').EventEmitter
  , mongodb = require('mongodb');

/**
 * Create a new database connection with the given options. You can start making
 * database calls right away. They are internally buffered and executed once the
 * connection is resolved.
 *
 * Options:
 *
 *   - `name`         the database name
 *   - `host`         the database host
 *   - `port`         the database port
 *
 * Example:
 *
 *     db
 *       .connect({host: 'localhost', port: 27015, name: 'test'})
 *       .createStore('testing-store')
 *       .insert({foo: 'bar'}, fn)
 *
 * @param {Object} options
 * @return {Db}
 */

db.connect = function (options, fn) {
  var db = new Db(options);
  db.open(fn);
  return db;
}

/**
 * A `Db` abstracts a driver implementation of the database. This allows for
 * a single interface to be used against any database implementation.
 *
 * Example:
 *
 *     var redis = require('redis');
 *     
 *     function Redis(options) {
 *       this.options = options;
 *       this._redis = redis.createClient()
 *     }
 *     util.inherits(Redis, Db);
 *     
 *     Redis.prototype.open = function (fn) {
 *       this._redis.once('ready', fn);
 *     }
 *
 * @param {Object} options
 * @api private
 */
 
function Db(options) {
  this.options = options;
}
util.inherits(Db, EventEmitter);
db.Db = Db;


/**
 * Open a connection to the underlying database.
 *
 * @param {Function} callback
 * @api private
 */

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

/**
 * Create a new database store (eg. a collection).
 *
 * Example:
 *
 *     db
 *       .connect({host: 'localhost', port: 27015, name: 'test'})
 *       .createStore('testing-store')
 *       .insert({foo: 'bar'}, fn)
 *
 * @param {String} namespace
 * @return {Store}
 */

Db.prototype.createStore = function (namespace) {
  return new Store(namespace, this);
}

/**
 * Initialize a space in the database (eg. a collection).
 *
 * @param {String} namespace
 * @param {Db} db
 * @api private
 */

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

/**
 * Insert an object into the store.
 *
 * Example:
 *
 *     db
 *       .connect({host: 'localhost', port: 27015, name: 'test'})
 *       .createStore('testing-store')
 *       .insert({foo: 'bar'}, fn)
 *
 * @param {Object} object
 * @param {Function} callback(err, obj)
 */

Store.prototype.insert = function (object, fn) {
  collection(this, function (err, col) {
    col.insert(object, function (err, result) {
      if(Array.isArray(result) && !Array.isArray(object)) result = result[0];
      fn(err, result);
    });
  });
};

/**
 * Find all objects in the store that match the given query.
 *
 * Example:
 *
 *     db
 *       .connect({host: 'localhost', port: 27015, name: 'test'})
 *       .createStore('testing-store')
 *       .find({foo: 'bar'}, fn)
 *
 * @param {Object} query
 * @param {Function} callback(err, obj)
 */

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

/**
 * Find the first object in the store that match the given query.
 *
 * Example:
 *
 *     db
 *       .connect({host: 'localhost', port: 27015, name: 'test'})
 *       .createStore('testing-store')
 *       .first({foo: 'bar'}, fn)
 *
 * @param {Object} query
 * @param {Function} callback(err, obj)
 */

Store.prototype.first = function (query, fn) {
  collection(this, function (err, col) {
    col.findOne(query, fn);
  });
};

/**
 * Update an object or objects in the store that match the given query.
 *
 * Example:
 *
 *     db
 *       .connect({host: 'localhost', port: 27015, name: 'test'})
 *       .createStore('testing-store')
 *       .update({_id: '<an object id>'}, fn)
 *
 * @param {Object} query
 * @param {Object} object
 * @param {Function} callback(err, obj)
 */

Store.prototype.update = function (query, object, fn) {
  collection(this, function (err, col) {
    col.update(query, object, fn);
  });
};

/**
 * Remove an object or objects in the store that match the given query.
 *
 * Example:
 *
 *     db
 *       .connect({host: 'localhost', port: 27015, name: 'test'})
 *       .createStore('testing-store')
 *       .remove({_id: '<an object id>'}, fn)
 *
 * @param {Object} query
 * @param {Function} callback(err, obj)
 */

Store.prototype.remove = function (query, fn) {
  collection(this, function (err, col) {
    col.remove(query, fn);
  });
};

/**
 * Rename the store.
 *
 * Example:
 *
 *     db
 *       .connect({host: 'localhost', port: 27015, name: 'test'})
 *       .createStore('testing-store')
 *       .rename('renamed-store', fn)
 *
 * @param {String} namespace
 * @param {Function} callback(err, obj)
 */

Store.prototype.rename = function (namespace, fn) {
  collection(this, function (err, col) {
    col.rename(namespace, fn);
  });
};

