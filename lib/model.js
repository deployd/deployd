var states = {
    ready: 0,
    read: 1,
    write: 2,
    remove: 3
  }
  , EventEmitter = require('events').EventEmitter
  , _ = require('underscore')
  , db = require('./db')
;

var emitter = new EventEmitter();

module.exports = emitter.spawn({

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
    if(this.errors) {
      // manually continue the sync
      this.emit('change:state');
    } else {
      this.sync(states.write);
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
  
  set: function(changes, reset) {
    var _self = this;
    reset && (_self.attributes = {});
    Object.getOwnPropertyNames(changes).forEach(function(p) {
      if(_self.attributes[p] != changes[p]) {
        _self.attributes[p] = changes[p];
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
          sender(_self.toJSON());
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
    if(this.errors && this.errors.length > 0) return _.clone(this.errors);
    return _.clone(this.attributes);
  },
  
  toQuery: function() {
    //if(this.isNew()) throw new Error('Tried to query a single model without an id');
    return this.query || {_id: this.get('_id')};
  },
  
  error: function(err, type) {
    (this.errors || (this.errors = []))
      .push({
        message: err,
        type: type || 'General Error'
      })
    ;
  }
  
});