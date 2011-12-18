window.CollectionView = Backbone.View.extend({
  template: _.template($("#collection-view-template").html()),
  events : {
    "click .create-collection-item" : "createItem",
    "click .edit-item" : "editItem",
    "click .remove-item"  : "deleteItem"
  },
  editItem: function (e) {
    var values = this.model.getItemById($(e.currentTarget).attr("id").replace('edit-item-',''));
    var description = _.clone(this.model.get('description'));
    if ('_id' in description === false) description._id = {type: 'string'};
    _.each(description, function (val, key, obj) {
      obj[key] = typeof val === "object" ? val : { type: val};
      
      switch (obj[key].type) {
        case "email":
          type = "email";
          break;
        case "password":
          type = 'password';
          break;
        case "object":
          type = 'textarea';
          if (typeof values[key] === 'object') {
            values[key] = JSON.stringify(values[key]);
          }
          else if (typeof values[key] === 'string') {
            values[key].replace(/ /g,'');
          }
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
    });
    
    var _itemModel = new ItemEditModel({
      description: description, //schema definition
      name: this.model.get('name'),
      plugin: this.model.get('plugin'),
      values: values
    });
    this._openItemEditModal(_itemModel);
  },
  deleteItem: function (e) {
    var _self = this;
    var _id = $(e.currentTarget).attr("id").replace('remove-item-','');
    var _item = this.model.getItemById(_id);
    var _plugin = this.model.get('plugin');
    var _name = this.model.get('name');
    var _route = (_plugin === _name) ? _plugin : (_plugin + '/' + _name);
    var _confirm = confirm("Are you sure you want to delete this object?:\n"+JSON.stringify(_item));
    
    if (_confirm === true) {
      dpd('/' + _route + '/'+_id+'?method=delete', function onDelete(e) {
        if (e.errors) {
          $('.alert-box', _self.el).empty().attr('class','alert-box').addClass('error').html('Error deleting object: '+JSON.stringify(e)).show();
        }
        else {
          $('.alert-box', _self.el).empty().attr('class','alert-box').addClass('success').html('Object deleted successfully.').show();
          $('#remove-item-'+_id).parent().parent().slideUp();
        }
      });
    }
    
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
    var description = _.clone(this.model.get('description'));
    _.each(description, function (val, key, obj) {
      obj[key] = typeof val === "object" ? val : { type: val};
      
      switch (obj[key].type) {
        case "email":
          type = "email";
          break;
        case "password":
          type = 'password';
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