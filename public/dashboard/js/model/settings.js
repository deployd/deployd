window.Settings = Backbone.Model.extend({
  url: "/settings",
  parse: function (response) {
    var plugins, app = [];
    
    plugins = _.groupBy(response, function(obj) {
      return obj.plugin;
    });
    delete plugins["undefined"];

    return { plugins: plugins, app: app };
  }
});