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
  , app = require('./app')
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
    return !this.get('_id');
  },
  
  isReady: function() {
    return this.state === states.ready;
  },

  fetch: function() {
    this.sync(states.read);
    return this;
  },
  
  save: function() {
    var model = this
      , state = states.write
    ;
    
    model.isAllowed(state, function() {
      model.sync(state);
    });
    return this;
  },
  
  remove: function() {
    var model = this
      , state = states.remove
    ;
      
    model.isAllowed(state, function() {
      model.sync(state);
    });
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
    
    if(model.state === states.read) {
      model.isAllowed(model.state, function() {    
        model.sync(states.ready);
      });
    } else {   
      model.sync(states.ready);
    }

    return model;
  },
  
  strict: true,

  allowed: {
    read: 'root',
    write: 'root',
    remove: 'root',
    create: 'root',
    special: {
      _id: {read: 'root', write: 'root'}
    }
  },
  
  isAllowed: function(action, fn) {
    if(action === 'write' && this.isNew()) action = 'create';
    
    var permissions = this.allowed
      , special = permissions.special
      , rights = permissions[action]
      , requiresUser = rights === 'user'
      , actor = this.actor()
      , allowed = true
      , model = this
      , User = require('./plugins/users/user')
    ;
    
    if(requiresUser && !actor) {
      model.error('Only logged in users can ' + action);
      fn();
      return;
    }
    
    if(permissions && rights && rights !== 'public') {
      // check permission against actor
      User
        .spawn()
        .find({_id: actor})
        .notify(function(json) {
          // TODO cache groups on the req
          var groups = json.groups
            , root = groups && groups.root
            , isCreator = actor === this.get('creator') || this.get('_id')
            , requiresCreator = rights === 'creator' && !model.isNew() && rights === 'creator'
            , allowed = root || (groups && groups[rights]) || (requiresCreator && isCreator)
          ;
          
          if(special) {
            Object.getOwnPropertyNames(special).forEach(function(key) {
              var perms = special[key]
                , right = perms[action]
                , allowed = right === 'public' || (groups && groups[right]) || root
              ;

              if(!allowed) {
                if(action === 'read') {
                  // TODO build select object where {key: 0}
                  delete model.attributes[key];
                } else {
                  model.error('The current user cannot ' + action + ' the key: ', key, 'Not Allowed');
                }
              }
            })
          }
          
          if(requiresCreator && !isCreator) {
            model.error('The current user must be the creator to ' + action, 'Not Allowed');
          }
          
          if(!allowed)
            model.error('The current user does not have permissions to ' + action, 'Not Allowed');
          fn();
        })
        .fetch()
      ;
    
      return;
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
    if(!changes) return this;
    Object.getOwnPropertyNames(changes).forEach(function(p) {
      if(_self.attributes[p] != changes[p]) {
        _self.attributes[p] = changes[p];
        
        // TODO make '$' inspection less coupled and more secure
        if(p !== '_id' && p.substr(0,1) != '$') {
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
    // returns a query that will find the current model
    // if not enough info is provided it will return false
    var query = this.query
      , id = this.get('_id')
    ;
    
    id && query && (query._id = id);
    
    if(query || id) return query;
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
  
  plugin: 'models',
  
  updateSettings: function() {
    var settings = Model.spawn()
      , _self = this
    ;
    
    settings.unlock();
    settings.collection = 'settings';
    
    if(this.description) {
      settings
        .find({collection: this.collection, plugin: this.plugin})
        .set({
          description: this.description,
          plugin: this.plugin,
          collection: this.collection,
          name: this.name || this.collection,
          allowed: this.allowed
        })
        .notify(function(json) {
          if(json) {
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
  },
  
  defineRoutes: function(app) {
    var collection = this.collection
      , model = this
      , plugin = this.plugin
      , base = (plugin === collection) ? '' : ('/' + plugin)
      , route = [base, collection].join('/')
      , idRoute = [route, ':id'].join('/')
      , methodMap = {
          GET: 'fetch',
          POST: 'save',
          PUT: 'save',
          DELETE: 'remove'
        }
    ;
    
    function handler(req, res) {
      var query = req.params
        , action = methodMap[req.method] || 'fetch'
      ;
      
      model
        .spawn()
        .for(req)
        .find(query)
        .set(req.body)
        .notify(res)
        [action]()
      ;
    }
    
    // create
    app.post(route, handler);
    // read
    app.get(idRoute, handler);
    // update
    app.put(idRoute, handler);
    // delete
    app.del(idRoute, handler);
  }
  
});

var spawn = module.exports.spawn
  , _models = {}
  , _collections = {}
;

module.exports.refreshSettings = function(collection) {
  _models[collection].updateSettings();
}

module.exports.spawn = function(model) {
  var instance = spawn.apply(this, arguments)
    , cache = instance.isCollection ? _collections : _models;
    
  if(model && model.collection && !cache[instance.collection]) {
    cache[instance.collection] = instance;
    instance.updateSettings();
    instance.defineRoutes(app);
  }
  
  return instance;
};