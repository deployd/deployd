window.SchemaView = Backbone.View.extend({
  template: _.template($("#schema-view-template").html()),
  events: {
    "click .save-changes" : "save",
    "click fieldset > .delete-property" : "deleteProperty",
    "click .add-new-property" : "addNewProperty"
  },
  schemaChange: function (msg) {

    // $(".save-changes", this.el).html("Save Changes").removeClass("white").addClass("blue");
    if (msg.get("errors")) {
      $(".alert-box", this.el).addClass("error").css("display", "block").html(msg.get("errors")[0].message);
    }
    else if (msg.get("description")) {
      $(".alert-box", this.el).addClass("success").css("display", "block").html("Schema saved successfully.");
    }
    else {
      $(".alert-box", this.el).addClass("warning").css("display", "block").html("Couldn't determine if schema was saved.");
    }
  },
  initialize: function () {
    this.model.bind("change", this.schemaChange, this);
  },
  createFormObject: function () {
    var _newDesc = {};
    $("fieldset", this.el).each(function () {
      var type = $(this).find("select").val();
      _newDesc[$(this).find("input[type=text]").val()] = $(this).find("span.checkbox").hasClass("checked") ? { type: type, unique: true} : type;
    });
    return _newDesc;
  },
  save: function (e) {
    $(".alert-box", this.el).attr("class", "alert-box").css("display", "none");
    $(".save-changes", this.el).html("Saving...").removeClass("blue").addClass("white");
    
    this.model.save({description: this.createFormObject()});
  },
  deleteProperty: function (e, jq) {
    var _newDesc = this.createFormObject();
    delete _newDesc[$(e.currentTarget).parent().find("input[type=text]").val()];
    this.model.save({description: _newDesc});

    this.render();
  },
  addNewProperty: function (e) {
    console.log("addNewProperty()");
    $("form", this.el).append(_.template($("#new-schema-property-template").html(),{key: '', type: ''}));
  },
  render: function () {
    $(this.el).html(this.template(this.model.toJSON()));
    $(this.el).stylizeForms();
  }
});