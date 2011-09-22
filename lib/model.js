var states = {
    ready: 0,
    read: 1,
    write: 2,
    remove: 3
  }
  , EventEmitter = require('events').EventEmitter
  , db = require('./db')
;

// use spawn inheritance
require('./spawn');

module.exports = {

  _states: states,

  initialize: function(initial) {
    this.attributes = this.defaults || {};
    initial && this.set(initial);
  },

  on: function() {
    // delegate the instatiation and ref of EventEmitter
    // until someone needs it
    this._ee = this._ee || new EventEmitter();
    
    this._ee.on.apply(this, arguments);
  },
  
  emit: function() {
    this._ee && this._ee.emit.apply(this, arguments);
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
    this.set(changes);
    this.state = states.ready;
    this.emit('state:change');
    return this;
  },
  
  set: function(changes) {
    var _self = this;
    
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
    
    return this;
  },
  
  toJSON: function() {
    return Object.create(this.attributes);
  },
  
  toQuery: function() {
    if(this.isNew()) throw new Error('Tried to query a single model without an id');
    else return {_id: this.id};
  }
  
};