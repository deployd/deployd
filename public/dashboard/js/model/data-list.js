window.DataListModel = Backbone.Model.extend();

window.DataListCollection = Backbone.Collection.extend({
  model: DataListModel,
  parse: function (response) {
    //Filter out the objects with an error message.
    var _parsedModels = [];
    for (var i=0, iLength = response.length; i<iLength; i++) {
      if (typeof response[i].errors === "undefined") {
        _parsedModels.push(response[i]);
      }
    }
    return _parsedModels;
  }
});