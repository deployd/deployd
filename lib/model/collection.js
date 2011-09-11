var Model = require('./model')
  , inherits = require('util').inherits
  , Collection = function() {
    this.models = [];
  }
;

inherits(Collection, Model);

Collection.prototype = {
  
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
    this.state = states.ready;
    this.emit('state:change');
  }
  
}

module.exports = Collection;