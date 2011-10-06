var Model = require('./model')
  , _ = require('underscore')
;

module.exports = Model.spawn({
  
  initialize: function() {
    console.log('initialized collection');
    this.models = [];
  },
  
  toJSON: function() {
    var result = [];
  
    this.models.forEach(function(model) {
      result.push(
        model.toJSON
          ? model.toJSON()
          : _.clone(model)
      );
    });
  
    return result;
  },

  toQuery: function() {
    return this.query || {};
  },

  refresh: function(changes) {
    var Model = this.model;
    this.model && changes.forEach(function(m, i) {
      changes[i] = Model.spawn();
      changes[i].refresh(m);
    });
    this.models = changes;
    this.state = this._states.ready;
    this.emit('change:state');
  }
  
});
