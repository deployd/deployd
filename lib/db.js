var db = module.exports = {}
  , util = require('util')
  , EventEmitter = require('events').EventEmitter
  , mongodb = require('mongodb')
  , uuid = require('./util/uuid');

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
 * Drop the underlying database.
 *
 * @param {Function} callback
 * @api private
 */

Db.prototype.drop = function (fn) {
  this._mdb.dropDatabase(fn);
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
module.exports.Store = Store;

function collection(store, fn) {
  var db = store._db
    , mdb = db._mdb;
  
  function execute(err) {
    if(err) return fn(err);
    
    mdb.collection(store.namespace, function (err, collection) {
      if(err || !collection) return fn(err || Error('collection was undefined or an error occured'));
      
      fn(null, collection);
    }); 
  }
  
  if(db.connecting) {
    db.once('connected', execute);
  } else {
    execute();
  }
};

/**
 * Change public IDs to private IDs.
 *
 * IDs are generated with a psuedo random number generator.
 * 24 hexidecimal chars, ~2 trillion combinations.
 *
 * @param {Object} object
 * @return {Object}
 */

Store.prototype.identify = function (object) {
  if(!object) return;
  if(typeof object != 'object') throw new Error('identify requires an object');
  var store = this;
  function set(object) {
    if(object._id) {
      object.id = object._id;
      delete object._id;
    } else {
      var u = object.id || store.createUniqueIdentifier();
      object._id = u;
      delete object.id;
    }
  }
  if(Array.isArray(object)) {
    object.forEach(set);
  } else {
    set(object);
  }
  return object;
};

/**
 * Create a unique identifier. Override this is derrived stores
 * to change the way IDs are generated.
 *
 * @return {String}
 */

Store.prototype.createUniqueIdentifier = function() {
  return uuid.create();
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
  var store = this;
  this.identify(object);
  collection(this, function (err, col) {
    col.insert(object, function (err, result) {
      if(Array.isArray(result) && !Array.isArray(object)) {
        result = result[0];
      }
      fn(err, store.identify(result));
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
  var store = this;
  if(typeof query == 'function') {
    fn = query;
    query = {};
  }
  collection(this, function (err, col) {
    col.find(query).toArray(function (err, arr) {
      if(arr.length === 0) arr = undefined;
      fn(err, store.identify(arr));
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
  this.identify(query);
  var store = this;
  collection(this, function (err, col) {
    col.findOne(query, function (err, result) {
      fn(err, store.identify(result));
    });
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
 *       .update({id: '<an object id>'}, fn)
 *
 * @param {Object} query
 * @param {Object} object
 * @param {Function} callback(err, obj)
 */

Store.prototype.update = function (query, object, fn) {
  var store = this;
  if(typeof query == 'string') query = {id: query};
  if(typeof query != 'object') throw new Error('update requires a query object or string id');
  if(query.id) store.identify(query);

  collection(this, function (err, col) {
    col.update(query, object, function(err) {
      store.identify(query);
      fn(err);
    });
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
 *       .remove({id: '<an object id>'}, fn)
 *
 * @param {Object} query
 * @param {Function} callback(err, obj)
 */

Store.prototype.remove = function (query, fn) {
  var store = this;
  if(typeof query === 'string') query = {id: query};
  if(typeof query == 'function') {
    fn = query;
    query = {};
  }
  if(query.id) {
    store.identify(query);
  }
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
  var store = this;
  collection(this, function (err, col) {
    store.namespace = namespace;
    col.rename(namespace, fn);
  });
};

