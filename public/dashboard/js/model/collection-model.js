window.CollectionModel = Backbone.Model.extend({
  url: function () {
    return '/' + this.get("name");
  },
  parse: function (response) {
    return {results: response};
  }
});