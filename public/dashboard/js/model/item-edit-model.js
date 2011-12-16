window.ItemEditModel = Backbone.Model.extend({
  url: function () {
    return this.get('plugin') === this.get('name') ? '/'+this.get('plugin') : '/'+this.get('plugin') + '/' + this.get('name');
  },
  sync: function (method, model, options) {
    var _self = this;
    dpd(this.url(), this.get('values'), function onSync (response) {
      if (response.errors) {
        _self.trigger('sync-error', { errors: response.errors});
      }
      else {
        _self.trigger('sync-success');
      }
      
    });
  }
});