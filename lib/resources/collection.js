var validation = require('validation')
  , util = require('util')
  , Resource = require('../resource')
  , db = require('../db')
  , EventEmitter = require('events').EventEmitter
  , asyncEval = require('async-eval')
  , debug = require('debug')('collection');

/**
 * A `Collection` proxies and validates incoming requests then proxies them into a `Store`.
 *
 * Settings:
 *
 *   - `path`         the base path a resource should handle
 *   - `properties`   the properties of objects the collection should store 
 *   - `db`           the database a collection will use for persistence
 *   - `onGet`        a function to execute after a collection gets an object
 *   - `onPost`       a function to execute before a collection creates an object
 *   - `onPut`        a function to execute before a collection updates an object
 *   - `onDelete`     a function to execute before a collection deletes an object
 *   - `onValidate`   a function to execute before a collection creates or updates an object
 *
 * Example:
 *
 *     var properties = {title: {type: 'string'}, done: {type: 'boolean'}, created: {type: 'date'}}
 *       , onPost = 'this.created = new Date()'
 *       , todos = new Collection({properties: properties, onPost});
 *
 * @param {Object} settings
 * @api private
 */

function Collection(settings) {
  Resource.apply(this, arguments);
  this.settings = settings;
  if(settings) {
    this.properties = settings.properties;
    this.store = settings.db && settings.db.createStore(this.settings.path.replace('/', ''));
  }
}
util.inherits(Collection, Resource);

/**
 * Validate the request `body` against the `Collection` `properties` 
 * and return an object containing any `errors`.
 *
 * @param {Object} body
 * @return {Object} errors
 * @api private
 */

Collection.prototype.validate = function (body, create) {
  if(!this.properties) this.properties = {};
  
  var keys = Object.keys(this.properties)
    , props = this.properties
    , errors = {};
    
  keys.forEach(function (key) {
    var prop = props[key]
      , val = body[key]
      , type = prop.type || 'string';
    
    debug('validating %s against %j', key, prop);

    if(validation.exists(val)) {
      // coercion
      if(type === 'number') val = Number(val);

      if(!validation.isType(val, type)) {
        debug('failed to validate %s as %s', key, type);
        errors[key] = 'must be a ' + type;
      }
    } else if(prop.required) {
      debug('%s is required', key);
      if(create) {
        errors[key] = 'is required'; 
      }
    } else if(type === 'boolean') {
      body[key] = false;
    }
  });
  
  if(Object.keys(errors).length) return errors;
}

/**
 * Sanitize the request `body` against the `Collection` `properties` 
 * and return an object containing only properties that exist in the
 * `Collection.settings.properties` object.
 *
 * @param {Object} body
 * @return {Object} sanitized
 * @api private
 */

Collection.prototype.sanitize = function (body) {
  var sanitized = {}
    , props = this.properties
    , keys = Object.keys(props);

  keys.forEach(function (key) {
    var prop = props[key]
    , expected = prop.type
    , val = body[key]
    , actual = typeof val;

    // skip properties that do not exist
    if(!prop) return;

    if(expected == actual) {
      sanitized[key] = val;
    } else if(expected == 'number' && actual == 'string') {
      sanitized[key] = parseInt(val);
    }
  });
  
  return sanitized;
}

/**
 * Handle an incoming http `req` and `res` and execute
 * the correct `Store` proxy function based on `req.method`.
 *
 *
 * @param {ServerRequest} req
 * @param {ServerResponse} res
 */

Collection.prototype.handle = function (ctx) {

  // set id one wasnt provided in the query
  ctx.query.id = ctx.query.id || this.parseId(ctx);

  if (ctx.req.internal) {
    ctx.session.internal = true;
  }

  switch(ctx.req.method) {
    case 'GET':
      this.find(ctx.session, ctx.query, ctx.dpd, ctx.done);
    break;
    case 'POST':
    case 'PUT':
      this.save(ctx.session, ctx.body, ctx.query, ctx.dpd, ctx.done);
    break;
    case 'DELETE':
      this.remove(ctx.session, ctx.query, ctx.dpd, ctx.done);
    break;
  }
}


/**
 * Parse the `ctx.url` for an id
 *
 * @param {Context} ctx
 * @return {String} id
 */

Collection.prototype.parseId = function(ctx) {
  if(ctx.url && ctx.url !== '/') return ctx.url.split('/')[1];
}

/**
 * Execute a collection event listener based on the given method.
 *
 * Example:
 *
 *     var c = new Collection({
 *       onPost: 'error("foo", "must not be bar")'
 *     });
 *     
 *     var item = {foo: 'bar'};
 *
 *     c.execListener('Post', session, query, item, function (err, result) {
 *       expect(result).to.eql({"foo": "must not be bar"});
 *     });
 *
 * @param {String} method
 * @param {Object} session
 * @param {Object} query
 * @param {Object|Array} item
 * @param {Function} callback
 */

