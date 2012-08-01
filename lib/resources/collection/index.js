var validation = require('validation')
  , util = require('util')
  , fs = require('fs')
  , path = require('path')
  , Resource = require('../../resource')
  , db = require('../../db')
  , EventEmitter = require('events').EventEmitter
  , asyncEval = require('async-eval')
  , debug = require('debug')('collection')
  , path = require('path');

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

function Collection(name, options) {
  Resource.apply(this, arguments);
  var config = this.config;
  if(config) {
    this.properties = config.properties;
  }
  if (options) {
    this.store = options.db && options.db.createStore(this.name);  
  }
}
util.inherits(Collection, Resource);


Collection.prototype.clientGeneration = true;

Collection.dashboardPages = ['Properties', 'Data', 'Events', 'API'];
Collection.dashboard = {
    path: path.join(__dirname, 'dashboard')
  , scripts: [
      '/js/lib/knockout-2.1.0.js'
    , '/js/lib/knockout.mapping.js'
    , '/js/lib/knockout-util.js'
    , '/js/util.js'
  ]

}

Collection.prototype.load = function(fn) {
  var eventNames = ['onGet', 'onPost', 'onPut', 'onDelete', 'onValidate']
    , remaining = eventNames.length
    , configPath = this.options && this.options.configPath
    , events = this.events = {};

  eventNames.forEach(function(e) {
    var fileName = e.substring(2).toLowerCase() + '.js';
    fs.readFile(path.join(configPath, fileName), 'utf-8', function(err, val) {
      if (val) {
        events[e] = val;
      }
      remaining--;
      if (remaining <= 0) {
        fn();
      }
    });
  });
}

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
  if(!this.properties) return {};

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
    } else if (expected === 'array' && Array.isArray(val)) {
      sanitized[key] = val;
    } else if(expected == 'number' && actual == 'string') {
      sanitized[key] = parseFloat(val);
    }
  });

  return sanitized;
}

