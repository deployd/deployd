var Model = require('./model');

module.exports = Model.spawn({
  
  initialize: function() {
    console.log('initialized collection');
    this.models = [];
  },
  
  toJSON: function() {
    var result = [];
  
    this.models.forEach(function(model) {
      result.push(model.toJSON());
    });
  
    return result;
  },

  toQuery: function() {
    return this.query;
  },

  refresh: function(changes) {
    this.models = changes;
    this.state = this._states.ready;
    this.emit('state:change');
  }
  
});
