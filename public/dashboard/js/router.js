var Router = Backbone.Router.extend({
  initialize: function() {
    // prevent caching
    $.ajaxSetup({ cache: false });
    // allows to send restful calls over AJAX
    Backbone.emulateHTTP = true;
    dashboard = new Dashboard();
    this.stage = new DashboardView({model: dashboard, el: $('#content')});
  },

  routes: {
    '/:type': 'plugin',
    '/plugins/:id': 'plugin'
  },
  
  plugin: function(id) {
    var model = new Plugin;
    this.stage.content = new PluginView({model: model});
    this.stage.render();
  },


});

// boot the application
new Router();