Collection.prototype.execListener = function(method, session, query, item, client, fn) {
  var listener = this.settings && this.settings['on' + method]
    , errors
    , data = item
    , options = {
      this: item,
      context: {
        me: session && session.user,
        internal: session.internal,
        console: console,
        emit: function(collection, query, event, data) {
          if(arguments.length === 4) {
            session.emitToUsers(collection, query, event, data);
          } else if(arguments.length === 2) {
            event = collection;
            data = query;
            session.emitToAll(event, data);
          }
        },
        error: function(key, val) {
          errors = errors || {};
          errors[key] = val || true;
        },
        cancel: function(msg, status) {
          if (!session.isRoot && !session.internal) {
            var err = new Error(msg);
            err.statusCode = status;
            throw err; 
          }
        },
        hide: function(property) {
          if (!session.isRoot && !session.internal) {
            delete data[property];
          }
        },
        protect: function(property) {
          if (!session.isRoot && !session.internal) {
            delete data[property];
          }
        }
      },
      asyncFunctions: {dpd: client}
    };
  
  debug('executing listener', method);

  // on get, iterate over the results and execute individually
  if(method === 'Get') {
    if(Array.isArray(data)) {
      var total = data.length;
      if (total) {
        data.forEach(function(item) {
          //options.this = item;
          // options.context.hide = ;
          var opts = {
            this: item,
            context: {
              me: session && session.user,
              query: query,
              session: session,
              internal: session.internal,
              console: console,
              emit: options.context.emit,
              protect: options.context.protect,
              error: options.context.error,
              cancel: options.context.cancel,
              hide: function(property) {
                if (!session.isRoot) {
                  delete item[property];
                }
              }
            },
            asyncFunctions: {dpd: client}
          };
          asyncEval(listener, opts, function (err) {
            if(err) {
              debug('error when executing %s listener', method, err);
              fn(err);
              total = -1;
            }
            total--;
            if(!total) {
              fn(err || errors, data);
            }
          });
        });
      } else {
        fn(null, data);
      }
    } else {
      asyncEval(listener, options, function (err) {
        if(err) debug('error when executing %s listener', method, err);
        fn(err || errors, item);
      });
    }

  } else {
    asyncEval(listener, options, function (err) {
      if(err) debug('error when executing %s listener', method, err);
      fn(err || errors, item);
    });
  }
}

/**
 * Find all the objects in a collection that match the given
 * query. Then execute its get listener on each object.
 *
 * @param {Object} session
 * @param {Object} query
 * @param {Function} callback(err, result)
 */

Collection.prototype.find = function (session, query, client, fn) {
  var collection = this
    , store = this.store;
  
  debug('finding %j', query);
  
  store.find(query, function (err, result) {
    debug("Find Callback");
    if(err) return fn(err);
    debug('found %j', err || result || 'none');
    collection.execListener('Get', session, query, result, client, function (err, results) {
      debug("Listener Callback");
      if(err) {
        err.message = 'Error while executing GET event: ' + err.message;
        return fn(err);
      }
      if(query.id) return fn(null, results[0]);
      fn(null, results);
    });
  });
}

/**
 * Execute the onDelete listener. If it succeeds, remove all objects in a
 * collection that match the given query.
 *
 * @param {Object} session
 * @param {Object} query
 * @param {Function} callback(err)
 */

Collection.prototype.remove = function (session, query, client, fn) {
  var collection = this
    , store = this.store;
  
  if(!(query && query.id)) return fn('You must include a query with an id when deleting an object from a collection.');
  store.find(query, function (err, result) {
    if(err) {
      err.message = 'Error while executing DELETE event: ' + err.message;
      return fn(err);
    }
    
    collection.execListener('Delete', session, query, result, client, function (err) {
      if(err) return fn(err);
      store.remove(query, fn);
    });
  });
}

/**
 * Execute the onPost or onPut listener. If it succeeds, 
 * save the given item in the collection.
 *
 * @param {Object} session
 * @param {Object} query
 * @param {Object|Array} item
 * @param {Function} callback(err, result)
 */

Collection.prototype.save = function (session, item, query, client, fn) {
  var collection = this
    , store = this.store;
  
  // support optional argument for query
  if(typeof query == 'function') {
    fn = query;
    query = {};
  }
  
  query = query || {};
  
  if(!item) return fn('You must include an object when saving or updating.');
  
  // handle id on either body or query
  if(item.id) {
    query.id = item.id;
  }

  debug('saving with id %s', query.id)

  collection.execListener('Validate', session, query, item, client, function (err, item) {
    if(err) return fn(err);

    var errors = collection.validate(item, !query.id);

    if(errors) return fn({errors: errors});

    if(query.id) {
      // is PUT
      store.first({id: query.id, $fields: query.$fields}, function(err, obj) {
       // merge changes
        Object.keys(item).forEach(function (key) {
          obj[key] = item[key];
        });

        collection.execListener('Put', session, query, item, client, function (err, item) {
          if(err) {
            err.message = 'Error while executing PUT event: ' + err.message;
            return fn(err);
          }
          if(!obj) return fn(new Error('You can\'t update an object by ID that does not exist.'));

          delete item.id;
          store.update(query, item, function (err) {
            if(err) return fn(err);
            fn(null, obj);
          });
        });
      });
    } else {
      // is POST
      // generate id before event listener
      item.id = store.createUniqueIdentifier();

      collection.execListener('Post', session, query, item, client, function (err, item) {
        if(err) {
          err.message = 'Error while executing POST event: ' + err.message;
          return fn(err);
        }
        store.insert(item, fn);
      });
    }
  })
}

Collection.defaultPath = '/my-objects';

Collection.prototype.changed = function(ctx, fn) {
  var store = this.store;

  switch(ctx.req.method) {
    case 'DELETE':
      return store.remove(fn);
    break;
    case 'PUT':
      var properties = ctx.body && ctx.body.properties
        , renames;
      if(properties) {
        Object.keys(properties).forEach(function (key) {
          if(properties[key] && properties[key].$renameFrom) {
            renames = renames || {};
            renames[properties[key].$renameFrom] = key;
            delete properties[key].$renameFrom;
          }
        })
      }

      if(renames) {
        store.update({}, {$rename: renames}, function (err) {
          fn(err, ctx.body);
        });
        return;
      }
    break;
  }

  fn(null, ctx.body);
}

Collection.prototype.clientGeneration = true;

module.exports = Collection;