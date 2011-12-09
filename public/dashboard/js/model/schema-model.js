window.SchemaModel = Backbone.Model.extend({
  url: function() {
    return "/settings/"+this.get("_id")+'?method=put';
  },
  sync: function (method, model) {
    var _self = this;
    if (model.get('groups')) model.unset('groups', {silent: true});
    d(this.url(), model, function onSync(response) {
      console.log('onSync in SchemaModel');
      _self.trigger('change', response);
    });
  },
  idAttribute: '_id'
});