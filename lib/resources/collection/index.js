var validation = require('validation')
  , util = require('util')
  , fs = require('fs')
  , path = require('path')
  , Resource = require('../../resource')
  , db = require('../../db')
  , EventEmitter = require('events').EventEmitter
  , debug = require('debug')('collection')
  , path = require('path')
  , Script = require('../../script');

/**
 * A `Collection` validates incoming requests then proxies them into a `Store`.
 *
 * Options:
 *
 *   - `path`                the base path a resource should handle
 *   - `config.properties`   the properties of objects the collection should store 
 *   - `db`                  the database a collection will use for persistence
 *
 * @param {Object} options
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
Collection.external = {};
Collection.prototype.clientGeneration = true;

Collection.events  = ['Get', 'Validate', 'Post', 'Put', 'Delete'];
Collection.dashboard = {
    path: path.join(__dirname, 'dashboard')
  , pages: ['Properties', 'Data', 'Events', 'API']
  , scripts: [
      '/js/lib/jquery-ui-1.8.22.custom.min.js'
    , '/js/lib/knockout-2.1.0.js'
    , '/js/lib/knockout.mapping.js'
    , '/js/lib/knockout-util.js'
    , '/js/util.js'
  ]
};

/**
 * Validate the request `body` against the `Collection` `properties` 
 * and return an object containing any `errors`.
 *
 * @param {Object} body
 * @return {Object} errors
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
};

/**
 * Sanitize the request `body` against the `Collection` `properties` 
 * and return an object containing only properties that exist in the
 * `Collection.config.properties` object.
 *
 * @param {Object} body
 * @return {Object} sanitized
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
};

Collection.prototype.sanitizeQuery = function (query) {
  var sanitized = {}
    , props = this.properties || {}
    , keys = query && Object.keys(query);

  keys && keys.forEach(function (key) {
    var prop = props[key]
    , expected = prop && prop.type
    , val = query[key]
    , actual = typeof val;

    // skip properties that do not exist, but allow $ queries and id
    if(!prop && key.indexOf('$') !== 0 && key !== 'id') return;

    // hack - $limitRecursion is not a mongo property so we'll get rid of it, too
    if (key === '$limitRecursion') return;
    
    if(expected == 'number' && actual == 'string') {
      sanitized[key] = parseFloat(val);
    } else if (typeof val !== 'undefined') {
      sanitized[key] = val;
    }
  });

  return sanitized;
};

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

  switch(ctx.req.method) {
    case 'GET':
      this.find(ctx, ctx.done);
    break;
    case 'PUT':
      if (typeof ctx.query.id != 'string' && !ctx.req.isRoot) {
        ctx.done("must provide id to update an object");
        break;
      }
    /* falls through */
    case 'POST':
      this.save(ctx, ctx.done);
    break;
    case 'DELETE':
      this.remove(ctx, ctx.done);
    break;
  }
};


/**
 * Parse the `ctx.url` for an id
 *
 * @param {Context} ctx
 * @return {String} id
 */

Collection.prototype.parseId = function(ctx) {
  if(ctx.url && ctx.url !== '/') return ctx.url.split('/')[1];
};

/**
 * Find all the objects in a collection that match the given
 * query. Then execute its get script using each object.
 *
 * @param {Context} ctx
 * @param {Function} fn(err, result)
 */

Collection.prototype.find = function (ctx, fn) {
  var collection = this
    , store = this.store
    , query = ctx.query || {}
    , session = ctx.session
    , client = ctx.dpd
    , errors
    , data
    , sanitizedQuery = this.sanitizeQuery(query);

  function done(err, result) {
    debug("Get listener called back with", err || result);
    if(typeof query.id === 'string' && (result && result.length === 0) || !result) {
      err = err || {
        message: 'not found',
        statusCode: 404
      };
      debug('could not find object by id %s', query.id);
    }
    if(err) {
      return fn(err);
    }
    if(typeof query.id === 'string' && Array.isArray(result)) {
      return fn(null, result[0]);
    }
    
    fn(null, result);
  }

  debug('finding %j; sanitized %j', query, sanitizedQuery);
  
  store.find(sanitizedQuery, function (err, result) {
    debug("Find Callback");
    if(err) return done(err);
    debug('found %j', err || result || 'none');
    if(!collection.events.Get) {
      return done(err, result);
    }
    
    if(Array.isArray(result)) {

      var errors = {};

      var remaining = result && result.length;
      if(!remaining) return done(err, result); 
      result.forEach(function (data) {
        // domain for onGet event scripts
        var domain = {
          error: function(key, val) {
            errors = errors || {};
            errors[key] = val || true;
          },
          hide: function(property) {
            if (!session.isRoot) {
              delete data[property];
            }
          },
          'this': data,
          data: data
        };

        collection.events.Get.run(ctx, domain, function (err) {
          if (err) {
            if (err instanceof Error) {
              return done(err);
            } else {
              errors[data.id] = err;
            }
          }

          remaining--;
          if(!remaining) {
            done(null, result.filter(function(r) {
              return !errors[r.id];
            }));
          }
        });
      });
    } else {
      // domain for onGet event scripts
      data = result;
      var domain = {
        error: function(key, val) {
          errors = errors || {};
          errors[key] = val || true;
        },
        hide: function(property) {
          if (!session.isRoot) {
            delete data[property];
          }
        },
        'this': data,
        data: data
      };

      collection.events.Get.run(ctx, domain, function (err) {
        if(err) return done(err);
        
        done(null, data);
      });
    }
  });
};