Collection.prototype.sanitizeQuery = function (query) {
  var sanitized = {}
    , props = this.properties || {}
    , keys = Object.keys(query);

  keys.forEach(function (key) {
    var prop = props[key]
    , expected = prop && prop.type
    , val = query[key]
    , actual = typeof val;

    // skip properties that do not exist, but allow $ queries and id
    if(!prop && key.indexOf('$') !== 0 && key !== 'id') return;
    
    if(expected == 'number' && actual == 'string') {
      sanitized[key] = parseFloat(val);
    } else if (typeof val !== 'undefined') {
      sanitized[key] = val;
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
  ctx.query.id = ctx.query.id || this.parseId(ctx) || (ctx.body && ctx.body.id);

  if (ctx.req.internal) {
    ctx.session.internal = true;
  }

  switch(ctx.req.method) {
    case 'GET':
      this.find(ctx.session, ctx.query, ctx.dpd, ctx.done);
    break;
    case 'PUT':
      if (typeof ctx.query.id != 'string') {
        ctx.done("must provide id to update an object");
        break;
      } 
    case 'POST':
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
 *     c.execListener('Post', session, query, item, dpd, function (err, result) {
 *       expect(result).to.eql({"foo": "must not be bar"});
 *     });
 *
 * @param {String} method
 * @param {Object} session
 * @param {Object} query
 * @param {Object|Array} item
 * @param {InternalClient} client
 * @param {Function} callback
 */

Collection.prototype.execListener = function(method, session, query, item, client, fn) {
  // TODO: find a better way to grab the real id.
  var listener = this.events && this.events['on' + method]
    , errors
    , data = item
    , options = {
      this: item,
      context: {
        me: session && session.user,
        internal: session.internal,
        query: query || {},
        console: console,
        emit: function(collection, query, event, data) {
          if(arguments.length === 4) {
            session.emitToUsers(collection, query, event, data);
          } else if(arguments.length <= 2) {
            event = collection;
            data = query;
            if(session.emitToAll) session.emitToAll(event, data);
          }
        },
        error: function(key, val) {
          errors = errors || {};
          errors[key] = val || true;
        },
        cancel: function(msg, status) {
          if (!session.isRoot && !session.internal) {
            var err = {message: msg, statusCode: status};
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
          var opts = {
            this: item,
            context: {
              me: session && session.user,
              query: query || {},
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
              debug('error when executing multiple GET listener', method, err);
              debug('err instanceof Error: %j', err instanceof Error, typeof err);
              if (err instanceof Error) {
                err.message = "Error while executing GET listener: " + err.message;
                if(total > -1) fn(err.message);
                total = -1;  
              } else {
                item._err = err;
              }
            }
            total--;
            if(!total) {
              fn(null, data.filter(function(d) { return !d._err; }));
            }
          });
        });
      } else {
        fn(null, data);
      }
    } else {
      asyncEval(listener, options, function (err) {
        errors = errors && {errors: errors};
        if(err instanceof Error) { 
          debug('error when executing %s listener', method, err)
          err.message = "Error while executing " + method + " event: " + err.message;
        };
        debug('%s listener complete', method);
        fn(err || errors, item);
      });
    }

  } else {
    asyncEval(listener, options, function (err) {
      errors = errors && {errors: errors};
      if(err instanceof Error) {
        err.message = "Error while executing " + method + " event: " + err.message;
        debug('error when executing %s listener', method, err);
      } 
      debug('%s listener complete', method);
      if(err) {
        debug('errored during listener', err);
      }
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
    , store = this.store
    , sanitizedQuery = this.sanitizeQuery(query);
  
  debug('finding %j; sanitized %j', query, sanitizedQuery);
  debugger;
  
  store.find(sanitizedQuery, function (err, result) {
    debug("Find Callback");
    if(err) return fn(err);
    debug('found %j', err || result || 'none');
    collection.execListener('Get', session, query, result, client, function (err, results) {
      debug("Get listener called back with", err || results);
      if(typeof query.id === 'string' && (results && results.length === 0) || !results) {
        err = err || {
          message: 'not found',
          statusCode: 404
        }
        debug('could not find object by id %s', query.id);
      }
      if(err) {
        return fn(err);
      }
      if(typeof query.id === 'string' && Array.isArray(results)) return fn(null, results[0]);
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
      return fn(err);
    }
    
    collection.execListener('Delete', session, query, result, client, function (err) {
      if(err) return fn(err);
      store.remove(query, fn);
      if(session.emitToAll) session.emitToAll(collection.name + ':changed');
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

  // build command object
  var commands = {};
  Object.keys(item).forEach(function (key) {
    if(item[key] && typeof item[key] === 'object' && !Array.isArray(item[key])) {
      Object.keys(item[key]).forEach(function (k) {
        if(k[0] == '$') {
          commands[key] = item[key];
        }
      })
    }
  });

  item = this.sanitize(item);

  // handle id on either body or query
  if(item.id) {
    query.id = item.id;
  }

  debug('saving %j with id %s', item, query.id);

  // build item to validate
  // which includes commands

  collection.execListener('Validate', session, query, item, client, function (err, item) {
    if(err) return fn(err);

    if(query.id) {
      // is PUT
      store.first({id: query.id, $fields: query.$fields}, function(err, obj) {
        if(!obj) return fn(new Error('You can\'t update an object that does not exist.'));
        if(err) return fn(rerr);

        // merge changes
        Object.keys(obj).forEach(function (key) {
          if(typeof item[key] == 'undefined') item[key] = obj[key];
        });

        collection.execCommands('update', item, commands);

        var errors = collection.validate(item);
        
        if(errors) return fn(errors);

        collection.execListener('Put', session, query, item, client, function (err, item) {
          if(err) {
            return fn(err);
          }

          delete item.id;
          store.update(query, item, function (err) {
            if(err) return fn(err);
            item.id = obj.id;
            fn(null, item);
            
            if(session.emitToAll) session.emitToAll(collection.name + ':changed');
          });
        });
      });
    } else {
      // is POST
      var errors = collection.validate(item, true);

      if(errors) return fn(errors);

      // generate id before event listener
      item.id = store.createUniqueIdentifier();

      collection.execListener('Post', session, query, item, client, function (err, item) {
        if(err) {
          debug('error %j', err);
          return fn(err);
        }
        store.insert(item, fn);
        if(session.emitToAll) session.emitToAll(collection.name + ':changed');
      });
    }
  })
}

Collection.defaultPath = '/my-objects';

Collection.prototype.configDeleted = function(config, fn) {
  debug('resource deleted');
  return this.store.remove(fn);
}

Collection.prototype.configChanged = function(config, fn) {
  var store = this.store;

  debug('resource changed');

  var properties = config && config.properties
    , renames;
  
  if(config.$renameFrom != config.path) {
    store.rename(config.id.replace('/', ''), function (err) {
        fn(err);
    });
    return;
  }
  
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
    debug('renaming', renames);
    store.update({}, {$rename: renames}, function (err) {
      fn(err);
    });
    return;
  }

  fn(null);
}

Collection.prototype.execCommands = function (type, obj, commands) {
  try {
    if(type === 'update') {
      Object.keys(commands).forEach(function (key) {
        if(typeof commands[key] == 'object') {
          Object.keys(commands[key]).forEach(function (k) {
            if(k[0] !== '$') return;

            var val = commands[key][k];

            if(k === '$inc') {
              if(!obj[key]) obj[key] = 0;
              obj[key] += val;
            }
            if(k === '$push') {
              if(Array.isArray(obj[key])) {
                obj[key].push(val);
              } else {
                obj[key] = [val];
              }
            }
            if(k === '$pushAll') {
              if(Array.isArray(obj[key])) {
                if(Array.isArray(val)) {
                  for(var i = 0; i < val.length; i++) {
                    obj[key].push(val[i]); 
                  }
                }
              } else {
                obj[key] = val;
              }
            }
            if (k === '$pull') {
              if(Array.isArray(obj[key])) {
                obj[key] = obj[key].filter(function(item) {
                  return item !== val;
                });
              }
            }
            if (k === '$pullAll') {
              if(Array.isArray(obj[key])) {
                if(Array.isArray(val)) {
                  obj[key] = obj[key].filter(function(item) {
                    return val.indexOf(item) === -1;
                  });
                }
              }
            }
          })
        }
      })
    }
  } catch(e) {
    debug('error while executing commands', type, obj, commands);
  }
  return this;
}

module.exports = Collection;