window.Dashboard = Backbone.Model.extend({

  initialize: function() {    
    var app = new App();
    this.set({app: app});
    app.fetch();
  }
  
});