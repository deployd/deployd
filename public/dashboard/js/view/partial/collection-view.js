window.CollectionView = Backbone.View.extend({
  template: _.template($("#collection-view-template").html()),
  events: {},
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
    // this.model.bind("change", this.schemaChange, this);
    console.log("Initialize CollectionView");
  },
  save: function (e) {
    /*$(".alert-box", this.el).attr("class", "alert-box").css("display", "none");
    $(".save-changes", this.el).html("Saving...").removeClass("blue").addClass("white");
    
    this.model.save({description: this.createFormObject()});*/
  },
  render: function () {
    // $(this.el).html(this.template(this.model.toJSON()));
    $(this.el).html(this.template(this.model));
  }
});