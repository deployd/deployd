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
util.inherits(Collection, EventEmitter);

Collection.prototype.authorize = function (method, query) {
  if(!(query && query._id)) {
    switch(method) {
      case 'PUT':
      case 'DELETE':
        return 'An _id must be included when modifying a Collection.';
      break;
    }
  }
}

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

    // skip properties that dont exist
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
  var eventQueue
    , collection = this;
  
  // automatically use the id of the posted body
  if(req.body && req.body._id) {
    (req.query || (req.query = {}))._id = req.body._id;
    req.method = 'PUT';
    delete req.body._id;
  }
  
  // bind event handlers
  if(this.settings) {
    eventQueue = this.bind(this.settings);
  }
  
  var authError = this.authorize(req.method, req.query);
  if(authError) return res.error(authError);
  
  if(req.method === 'POST' || req.method == 'PUT') {
    // alias post for put
    if(req.query && req.query._id) req.method = 'PUT';
    
    this.emit('before:validate', req.body, req, res);
    
    var validationErrors = this.validate(req.body);
    if(validationErrors) {
      return res.error(validationErrors);
    }
    var sanitized = this.sanitize(req.body);
  }

  if(this.store) {
    collection.emit('before:' + req.method.toLowerCase(), req.body, req, res);
    this.exec(req.method, req.query, sanitized, function (err, result) {
      collection.emit('after:' + req.method.toLowerCase(), result, req, res);
      if(err) return res.error(err);
      
      if(result) {
        try {
          var resBody = JSON.stringify(result);
        } catch(e) {
          return res.error(e);
        }

        res.setHeader('content-type', 'application/json');
        res.setHeader('content-length', resBody.length);
        if(eventQueue.pending) {
          console.log(req.method);
          eventQueue.once('completed', function () {
            res.end(resBody);
          });
        } else {
          res.end(resBody); 
        }
      } else {
        res.end();
      }
    })
  } else {
    res.error('Collection does not have a backing store.');
  }
}

/**
 * Store to HTTP method mapping.
 */
 
var map = {GET:'find', POST: 'insert', PUT: 'update', DELETE: 'remove'};

Collection.prototype.exec = function (method, query, body, fn) {
  var args;
  
  switch(method) {
    case 'GET':
      args = [query || {}, fn];
    break;
    case 'POST':
      args = [body, fn];
    break;
    case 'PUT':
      args = [query, body, fn];
    break;
    case 'DELETE':
      args = [query, fn];
    break;
  }
  
  this.store[map[method]].apply(this.store, args);
}

Collection.prototype.bind = function (settings) {
  var events = ['Get', 'Validate', 'Put', 'Post', 'Delete']
    , collection = this
    , queue = new EventEmitter();
  
  events.forEach(function (event) {
    var listener = settings['on' + event]
      , precondition = event === 'Get' ? 'after:' : 'before:';
    
    if(!listener) return;
    
    collection.on(precondition + event.toLowerCase(), function (item, req, res) {
      var errors = {}
        , data = item
        , options = {
          this: item,
          context: {
            console: console,
            error: function(key, val) {
              errors[key] = val || true;
            },
            cancel: function(msg, status) {
              if (!req.isRoot) {
                res.statusCode = status || 400;
                throw msg;  
              }
            },
            hide: function(property) {
              if (!req.isRoot) {
                delete data[property];
              }
            },
            protect: function(property) {
              if (!req.isRoot) {
                delete req.body[property];
              }
            }
          },
          asyncFunctions: settings.resources
        };
      
      function eval() {
        if(event === 'Get') {
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
        // note that the queue has pending events
        queue.pending = true;
        asyncEval(listener, options, function (err) {
          if(err) return res.error(err);
          queue.emit('completed' + event, options.this);
          var remaining = 0;
          events.forEach(function (event) {
            remaining += queue.listeners('completed' + event).length;
          });
          
          if(remaining === 0) {
            queue.emit('completed');
          }
        });
      }
      
      switch(event) {
        case 'Validate':
          queue.once('completedGet', eval);
        break;
        case 'Put':
        case 'Post':
          queue.once('completedValidate', eval);
        case 'Delete':
          queue.once('completedGet', eval);
        break;
        case 'Get':
          eval();
        break;
      }
    })
  })
  
  return queue;
}

/**
 * Export
 */
 
module.exports = Collection;