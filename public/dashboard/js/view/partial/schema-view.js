window.SchemaView = Backbone.View.extend({
  template: _.template($("#schema-view-template").html()),
  events: {
    "click .save-changes" : "save",
    "click fieldset > .delete-property" : "deleteProperty"
  },
  initialize: function () {
    this.model.bind("save", function (msg) {
      console.log("SchemaModel saved");
    });
  },
  save: function (e) {
    console.log("Submit");
    console.log(this.model);
    var _newDesc = {};
    $("fieldset", this.el).each(function () {
      var type = $(this).find("select").val();
      _newDesc[$(this).find("input[type=text]").val()] = $(this).find("span.checkbox").hasClass("checked") ? { type: type, unique: true} : type;
    });
    this.model.set({description: _newDesc});
    this.model.save();
  },
  deleteProperty: function (e) {
    console.log("Delete");
    console.log(this);
  },
  addProperty: function (e) {
    $(this.el).stylizeForms();
  },
  render: function () {
    console.log("render() in SchemaView");
    $(this.el).html(this.template(this.model.toJSON()));
    $(this.el).stylizeForms();
  }
});