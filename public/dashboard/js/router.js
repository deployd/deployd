var loader = {
  modelsToLoad: 2,
  modelsLoaded: 1,
  loaded: function () {
    if (loader.modelsLoaded == loader.modelsToLoad) {
      Backbone.history.start();
    }
    else {
      loader.modelsLoaded++;
    }
  }
};

var Router = Backbone.Router.extend({
  initialize: function() {
    // prevent caching
    $.ajaxSetup({ cache: false });
    // allows to send restful calls over AJAX
    Backbone.emulateHTTP = true;
    dashboard = new Dashboard();
    this.stage = new DashboardView({model: dashboard, el: $('#content')});
    
    window.plugins = new Plugins;
    plugins.fetch({
      success: loader.loaded
    });
    window.models = new Models;
    models.fetch({
      success: loader.loaded
    });
    window.appNav = new Backbone.Model({plugins: plugins, models: models});
    this.appNavView = new AppNavView({model: appNav, el: $('#appNav')});
    this.appNavView.render();
    plugins.bind("all",function () {
      this.appNavView.render();
    }, this);
    models.bind("all",function () {
      this.appNavView.render();
    }, this);

  },

// examples
// /plugins/
// /plugins?installed
// /plugins/1234
// /models/
// /models/users
// /models/users/5
// /users/
// /users/5

  views: {
    'plugins': 'PluginView',
    'models': 'ModelView',
    'users': 'ModelView'
  },
  
  models: {
    'plugins': 'Plugin',
    'models': 'Model',
    'users': 'Model'
  },

  routes: {
    '/:type': 'list',
    '/:type/:id': 'detail',
    '/:type/:id/:context': 'detail',
    '/': 'config'
    // IDEA:
    // '/debug/*route': 'debug'
  },
  
  config: function() {
    console.log('config');
    this.stage.content = new AppView({model: new App()});
    this.stage.content.model.fetch();
    this.stage.render();
  },
  
  list: function(type) {
    if(!type) {
      return this.config();
    }
    var list = new List();
    list.type = type;
    this.stage.content = new ListView({model: list});
    this.stage.content.item = this.views[type];
    list.fetch();
    this.stage.render();
  },
  
  detail: function(type, id, context) {
    //TODO: Handle the context passed in somehow
    var model = window[type].get(id);
    model.set({type: type});
    this.stage.content = new window[this.views[type]]({model: model});
    model.fetch();
    this.stage.render();
  }

  // IDEA: be able to paste a deployed route with /debug and see information about it
  // debug: function() {
  //   this.stage.content = new JsonView({model: new RouteModel({url: route})})
  // }

});

// boot the application
new Router();
