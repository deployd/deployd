window.DashboardView = Backbone.View.extend({

  render: function(type, model) {
    $(this.el)
      .empty()
      .append(this.content.render().el)
    ;
    
    return this;
  }
  
});