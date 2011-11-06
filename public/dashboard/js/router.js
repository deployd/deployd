var Router = Backbone.Router.extend({

  initialize: function() {
    // prevent caching
    $.ajaxSetup({ cache: false });
    // allows to send restful calls over AJAX
    Backbone.emulateHTTP = true;
    dashboard = new Dashboard();
    this.stage = new DashboardView({model: dashboard, el: $('#content')});
    
    window.plugins = new Plugins;
    plugins.fetch();
    window.models = new Models;
    models.fetch();
    window.appNav = new Backbone.Model({plugins: plugins, models: models});
    this.appNavView = new AppNavView({model: appNav, el: $('#appNav')});
    this.appNavView.render();
    plugins.bind("all",function () {
      this.appNavView.render();
      console.log("appNav changed");
    }, this);
    models.bind("all",function () {
      this.appNavView.render();
      console.log("appNav changed");
      console.log(appNav.toJSON());
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
    '/:type/:id/:context': 'detail_context',
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
  
  detail: function(type, id) {
    var model = new window[this.models[type]]({type: type, id: id});
    model.set({type: type});
    this.stage.content = new window[this.views[type]]({model: model});
    model.fetch();
    this.stage.render();
  },
  detail_context: function (type, id, context) {
    //TODO: Make this different from detail
    var model = new window[this.models[type]]({type: type, id: id});
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
Backbone.history.start();