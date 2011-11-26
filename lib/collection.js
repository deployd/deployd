var Model = require('./model')
  , _ = require('underscore')
;

module.exports = Model.spawn({
  
  isCollection: true,
  
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

    for (var i=0, iLength = this.models.length; i<iLength; i++) {
      result.push(
        this.models[i].toJSON
          ? this.models[i].toJSON()
          : _.clone(this.models[i])
      );
    }
  
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
  },
  
  updateSettings: function() {
    // TODO, implement basic settings
  },
  
  defineRoutes: function(app) {
    var collection = this.collection
      , model = this
      , plugin = this.plugin
      , base = (plugin === collection) ? '' : ('/' + plugin)
      , route = [base, collection].join('/')
    ;
    
    // one model
    app.get(route, function(req, res) {
      var query = req.query;
      
      model
        .spawn()
        .for(req)
        .find(query)
        .set(req.body)
        .notify(res)
        .fetch()
      ;
    });    
  }
  
});
