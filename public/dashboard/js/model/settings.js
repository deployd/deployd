window.Settings = Backbone.Model.extend({
  url: "/settings",
  parse: function (response) {
    var plugins, app = [];
    
    plugins = _.groupBy(response, function(obj) {
      return obj.plugin;
    });
    delete plugins["undefined"];

    
    /*
      Model should look like...
      {
        plugins: [
          {
            name: "graph",
            _id: 123,
            settings: [
              {
                name: "whatever",
                _id: 234,
                ...
              }
            ]
          }
        ]
      }
    */
    
    return { plugins: plugins, app: app };
  }
});