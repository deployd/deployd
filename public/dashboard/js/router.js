var Router = Backbone.Router.extend({
  currentView: '',
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
    '': 'home',
    '/plugins': 'plugin',
    '/plugins/:name': 'plugin',
    '/plugins/:name/:tab': 'plugin'
  },
  
  home: function () {
    $('#content')
      .append('<h2>Your App Dashboard</h2>')
  },
  
  plugin: function(name, tabId) {
    var model = app.get("plugins").getByPluginName(name);
    this.currentView = new PluginView({
      model: model
    });
    var _breadcrumbHTML = '<a href="/dashboard">'+app.get('name')+'</a>';
    if (name) _breadcrumbHTML += ' &raquo; <a href="/dashboard/#/plugins/'+name+'">'+name+'</a>';
    if (tabId) _breadcrumbHTML += ' &raquo; <a href="/dashboard/#/plugins/'+tabId+'">'+model.getObjectById(tabId).get('name')+'</a>';
    $('#bread > h4').empty().append(_breadcrumbHTML);
    
    if (tabId && tabId !== '') this.currentView.tabId = tabId;
    this.currentView.render();
  }
});

// boot the application
new Router();