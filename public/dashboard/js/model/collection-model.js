window.CollectionModel = Backbone.Model.extend({
  url: function () {
    return '/' + this.get("name");
  },
  getItemById: function (id) {
    _items = this.model.get('results');
    _item;
    _.each(this.model.get('results'), function (item, index, list){
      if (item._id === id) {
        _item = item;
        return;
      }
    });
    return _item || false;
  },
  parse: function (response) {
    return {results: response};
  }
});