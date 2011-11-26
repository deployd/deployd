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
    var values = this.model.getItemById($(e.currentTarget).attr("id").replace('edit-item-',''));
    var description = this.model.get('description');
    _.each(description.toJSON(), function (val, key, obj){
      obj[key] = typeof val === "object" ? val : { type: val};
      console.log(JSON.stringify(obj));
    });
    console.log(values);
    console.log('description');
    console.log(this.model.get('description'));
    var _itemModel = new ItemEditModel({
      description: this.model.get('description'), //schema definition
      name: this.model.get('name'),
      plugin: this.model.get('plugin'),
      values: values
    });
    this._openItemEditModal(_itemModel);
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
    var description = this.model.get('description');
    _.each(description, function (val, key, obj) {
      obj[key] = typeof val === "object" ? val : { type: val};
      
      switch (obj[key].type) {
        case "email":
          type = "email";
          break;
        case "password":
          type = 'password'
          break;
        case "object":
          type = 'textarea';
          break;
        case 'boolean':
          type = 'checkbox';
          break;
        case 'mutli-select':
          type = 'multi-select';
          break;
        default:
          type = "text";
      }
      
      obj[key].formType = type;
      console.log(JSON.stringify(obj));
    });
    var _newItemModel = new ItemEditModel({
      description: description, //schema definition
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