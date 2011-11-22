window.SchemaModel = Backbone.Model.extend({
  validate: function (attributes) {
    console.log("No validation happening in SchemaModel");
  },
  url: "/settings"
});