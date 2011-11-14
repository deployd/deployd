var Model = require('./model')
  , _ = require('underscore')
;

module.exports = Model.spawn({
  
  initialize: function() {
    this.models = [];
  },
  
  isValid: function() {
    // TODO: implement a more correct
    // isValid for collections
    return true;
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
  
    if(this.wrap) {
      var wrappedResults = {};
      wrappedResults[this.wrap] = result;
      return wrappedResults;
    }
    
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
