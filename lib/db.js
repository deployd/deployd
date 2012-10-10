var db = module.exports = {}
  , util = require('util')
  , EventEmitter = require('events').EventEmitter
  , mongodb = require('mongodb')
  , uuid = require('./util/uuid')
  , scrub = require('scrubber').scrub
  , debug = require('debug')('db');

/**
 * Create a new database with the given options. You can start making
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
 *       .create({host: 'localhost', port: 27015, name: 'test'})
 *       .createStore('testing-store')
 *       .insert({foo: 'bar'}, fn)
 *
 * @param {Object} options
 * @return {Db}
 */

db.create = function (options) {
  var db = new Db(options);
  return db;
};

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
  this._mdb = new mongodb.Db(this.options.name, new mongodb.Server(this.options.host, this.options.port));
}
util.inherits(Db, EventEmitter);
db.Db = Db;

/**
 * Drop the underlying database.
 *
 * @param {Function} callback
 * @api private
 */

Db.prototype.drop = function (fn) {
  getConnection(this, function (err, mdb) {
    mdb.open(function () {
      mdb.dropDatabase(fn);
    });
  });
};

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
};

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

function getConnection(db, fn) {
  if(db.connected) {
    fn(null, db._mdb);
  } else if(db.connecting) {
    db.once('connection attempted', function (err) {
      fn(err, db._mdb);
    });
  } else {
    db.connecting = true;
    db._mdb.open(function (err) {
      db.connecting = false;
      db.emit('connection attempted', err);
      if(err) {
        db.connected = false;
        throw err;
      } else {
          
        // check for credentials
        var credentials = db.options.credentials;
        if (credentials && credentials.username && credentials.password) {
          db._mdb.authenticate(credentials.username, credentials.password, function (err) {
            if (err) {
              db.connected = false;
              throw err;
            }
            db.connected = true;
            fn(null, db._mdb);
          });
        } else {
          db.connected = true;
          fn(null, db._mdb);
        }
      }
    });
  }
}

function collection(store, fn) {
  var db = store._db;
  
  getConnection(db, function (err, mdb) {
    if(err) return fn(err);
    
    mdb.collection(store.namespace, function (err, collection) {
      if(err || !collection) {
        console.error(err || new Error('Unable to get ' + store.namespace + ' collection'));
        process.exit(1);
      }
      
      fn(null, collection);
    });
  });
}

/**
 * Change public IDs to private IDs.
 *
 * IDs are generated with a psuedo random number generator.
 * 24 hexidecimal chars, ~2 trillion combinations.
 *
 * @param {Object} object
 * @return {Object}
 * @api private
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
 * Change query IDs to private IDs.
 *
 * @param {Object} object
 * @return {Object}
 * @api private
 */

Store.prototype.scrubQuery = function (query) {
  // private mongo ids can be anywhere in a query object
  // walk the object recursively replacing id with _id
  // NOTE: if you are implementing your own Store,
  // you probably wont need to do this if you want to store ids
  // as 'id'

  if(query.id && typeof query.id === 'object') {
    query._id = query.id;
    delete query.id;
  }

  try {
    scrub(query, function (obj, key, parent, type) {
      // find any value using _id
      if(key === 'id' && parent.id) {
        parent._id = parent.id;
        delete parent.id;
      }
    });  
  } catch(ex) {
    debug(ex);
  }
  
};

/**
 * Create a unique identifier. Override this in derrived stores
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
 * @param {Object|Array} object
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
 * Find the number of objects in the store that match the given query.
 *
 * Example:
 *
 *     db
 *       .connect({host: 'localhost', port: 27015, name: 'test'})
 *       .createStore('testing-store')
 *       .count({foo: 'bar'}, fn)
 *
 * @param {Object} query
 * @param {Function} callback(err, num)
 */

Store.prototype.count = function(query, fn) {
  var store = this;
  if (typeof query == 'function') {
    fn = query;
    query = {};
  } else {
    query && this.scrubQuery(query);
  }

  var fields = stripFields(query)
    , options = stripOptions(query);

  collection(this, function (err, col) {
    if (err) return fn(err);
    col.find(query, fields, options).count(function(err, count) {
      if (err) return fn(err);
      fn(null, count);
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
  } else {
    query && this.scrubQuery(query);
  }

  // fields
  var fields = stripFields(query)
    , options = stripOptions(query);

  collection(this, function (err, col) {
    if(typeof query._id === 'string') {
      if(fields) {
        col.findOne(query, fields, options, function (err, obj) {
          store.identify(query);
          fn(err, store.identify(obj));
        });
      } else {
        col.findOne(query, options, function (err, obj) {
          store.identify(query);
          fn(err, store.identify(obj));
        });
      }
    } else {
      if(fields) {
        col.find(query,  fields, options).toArray(function (err, arr) {
          fn(err, store.identify(arr));
        });
      } else {
        col.find(query, options).toArray(function (err, arr) {
          fn(err, store.identify(arr));
        });
      }

    }

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
  query && this.scrubQuery(query);

  var store = this
    , fields = stripFields(query);

  collection(this, function (err, col) {
    if(fields) {    
      col.findOne(query, fields, function (err, result) {
        fn(err, store.identify(result));
      });
    } else {    
      col.findOne(query, function (err, result) {
        fn(err, store.identify(result));
      });
    }
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
  var store = this
    , multi = false
    , command = {};
    
  if(typeof query == 'string') query = {id: query};
  if(typeof query != 'object') throw new Error('update requires a query object or string id');
  if(query.id) {
    store.identify(query);
  }  else {
    multi = true;
  }

  stripFields(query);

  //Move $ queries outside of the $set command
  Object.keys(object).forEach(function(k) {
    if (k.indexOf('$') === 0) {
      command[k] = object[k];
      delete object[k];
    }
  });
  
  if(Object.keys(object).length) {
    command.$set = object;    
  }
  
  multi = query._id ? false : true;

  debug('update - query', query);
  debug('update - object', object);
  debug('update - command', command);

  collection(this, function (err, col) {
      col.update(query, command, {multi: multi}, function(err) {
      store.identify(query);
      fn(err);
    }, multi);
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

function stripFields(query) {
  if(!query) return;
  var fields = query.$fields;
  if(fields) delete query.$fields;
  return fields;
}

function stripOptions(query) {
  var options = {};
  if(!query) return options;
  // performance
  if(query.$limit) options.limit = query.$limit;
  if(query.$skip) options.skip = query.$skip;
  if(query.$sort || query.$orderby) options.sort = query.$sort || query.$orderby;
  delete query.$limit;
  delete query.$skip;
  delete query.$sort;
  return options;
}
