window.DataListModel = Backbone.Model.extend();

window.DataListCollection = Backbone.Collection.extend({
  sourceUrl: "/users",
  model: DataListModel,
  setUrl: function (url) {
    this.url = url;
  },
  url: function () {
    return this.sourceUrl;
  }
});