window.Dashboard = Backbone.Model.extend({

  initialize: function() {    
    var app = new App(), _self = this;
    
    app.fetch({
      success: function (model, response) {
        _self.set({app: app});
        Backbone.history.start();
      }
    });
  }
  
});

/*
//Dashboard Model
Dashboard: {
  app: {
    plugins: [
      {
        ...
      }
    ]
  }
}
*/