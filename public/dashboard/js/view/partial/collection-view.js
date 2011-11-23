window.CollectionView = Backbone.View.extend({
  template: _.template($("#collection-view-template").html()),
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
    console.log('initialize() in CollectionView');
    console.log(this.model);
    this.model.bind("all", this.render, this);
  },
  render: function () {
    console.log('render() in CollectionView');
    $(this.el).html(this.template(this.model.toJSON()));
  }
});