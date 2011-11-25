window.CollectionView = Backbone.View.extend({
  template: _.template($("#collection-view-template").html()),
  events : {
    "click .create-collection-item" : "createItem"
  },
  createItem: function () {
    //TODO: Dynamically create a form.
    console.log(this.model);
    var _newItemModel = new Backbone.Model({
      description: this.model.get('description'),
      name: this.model.get('name'),
      plugin: this.model.get('plugin')
    });
    var _newItemView = new ItemEditView({
      model: _newItemModel,
      el: '.reveal-modal'
    });
    _newItemView.render();
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
    this.model.bind("all", this.render, this);
  },
  render: function () {
    $(this.el).html(this.template(this.model.toJSON()));
  }
});