var Router = Backbone.Router.extend({
  initialize: function() {
    // prevent caching
    $.ajaxSetup({ cache: false });
    // allows to send restful calls over AJAX
    Backbone.emulateHTTP = true;
    window.app = new App();
    
    app.fetch({
      success: function (model, response) {
        Backbone.history.start();
      }
    });
  },

  routes: {
    '/:type': 'plugin',
    '/plugins/:name': 'plugin'
  },
  
  plugin: function(name) {
    var model = app.get("plugins").getByPluginName(name);
    console.log(JSON.stringify(model));
    $("#content").html(JSON.stringify(model.toJSON()));
  }
});

// boot the application
new Router();