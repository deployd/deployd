/**
 * Dependencies
 */

var validation = require('validation')
  , util = require('util')
  , Resource = require('../resource')
  , db = require('../db')
  , EventEmitter = require('events').EventEmitter
  , asyncEval = require('async-eval');
 
function Collection(settings) {
  Resource.apply(this, arguments);
  if(settings) {
    this.properties = settings.properties;
    this.store = settings.db && settings.db.createStore(this.settings.path.replace('/', ''));
  }
}
util.inherits(Collection, Resource);

Collection.prototype.validate = function (body) {
  if(!this.properties) this.properties = {};
  
  var keys = Object.keys(this.properties)
    , props = this.properties
    , errors = {};
    
  keys.forEach(function (key) {
    var prop = props[key]
      , val = body[key]
      , type = prop.type || 'string';
    
    if(validation.exists(val)) {
      if(!validation.isType(val, type)) {
        errors[key] = 'must be a ' + type;
      }
    } else if(prop.required) {
      errors[key] = 'is required';
    }
  });
  
  if(Object.keys(errors).length) return errors;
}

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

Collection.prototype.handle = function (req, res) {
  function fn(err, result) {
    if(err) return res.error(err);
    
    var resBody;
    
    if(result) {
      try {
        resBody = JSON.stringify(result);
      } catch(e) {
        return res.error(e);
      }

      res.setHeader('content-type', 'application/json');
      res.setHeader('content-length', resBody.length);
    }
    
    res.end(resBody);
  }
  
  switch(req.method) {
    case 'GET':
      this.find({}, req.query, fn);
    break;
    case 'POST':
    case 'PUT':
      this.save({}, req.body, req.query, fn);
    break;
    case 'DELETE':
      this.remove({}, req.query, fn);
    break;
  }
}


// turn each resource into a function only object
// to allow it to play nicely with async-eval
function clean(resources) {
  if(resources) {
    Object.keys(resources).forEach(function (resource) {
      var prev = resources[resource]
        , cleaned = {};

      Object.keys(prev.__proto__).forEach(function (key) {
        if(typeof prev[key] === 'function') {
          cleaned[key] = function () {
            prev[key].apply(prev, arguments);
          }
        }
      })
      
      resources[resource] = cleaned;
    })
    return resources;
  }
}

Collection.prototype.execListener = function(method, session, query, item, fn) {
  var listener = this.settings && this.settings['on' + method]
    , errors
    , data = item
    , options = {
      this: item,
      context: {
        console: console,
        error: function(key, val) {
          errors = errors || {};
          errors[key] = val || true;
        },
        cancel: function(msg, status) {
          if (!session.isRoot) {
            var err = new Error(msg);
            err.status = status;
            throw err; 
          }
        },
        hide: function(property) {
          if (!session.isRoot) {
            delete data[property];
          }
        },
        protect: function(property) {
          if (!session.isRoot) {
            delete data[property];
          }
        }
      },
      asyncFunctions: clean(this.settings.resources)
    };
  
  // on get, iterate over the results and execute individually
  if(method === 'Get') {
    var src = listener;
    listener = (function () {
      this.forEach(function (item) {
        function hide(property) {
          delete item[property];
        }
        (function() {
          '{SRC}'
        }).call(item);
      })
    }).toString().replace("'{SRC}'", src);
    listener = '(' + listener + ').call(this)';
  }
  
  asyncEval(listener, options, function (err) {
    fn(err, errors || item);
  });
}

Collection.prototype.find = function (session, query, fn) {
  var collection = this
    , store = this.store;
  
  store.find(query, function (err, result) {
    if(err) return fn(err);
    collection.execListener('Get', session, query, result, fn);
  });
}

Collection.prototype.remove = function (session, query, fn) {
  var collection = this
    , store = this.store;
  
  if(!(query && query._id)) return fn('You must include a query with an _id when deleting an object from a collection.');
  store.find(query, function (err) {
    if(err) return fn(err);
    collection.execListener('Delete', session, query, null, function (err) {
      if(err) return fn(err);
      store.remove(query, fn);
    });
  });
}

Collection.prototype.save = function (session, item, query, fn) {
  var collection = this
    , store = this.store;
  
  // support optional argument for query
  if(typeof query == 'function') {
    fn = query;
    query = {};
  }
  
  query = query || {};
  
  if(!item) return fn('You must include an object when saving or updating.');
  
  // handle _id on either body or query
  if(item._id) {
    query._id = item._id;
    delete item._id;
  }

  // handle upsert
  store[query._id ? 'update' : 'insert'].apply(store, query._id ? [query, item, fn] : [item, fn]);
}

/**
 * Export
 */
 
module.exports = Collection;