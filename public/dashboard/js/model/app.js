window.App = Backbone.Model.extend({
	url: "/settings",
  parse: function (response) {
    var plugins, _pluginsFromResponse, app = [];

    plugins = new Plugins();
    
    //Group the plugins into an object like {plugin: [{config: object}}
    _pluginsFromResponse = _.groupBy(response, function(obj) {
      return obj.plugin;
    });
    
    //Iterate through each plugin
    _.each(_pluginsFromResponse, function (objectsArray, pluginName, list) {

      if (pluginName !== "undefined") {
        var _pluginObjects = new Backbone.Collection(objectsArray, {
          model: PluginObject
        });
        
        plugins.add({
          name: pluginName,
          plugin: pluginName,
          objects: _pluginObjects
        });
      }
    });

    //TODO: Make this return dynamic data.
    return { 
      plugins: plugins,
      name: "app",
      _id: 0,
      host: "hello-world.myname.deployd.com"
    };
  }
});

// Example
// var app = new App({
//   name: 'Hello World',
//   _id: 1234,
//   host: 'hello-world.myname.deployd.com',
// });