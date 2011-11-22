window.AppNavView = Backbone.View.extend({
  
  template: _.template($("#app-nav-template").html()),
  initialize: function () {
    this.model.bind("change", this.render, this);
  },
  render: function(type, model) {
    $(this.el).html(this.template(this.model.toJSON()));
    // $(this.el).html(JSON.stringify(this.model.get("plugins").toJSON()));
    
    return this;
  }
  
});