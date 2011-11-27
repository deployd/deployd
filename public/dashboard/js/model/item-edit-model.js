window.ItemEditModel = Backbone.Model.extend({
  url: function () {
    return '/' + this.get('plugin');
  },
  sync: function (method, model, options) {
    var _self = this;
    d(this.url(), this.get('values'), function onSync (response) {
      if (response.errors) {
        _self.trigger('sync-error', { errors: response.errors});
      }
      else {
        _self.trigger('sync-success');
      }
      
    });
  }
});