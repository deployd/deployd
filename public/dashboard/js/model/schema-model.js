window.SchemaModel = Backbone.Model.extend({
  url: function() {
    return "/settings/"+this.get("_id")+'?method=put';
  },
  sync: function (method, model) {
    console.log("About to sync in SchemaModel");
    console.log(model);
    if (model.get('groups')) model.unset('groups', {silent: true});
    d(this.url(), model, function onSync(response){
      console.log('onSync in SchemaModel');
    });
  },
  idAttribute: '_id'
  
});