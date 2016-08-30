var validation = require('validation')
  , util = require('util')
  , path = require('path')
  , Resource = require('../../resource')
  , debug = require('debug')('collection')
  , _ = require('underscore');

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
Collection.domainAdditions = {};

Collection.events  = ['Get', 'Validate', 'Post', 'Put', 'Delete', 'AfterCommit', 'BeforeRequest'];
Collection.dashboard = {
    path: path.join(__dirname, 'dashboard')
  , pages: ['Properties', 'Data', 'Events', 'API']
  , scripts: [
      '/js/lib/jquery-ui-1.8.22.custom.min.js'
    , '/js/lib/knockout-2.1.0.js'
    , '/js/lib/knockout.mapping.js'
    , '/js/util/knockout-util.js'
    , '/js/util/key-constants.js'
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
      , type = prop.type || 'string'
	  , isDate = Object.prototype.toString.call(val).indexOf("Date")>-1?
				true:false;

    debug('validating %s against %j', key, prop);

    if(validation.exists(val)) {
      // coercion
      if(type === 'number') val = Number(val);

      if(!validation.isType(val, type)) {
		//any state except (isDate=true and type = string or object or date) will lead to an error
		if(!(isDate && (type=='string' || type=='object' || type=='date')))
		{
			debug('failed to validate %s as %s', key, type);
			errors[key] = 'must be a ' + type;
		}
      }
    } else if(prop.required) {
      debug('%s is required', key);
      if(create || body.hasOwnProperty(key)) {
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
    , actual = typeof val
	, isDate = Object.prototype.toString.call(val).indexOf("Date")>-1?
				true:false;

    // skip properties that do not exist
    if(!prop) return;

    if(expected == actual) {
      sanitized[key] = val;
    } else if((expected == 'string' || expected == 'object' || expected == 'date') && isDate) {
      sanitized[key] =  val;
    } else if (expected === 'array' && Array.isArray(val)) {
      sanitized[key] = val;
    } else if(expected == 'number' && actual == 'string') {
      sanitized[key] = parseFloat(val);
    } else if(expected == 'string' && actual == 'number') {
      sanitized[key] = '' + val;
    } else if(val === null && (expected == 'string' || expected == 'array')) // keep null
      sanitized[key] = val;
  });

  return sanitized;
};

Collection.prototype.sanitizeQuery = function (query) {
  var sanitized = {}
    , props = this.properties || {}
    , keys = query && Object.keys(query);

  keys && keys.forEach(function (key) {
    var prop = props[key] || props[key.split('.')[0]]
    , expected = prop && prop.type
    , val = query[key]
    , actual = typeof val;

    // skip properties that do not exist, but allow $ queries and id
    if(!prop && key.indexOf('$') !== 0 && key !== 'id') return;

    // hack - $limitRecursion and $skipEvents are not mongo properties so we'll get rid of them, too
    if (key === '$limitRecursion') return;
    if (key === '$skipEvents') return;

    if(expected == 'string' && actual == 'number') {
      sanitized[key] = '' + val;
    } else if(expected == 'number' && actual == 'string') {
      sanitized[key] = parseFloat(val);
    } else if(expected == 'boolean' && actual == 'string') {
      sanitized[key] = (val === 'true') ? true : false;
    } else if(expected == 'object') {
      sanitized[key] = val;
    }  else if (typeof val !== 'undefined') {
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

  if (ctx.req.method == "GET" && ctx.query.id === 'count') {
    delete ctx.query.id;
    this.count(ctx, ctx.done);
    return;
  }

  if (ctx.req.method == "GET" && ctx.query.id === 'index-of') {
    delete ctx.query.id;
    var id = ctx.url.split('/').filter(function(p) { return p; })[1];
    this.indexOf(id, ctx, ctx.done);
    return;
  }

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

Collection.prototype.count = function(ctx, fn) {
  if (ctx.session.isRoot) {
    var store = this.store
      , sanitizedQuery = this.sanitizeQuery(ctx.query || {});

    store.count(sanitizedQuery, function (err, result) {
      if (err) return fn(err);

      fn(null, {count: result});
    });
  } else {
    fn({
      message: "Must be root to count",
      statusCode: 403
    });
  }
};

Collection.prototype.indexOf = function(id, ctx, fn) {
  if (ctx.session.isRoot) {
    var store = this.store
      , sanitizedQuery = this.sanitizeQuery(ctx.query || {});

    sanitizedQuery.$fields = {id: 1};

    store.find(sanitizedQuery, function (err, result) {
      if (err) return fn(err);

      var indexOf = result.map(function(r) { return r.id }).indexOf(id);

      fn(null, {index: indexOf});
    });
  } else {
    fn({
      message: "Must be root to get index",
      statusCode: 403
    });
  }
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

  function doFind() {
    // resanitize query in case it was modified from BeforeRequest event
    sanitizedQuery = collection.sanitizeQuery(query);

    debug('finding %j; sanitized %j', query, sanitizedQuery);
    store.find(sanitizedQuery, function (err, result) {
      debug("Find Callback");
      if(err) return done(err);
      debug('found %j', err || result || 'none');
      if(!collection.shouldRunEvent(collection.events.Get, ctx)) {
        return done(err, result);
      }

      var errors = {};

      if(Array.isArray(result)) {

        var remaining = result && result.length;
        if(!remaining) return done(err, result);
        result.forEach(function (data) {
          // domain for onGet event scripts
          var domain = collection.createDomain(data, errors);

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
        var domain = collection.createDomain(data, errors);

        collection.events.Get.run(ctx, domain, function (err) {
          if(err) return done(err);

          done(null, data);
        });
      }
    });
  }

  var beforeRequestDomain = { event: "GET" };
  collection.addDomainAdditions(beforeRequestDomain);
  collection.doBeforeRequestEvent(ctx, beforeRequestDomain, function(err) {
    if (err) return fn(err);
    doFind();
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
    , query = ctx.query
    , sanitizedQuery = this.sanitizeQuery(query)
    , errors;

  if(!(query && query.id)) return fn('You must include a query with an id when deleting an object from a collection.');

  function doRemove() {
    store.find(sanitizedQuery, function (err, result) {
      if(err) {
        return fn(err);
      }

      // if a single id was passed and it wasn't found, we'll get undefined
      // convert it to an empty array which will be handled below
      if (typeof result === 'undefined') {
        result = [];
      }
      // convert result to an array if it is not
      if (!Array.isArray(result)) {
        result = [result];
      }

      // nothing to delete
      if (result.length === 0) {
        return fn(null, { count: 0 });
      }

      var remaining = result.length
        , idsToDelete = [];

      function done(data, err) {
        var id = data.id;
        remaining--;
        if (result.length === 1 && err) {
          // we only have one row to delete but an error has occured, pass it through
          return fn(err);
        }

        if (err && err instanceof Error) {
          // only halt execution if an actual error was thrown from the script
          // cancel() from within the script is not an instance of Error, so it will be ignored by this
          return fn(err);
        } else if (!err) {
          // script executed without an error, this id will be deleted
          idsToDelete.push(id);
        }

        if(!remaining) {
          store.remove({ id: { $in: idsToDelete } }, function(){
            collection.doAfterCommitEvent('DELETE', ctx, data);
            fn.apply(null, arguments);
          });
        }
      }

      result.forEach(function(data) {
        if (collection.shouldRunEvent(collection.events.Delete, ctx)) {
          var domain = collection.createDomain(data, errors);
          collection.events.Delete.run(ctx, domain, function (err) { done(data, err);  });
        } else {
          done(data);
        }
      });
    });
  }

  var beforeRequestDomain = { event: "DELETE" };
  collection.addDomainAdditions(beforeRequestDomain);
  collection.doBeforeRequestEvent(ctx, beforeRequestDomain, function(err) {
    if (err) return fn(err);
    doRemove();
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
    , item = ctx.body

    , query = ctx.query || {}
    , errors = {};

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
    errors = domain && domain.hasErrors() && {errors: errors};
    debug('errors: %j', err);
    fn(errors || err, item);
  }

  var domain = collection.createDomain(item, errors);

  domain.protectedKeys = [];

  domain.protect = function(property) {
    if (domain.data.hasOwnProperty(property)) {
      domain.protectedKeys.push(property);
      delete domain.data[property];
    }
  };

  domain.changed =  function (property) {
    if(domain.data.hasOwnProperty(property)) {
      if(domain.previous && _.isEqual(domain.previous[property], domain.data[property])) {
        return false;
      }

      return true;
    }
    return false;
  };

  domain.previous = {};

  function put() {
    var id = query.id
      , sanitizedQuery = collection.sanitizeQuery(query)
      , prev = {};

    store.first(sanitizedQuery, function(err, obj) {
      if(!obj) {
        if (Object.keys(sanitizedQuery) === 1) {
          return done(new Error("No object exists with that id"));
        } else {
          return done(new Error("No object exists that matches that query"));
        }
      }
      if(err) return done(err);

      // copy previous obj
      Object.keys(obj).forEach(function (key) {
        prev[key] = _.clone(obj[key]);
      });

      // merge changes
      Object.keys(item).forEach(function (key) {
        obj[key] = item[key];
      });

      prev.id = id;
      item = obj;
      domain['this'] = item;
      domain.data = item;
      domain.previous = prev;

      collection.execCommands('update', item, commands);

      var errs = collection.validate(item);

      if(errs) return done({errors: errs});

      function runPutEvent(err) {
        if(err) {
          return done(err);
        }

        if(collection.shouldRunEvent(collection.events.Put, ctx)) {
          collection.events.Put.run(ctx, domain, commit);
        } else {
          commit();
        }
      }

      function commit(err) {
        if(err || domain.hasErrors()) {
          return done(err || errors);
        }

        delete item.id;
        store.update({id: query.id}, item, function (err) {
          if(err) return done(err);
          item.id = id;
          collection.doAfterCommitEvent('PUT', ctx, item, prev, domain.protectedKeys);
          done(null, item);
        });
      }

      if (collection.shouldRunEvent(collection.events.Validate, ctx)) {
        collection.events.Validate.run(ctx, domain, function (err) {
          if(err || domain.hasErrors()) return done(err || errors);
          runPutEvent(err);
        });
      } else {
        runPutEvent();
      }
    });
  }

  function post() {
    collection.execCommands('update', item, commands);
    var errs = collection.validate(item, true);

    if(errs) return done({errors: errs});

    // generate id before event listener
    item.id = store.createUniqueIdentifier();

    function commit(){
      store.insert(item, function(err, data) {
        if (err) return done(err);
        collection.doAfterCommitEvent('POST', ctx, item);
        done(null, data);
      });
    }

    if(collection.shouldRunEvent(collection.events.Post, ctx)) {
      collection.events.Post.run(ctx, domain, function (err) {
        if(err) {
          debug('onPost script error %j', err);
          return done(err);
        }
        if(err || domain.hasErrors()) return done(err || errors);
        debug('inserting item', item);

        commit();
      });
    } else {
      commit();
    }
  }

  var beforeRequestDomain = { event: "POST", data: item };
  collection.addDomainAdditions(beforeRequestDomain);

  if (query.id) {
    beforeRequestDomain.event = "PUT";
    collection.doBeforeRequestEvent(ctx, beforeRequestDomain, function(err) {
      if (err) return fn(err);
      put();
    });
  } else if (collection.shouldRunEvent(collection.events.Validate, ctx)) {
    collection.doBeforeRequestEvent(ctx, beforeRequestDomain, function(err) {
      if (err) return fn(err);
      collection.events.Validate.run(ctx, domain, function (err) {
        if(err || domain.hasErrors()) return done(err || errors);
        post();
      });
    });
  } else {
    collection.doBeforeRequestEvent(ctx, beforeRequestDomain, function(err) {
      if (err) return fn(err);
      post();
    });
  }
};

Collection.prototype.createDomain = function(data, errors) {
  var collection = this;

  var hasErrors = false;
  var domain = {
    error: function(key, val) {
      debug('error %s %s', key, val);
      errors[key] = val || true;
      hasErrors = true;
    },
    errorIf: function(condition, key, value) {
      if (condition) {
        domain.error(key, value);
      }
    },
    errorUnless: function(condition, key, value) {
      domain.errorIf(!condition, key, value);
    },
    hasErrors: function() {
      return hasErrors;
    },
    hide: function(property) {
      delete domain.data[property];
    },
    'this': data,
    data: data
  };
  collection.addDomainAdditions(domain);
  return domain;
};

Collection.prototype.addDomainAdditions = function(domain) {
  var collection = this;
  _.each(Collection.domainAdditions, function(value, name) {
    if (typeof value === "function") {
      // bind `this` to collection on any added functions
      domain[name] = value.bind({collection: collection, domain: domain});
    } else {
      domain[name] = value;
    }
  });
};

Collection.prototype.doAfterCommitEvent = function(method, ctx, data, previous, protectedKeys) {
  var collection = this;
  if (collection.shouldRunEvent(collection.events.AfterCommit, ctx)) {
    data = _.clone(data);
    if (protectedKeys && protectedKeys.length > 0 && previous) {
      // add back whatever fields were protected, because they are removed from data
      protectedKeys.forEach(function (key) {
        data[key] = previous[key];
      });
    }
    var domain = {data: data, 'this': data, method: method, previous: previous};
    collection.addDomainAdditions(domain);
    collection.events.AfterCommit.run(ctx, domain, function (err) {
      if (err) debug('AfterCommit errors in script: %j', err);
    });
  }
};

Collection.prototype.doBeforeRequestEvent = function(ctx, domain, fn) {
  var collection = this;
  if (collection.shouldRunEvent(collection.events.BeforeRequest, ctx)) {
    collection.events.BeforeRequest.run(ctx, domain, fn);
  } else {
    fn();
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

  if(config.id && config.id !== this.name) {
    store.rename(config.id.replace('/', ''), function (err) {
        if(err && err.message === "source namespace does not exist") {
          fn();
        } else {
          fn(err);
        }
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
              obj[key] = parseFloat(obj[key]);
              obj[key] += parseFloat(val);
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
            if (k === '$addUnique') {
              val = Array.isArray(val) ? val : [val];
              if(Array.isArray(obj[key])) {
                obj[key] = _.union(obj[key], val);
              } else {
                obj[key] = val;
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

Collection.prototype.shouldRunEvent = function (ev, ctx) {
  // check if a property is set on the context to ignore cascading to other events
  // used internally
  if (ctx && ctx._internalSkipEvents) return false;

  var skipEvents = ctx && ((ctx.body && ctx.body.$skipEvents) || (ctx.query && ctx.query.$skipEvents))
    , rootPrevent = ctx && ctx.session && ctx.session.isRoot && skipEvents;
  return !rootPrevent && ev;
};

Collection.extendDomain = function(name, val) {
    Collection.domainAdditions[name] = val;
};

module.exports = Collection;
