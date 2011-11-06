window.AppNavView = Backbone.View.extend({
  
  template: _.template($("#app-nav-template").html()),
  
  render: function(type, model) {
    $(this.el).html(this.template(this.model.toJSON()));
    
    
    return this;
  }
  
});