var Router = Backbone.Router.extend({
  initialize: function() {
    // prevent caching
    $.ajaxSetup({ cache: false });
    // allows to send restful calls over AJAX
    Backbone.emulateHTTP = true;
    /*dashboard = new Dashboard();
    this.stage = new DashboardView({model: dashboard, el: $('#content')});*/

    var settings = new Settings();
    settings.fetch({
      success: function (model, response) {
        var navTemplate = _.template($("#nav-item-template").html());
        $("#menu > .panel > .links").empty().html(navTemplate(model.toJSON()));
        Backbone.history.start();
      }
    });
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
    '/plugins/:id' : 'plugin',
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
  plugin: function () {
    console.log("Plugin");
  },
  list: function(type) {
    console.log("list");
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
    console.log("Detail()");
    var model = new window[this.models[type]];
    model.set({type: type});
    this.stage.content = new window[this.views[type]]({model: model});
    // model.fetch();
    this.stage.render();
    if (typeof context !== "undefined") this.stage.content.showContext(context);
  },

  // IDEA: be able to paste a deployed route with /debug and see information about it
  // debug: function() {
  //   this.stage.content = new JsonView({model: new RouteModel({url: route})})
  // }

});

// boot the application
new Router();

