var states = {
    ready: 0,
    read: 1,
    write: 2,
    remove: 3
  }
  , inherits = require('util').inherits
  , EventEmitter = require('events').EventEmitter
  , db = require('./db')
  , Model = function(initial) {
    this.attributes = this.defaults || {};
    initial && this.set(initial);
  }
;

Model.extend = function(constructor) {
  inherits(constructor, Model);
  return constructor;
}

inherits(Model, EventEmitter);

Model.prototype = {

  sync: function(state) {
    this.state = state;
    
    switch(state) {
      case states.read:
        db.find(this);
      break;
      case states.write:
        db.upsert(this);
      break;
      case states.destroy:
        db.remove(this);
      break;
    }
  },

  state: states.ready,
  
  status: function() {
    return {
      state: status[this.state]
    }
  },
  
  isNew: function() {
    return !!this.id;
  },
  
  isReady: function() {
    return this.state === state.ready;
  },
  
  save: function() {
    this.sync(states.write);
  },
  
  fetch: function() {
    this.sync(states.read);
  },
  
  remove: function() {
    this.sync(states.remove)
  },
  
  refresh: function(changes) {
    this.set(changes);
    this.state = states.ready;
    this.emit('state:change');
  },
  
  set: function(changes) {
    var _self = this;
    
    Object.getOwnPropertyNames(changes).forEach(function(p) {
      if(_self.attributes[p] != changes[p]) {
        _self.attributes[p] = changes[p];
        _self.emit(p + ':change');
      }
    });
  },
  
  get: function(key) {
    if(!this.attributes) return undefined;
    return this.attributes[key];
  },
  
  notify: function(sender, action) {
    var _self = this
      , ev = 'state:change';
    
    function listener() {
      if(_self.isReady()) {
        sender.send(_self.toJSON());
        _self.removeListener(ev, listener);
      }
    }
    
    this.on(ev, listener);
    
    // shorthand to call an action and notify
    action && this[action]();
  },
  
  toJSON: function() {
    return Object.create(this.attributes);
  },
  
  toQuery: function() {
    if(this.isNew()) throw new Error('Tried to query a single model without an id');
    else return {_id: this.id};
  }
  
}

module.exports = Model;