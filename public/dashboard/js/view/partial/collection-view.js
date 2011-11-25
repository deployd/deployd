window.CollectionView = Backbone.View.extend({
  template: _.template($("#collection-view-template").html()),
  events : {
    "click .create-collection-item" : "createItem",
    "click .edit-item" : "editItem",
    "click .remove-item"  : "deleteItem"
  },
  editItem: function (e) {
    console.log('editItem:'+$(e.currentTarget).attr("id"));
    //TODO: Implement auto-saving model.
    
    var _schemaModel = Backbone.model({
      url: '/'+this.model.get('plugin'),
      values: this.model.get('results')
    })
  },
  deleteItem: function (e) {
    console.log('deleteItem');
  },
  _openItemEditModal: function (model) {
    var _newItemView = new ItemEditView({
      model: model,
      el: '.reveal-modal'
    });
    _newItemView.render();
    
  },
  createItem: function () {
    //TODO: Dynamically create a form.
    console.log(this.model);
    console.log(this.model.get('results'));
    var _newItemModel = new Backbone.Model({
      description: this.model.get('description'), //schema definition
      name: this.model.get('name'),
      plugin: this.model.get('plugin'),
      values: {}
    });
    this._openItemEditModal(_newItemModel);
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