/**
 * Execute a `delete` event script, if one exists, using each object found. 
 * Then remove a single object that matches the `ctx.query.id`. Finally call
 * `fn(err)` passing an `error` if one occurred.
 *
 * @param {Context} ctx
 * @param {Function} fn(err)
 */

Collection.prototype.remove = function (ctx, fn) {
  var collection = this
    , store = this.store
    , session = ctx.session
    , query = ctx.query
    , errors;
  
  if(!(query && query.id)) return fn('You must include a query with an id when deleting an object from a collection.');
  store.find(query, function (err, result) {
    if(err) {
      return fn(err);
    }
    
    function done(err) {
      if(err) return fn(err);
      store.remove(query, fn);
      if(session.emitToAll) session.emitToAll(collection.name + ':changed');
    }
    
    if(collection.events.Delete) {
      var domain = {
        error: function(key, val) {
          errors = errors || {};
          errors[key] = val || true;
        }
      };
      
      domain['this'] = domain.data = result;
      collection.events.Delete.run(ctx, domain, done);
    } else {
      done();
    }
  });
};

/**
 * Execute the onPost or onPut listener. If it succeeds, 
 * save the given item in the collection.
 *
 * @param {Context} ctx
 * @param {Function} fn(err, result)
 */

Collection.prototype.save = function (ctx, fn) {
  var collection = this
    , store = this.store
    , session = ctx.session
    , item = ctx.body
    , query = ctx.query || {}
    , client = ctx.dpd
    , errors;
      
  if(!item) return done('You must include an object when saving or updating.');

  // build command object
  var commands = {};
  Object.keys(item).forEach(function (key) {
    if(item[key] && typeof item[key] === 'object' && !Array.isArray(item[key])) {
      Object.keys(item[key]).forEach(function (k) {
        if(k[0] == '$') {
          commands[key] = item[key];
        }
      });
    }
  });

  item = this.sanitize(item);

  // handle id on either body or query
  if(item.id) {
    query.id = item.id;
  }

  debug('saving %j with id %s', item, query.id);

  function done(err, item) {
    errors = errors && {errors: errors};
    fn(errors || err, item);
  }

  var domain = {
    error: function(key, val) {
      debug('error %s %s', key, val);
      errors = errors || {};
      errors[key] = val || true;
    },
    hide: function(property) {
      if (!session.isRoot) {
        delete item[property];
      }
    },
    protect: function(property) {
      if (!session.isRoot) {
        delete item[property];
      }
    },
    'this': item,
    data: item
  };

  function put() {
    var id = query.id;
    store.first({id: query.id, $fields: query.$fields}, function(err, obj) {
      if(!obj) return done(new Error('You can\'t update an object that does not exist.'));
      if(err) return done(err);

      // merge changes
      Object.keys(item).forEach(function (key) {
        obj[key] = item[key];
      });

      item = obj;
      domain['this'] = item;
      domain.data = item;

      collection.execCommands('update', item, commands);

      var errs = collection.validate(item);
      
      if(errs) return done({errors: errs});

      function runPutEvent(err) {
        if(err) {
          return done(err);
        }

        if(collection.events.Put) {
          collection.events.Put.run(ctx, domain, commit);
        } else {
          commit();
        }
      }
      
      function commit(err) {
        if(err) {
          return done(err);
        }

        delete item.id;
        store.update(query, item, function (err) {
          if(err) return done(err);
          item.id = id;
          
          done(null, item);

          if(session && session.emitToAll) session.emitToAll(collection.name + ':changed');
        });
      }

      if (collection.events.Validate) {
        collection.events.Validate.run(ctx, domain, function (err) {
          runPutEvent(err);
        });
      } else {
        runPutEvent();
      }
    });
  }
  
  function post() {
    var errs = collection.validate(item, true);

    if(errs) return done({errors: errs});

    // generate id before event listener
    item.id = store.createUniqueIdentifier();
    
    if(collection.events.Post) {
      collection.events.Post.run(ctx, domain, function (err) {
        if(err) {
          debug('onPost script error %j', err);
          return done(err);
        }
        debug('inserting item', item);
        store.insert(item, done);
        if(session && session.emitToAll) session.emitToAll(collection.name + ':changed');
      });
    } else {
      store.insert(item, done);
      if(session && session.emitToAll) session.emitToAll(collection.name + ':changed');
    }
  }

  if (query.id) {
    put();
  } else if (collection.events.Validate) {
    collection.events.Validate.run(ctx, domain, function (err) {
      if(err || errors) return done(err || errors);
      post();
    });
  } else {
    post();
  }
};

Collection.defaultPath = '/my-objects';

Collection.prototype.configDeleted = function(config, fn) {
  debug('resource deleted');
  return this.store.remove(fn);
};

Collection.prototype.configChanged = function(config, fn) {
  var store = this.store;

  debug('resource changed');

  var properties = config && config.properties
    , renames;
  
  if(config.id && config.id !== this.name) {
    store.rename(config.id.replace('/', ''), function (err) {
        fn(err);
    });
    return;
  }

  fn(null);
};

Collection.external.rename = function (options, ctx, fn) {
  if(!ctx.req && !ctx.req.isRoot) return fn(new Error('cannot rename multiple'));
  
  if(options.properties) {
    this.store.update({}, {$rename: options.properties}, fn);
  }
};

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
          });
        }
      });
    }
  } catch(e) {
    debug('error while executing commands', type, obj, commands);
  }
  return this;
};

module.exports = Collection;