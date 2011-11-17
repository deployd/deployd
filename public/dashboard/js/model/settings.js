window.Settings = Backbone.Model.extend({
  url: "/settings",
  parse: function (response) {
    var plugins = {}, app = [];
    
    //First generate the plugins hash
    _.each(response, function (item) {
      if (typeof item !== "undefined" 
        && typeof item.plugin !== "undefined" 
        && typeof item.name !== "undefined") {
          if (typeof plugins[item.plugin] === "undefined") {
            plugins[item.plugin] = [];
          }
          plugins[item.plugin].push(item);
      }
      else if (item.app) {
        //TODO: parse app settings as well
      }
    });
        
    return { plugins: plugins, app: app };
  }
});