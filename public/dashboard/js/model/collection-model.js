window.CollectionModel = Backbone.Model.extend({
  url: function () {
    console.log('/search/'+this.get('name')+'?find={}');
    return '/search/' + this.get("name") + '?find={}';
  },
  getItemById: function (id) {
    var _items = this.get('results');
    console.log('_items');
    console.log(_items);
    var _item;
    _.each(this.get('results'), function (item, index, list){
      if (item._id === id) {
        _item = item;
        return;
      }
    });
    return _item || false;
  },
  parse: function (response) {
    return {results: response.results};
  }
});