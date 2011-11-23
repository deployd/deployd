window.CollectionModel = Backbone.Model.extend({
  url: function () {
    return '/' + this.get("name");
  },
  validate: function (response) {
    console.log(response);
  }
});