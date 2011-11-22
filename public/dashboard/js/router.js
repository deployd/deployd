var Router = Backbone.Router.extend({
  initialize: function() {
    // prevent caching
    $.ajaxSetup({ cache: false });
    // allows to send restful calls over AJAX
    Backbone.emulateHTTP = true;
    window.app = new App();
    window.appNavView = new AppNavView({
        model: app,
        el: $("#menu .links")
    });
    
    app.fetch({
      success: function (model, response) {
        Backbone.history.start();
      }
    });
  },

  routes: {
    '/plugins': 'plugin',
    '/plugins/:name': 'plugin'
  },
  
  plugin: function(name) {
    var model = app.get("plugins").getByPluginName(name);
    var view = new PluginView({
      model: model
    });
    view.render();
  }
});

// boot the application
new Router();