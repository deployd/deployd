window.View = Backbone.View.extend({
  
  initialize: function(options) {
    var template = options.item ? this.item : this.template;
    // setup template
    this.compiledTemplate = _.template($('#' + template).html());
    // and bind model to render
    this.model.bind('all', this.render, this);
  },
  
  render: function() {
    // generic render    
    // $(this.el).html(this.compiledTemplate(this.model.toJSON()));
    return this;
  }
  
});