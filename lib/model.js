var Model
  , states = {
      ready: 'ready',
      read: 'read',
      write: 'write',
      remove: 'remove'
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
    var model = this;
    model.state = state;
    
    // prevent a bad state, errors and read/write/remove states
    // do not mix - when a model has errors its state is ready
    if(this.hasErrors()) {
      this.state = states.ready;
    }
    
    this.emit('change:state');
    
    // nothing else needs to happen if the model is ready
    if(model.state === states.ready) return;
    
    switch(state) {
      case states.read:
        db.find(model);
      break;
      case states.write:
        db.upsert(model);
      break;
      case states.remove:
        db.remove(model);
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
    this.sync(states.write);
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
    var model = this;
    
    if(Array.isArray(changes)) {
      changes = changes[0];
    }
    
    if(!changes && !model.hasErrors()) {
      model.error('Does not exist', 'Not Found');
    }

    // reset attributes
    model.attributes = {};
    model.set(changes || model.attributes);
    
    model.isAllowed(model.state, function() {    
      model.sync(states.ready);
    });
    
    return model;
  },
  
  strict: true,

  allowed: {
    read: 'super-user',
    write: 'super-user',
    remove: 'super-user',
    special: {
      _id: 'super-user'
    }
  },
  
  isAllowed: function(action, fn) {
    var permissions = this.allowed
      , rights = permissions[action]
      , actor = this.actor()
      , allowed = true
      , model = this
    ;
    
    if(permissions && rights && rights !== 'public') {
      
      if(rights === 'creator') {
        if(actor !== this.get('creator') && actor === this.get('_id')) {
          model.error('The current user must be the creator to ' + action, 'Not Allowed');
        }
      } else {
        // check permission against actor
        Model
          .spawn({collection: 'users', allowed: false})
          .set({_id: actor})
          .notify(function(json) {
            allowed = !!(json.groups && json.groups[rights]);
            if(!allowed)
              model.error('The current user does not have permissions to ' + action, 'Not Allowed');
            fn();
          })
          .fetch()
        ;
        
        return;
      }
    }
    
    // default to responding
    fn();
  },
  
  for: function(req) {
    if(req.session && req.session.user) {
      this.actor(req.session.user._id);
    }
    
    return this;
  },
  
  actor: function(id) {
    if(id) {
      this._actor = id;
      return this;
    } else {
      return this._actor;
    }
  },
  
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
    
    if(!isValid) this.error('Wrong type for "' + key + '". Expected: "' + type + '"', 'Validation');
    
    return isValid;
  },
  
  set: function(changes) {
    var _self = this;
    
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
  
  hasErrors: function() {
    return (this.errors && this.errors.length > 0);
  },
  
  toJSON: function() {
    if(this.hasErrors()) return _.clone({errors: this.errors});
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
  
  unlock: function() {
    // allow anyone to edit this specific model
    // this might be removed from the final API
    this.allowed = false;
    return this;
  },
  
  plugin: 'graph',
  
  updateSettings: function() {
    var settings = Model.spawn()
      , _self = this
    ;
    
    settings.unlock();
    settings.collection = 'settings';
    
    if(this.description) {
      settings
        .find({name: this.name || this.collection})
        .set({name: this.name || this.collection, description: this.description, plugin: this.plugin})
        .notify(function(json) {
          if(json && json._id) {
            delete json._id;
            _self.description = _self.description || {};
            _self.description.extend(json.description);

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