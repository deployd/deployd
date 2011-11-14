var Model
  , states = {
      ready: 0,
      read: 1,
      write: 2,
      remove: 3
    }
  , EventEmitter = require('events').EventEmitter
  , db = require('./db')
  , compile = require('./types').compile
  , _ = require('underscore')
;

var emitter = new EventEmitter();

Model = module.exports = emitter.spawn({

  _states: states,

  initialize: function(initial) {
    this.attributes = this.defaults || {};
    initial && this.set(initial);
  },

  sync: function(state) {
    this.state = state;
    
    switch(state) {
      case states.read:
        db.find(this);
      break;
      case states.write:
        db.upsert(this);
      break;
      case states.remove:
        db.remove(this);
      break;
    }
  },

  state: states.ready,
  
  status: function() {
    var _self = this
      , result
    ;
    
    Object.keys(states).forEach(function(key) {
      if(_self.state == states[key]) {
        result = key;
      }
    });
    
    return result;
  },
  
  isNew: function() {
    return !this._id;
  },
  
  isReady: function() {
    return this.state === states.ready;
  },
  
  save: function() {
    if(this.isValid()) {
      this.sync(states.write);
    } else {
      // manually continue the sync
      this.emit('change:state');
    }
    return this;
  },
  
  fetch: function() {
    this.sync(states.read);
    return this;
  },
  
  remove: function() {
    this.sync(states.remove);
    return this;
  },
  
  refresh: function(changes) {
    if(Array.isArray(changes)) {
      changes = changes[0];
    }
    
    if(!changes) {
      this.error('Does not exist', 'Not Found');
      changes = {};
    }
    
    this.set(changes, true);
    this.state = states.ready;
    this.emit('change:state');
    return this;
  },
  
  strict: true,
  
  isValid: function(key, value) {
    var _self = this
      , isValid = false
      , type = this.description && this.description[key]
      , validator
    ;
    
    if(!this.strict) return true;
    
    if(!key) return !(this.errors && this.errors.length);
    
    // if a description doesnt exist
    // allow everything
    if(!this.description || Object.keys(this.description).length === 0) return true;
    if(!this.description[key]) {
      this.error('The property "' + key + '" does not exist in this models description', 'Validation');
      return false;
    }
    
    function error() {
      _self.error.apply(_self, arguments);
    }

    validator = compile(type);
    
    isValid = validator(value, error);
    
    if(!isValid) this.error('Wrong type for ' + key + '. Expected: "' + type + '"', 'Validation');
    
    return isValid;
  },
  
  set: function(changes, reset) {
    var _self = this;
    reset && (_self.attributes = {});
    Object.getOwnPropertyNames(changes).forEach(function(p) {
      if(_self.attributes[p] != changes[p]) {
        _self.attributes[p] = changes[p];
        
        if(p !== '_id') {
          _self.isValid(p, changes[p]);  
        }
        
        _self.emit(p + ':change');
      }
    });
    return this;
  },
  
  get: function(key) {
    if(!this.attributes) return undefined;
    return this.attributes[key];
  },
  
  notify: function(sender, action) {
    var _self = this
      , ev = 'change:state';
    
    function listener() {
      if(_self.isReady()) {
        _self.removeListener(ev, listener);
        _self.beforeNotify && _self.beforeNotify();
        if('function' === typeof sender) {
          sender.apply(_self, [_self.toJSON()]);
        } else {
          sender.send(_self.toJSON());
        }
      }
    }
    
    this.on(ev, listener);
    
    // shorthand to call an action and notify
    action && this[action]();
    
    return this;
  },
  
  toJSON: function() {
    if(this.errors && this.errors.length > 0) return _.clone({errors: this.errors});
    return _.clone(this.attributes);
  },
  
  find: function(query) {
    this.query = query;
    return this;
  },
  
  toQuery: function() {
    return this.query || {_id: this.get('_id')};
  },
  
  error: function(err, type) {
    (this.errors || (this.errors = []))
      .push({
        message: err,
        type: type || 'General'
      })
    ;
    
    return this;
  },
  
  updateSettings: function() {
    var settings = Model.spawn()
      , _self = this
    ;
    
    settings.collection = 'settings';
    
    if(this.description) {
      settings
        .find({type: this.collection})
        .set({type: this.collection, description: this.description})
        .notify(function(json) {
          if(json && json._id) {
            delete json._id;
            _self.description = _self.description || {};
            _self.description.extend(json);

            // update any special properties
            _self.configure(_self.description, function(err) {
              if(err) console.error(err);
            });

          }
        })
        .save()
      ;
    }

  },
  
  configure: function(description, fn) {
    for(var property in description) {
      var pObj = description[property];
      if(description.hasOwnProperty(property) && typeof pObj === 'object') {
        if(pObj.unique) {
          db.index(this, property, {unique: true}, fn);
        }
      }
    }
  }
  
});

var spawn = module.exports.spawn;

module.exports.spawn = function(model) {
  var instance = spawn.apply(this, arguments);
  if(model && model.collection) {
    instance.updateSettings();
  }
  return instance;
};