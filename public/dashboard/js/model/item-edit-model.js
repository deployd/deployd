window.ItemEditModel = Backbone.Model.extend({
  url: function () {
    return '/' + this.get('plugin');
  },
  onSync: function (response) {
    console.log('onSync() in ItemEditModel');
    console.log(response);
  },
  sync: function (method, model, options) {
    d(this.url(), this.get('values'), this.onSync);
  }
});