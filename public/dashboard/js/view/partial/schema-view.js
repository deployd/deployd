window.SchemaView = Backbone.View.extend({
  template: _.template($("#schema-view-template").html()),
  events: {
    "click .save-changes" : "save",
    "click fieldset > .delete-property" : "deleteProperty",
    "click .add-new-property" : "addNewProperty",
    "click .edit-permissions" : "editPermissions",
    "click .hide-edit-permissions" : "hideEditPermissions"
  },
  editPermissions: function (e) {
    console.log('show edit permissions');
    $('.edit-permissions', this.el).hide();
    $('.hide-edit-permissions', this.el).show();
    $('.permissions-summary', this.el).hide();
    $('form.allowed', this.el).show();
  },
  hideEditPermissions: function (e) {
    $('.hide-edit-permissions', this.el).hide();
    $('.edit-permissions', this.el).show();
    $('.permissions-summary', this.el).show();
    $('form.allowed', this.el).hide();
    console.log('hide edit permissions');
  },
  showAlert: function (status, message) {
    $(".sync-status", this.el).addClass(status).css("display", "block").html(message);
    $(".save-changes", this.el).html("Save All Schema Changes").removeClass("white").addClass("blue");
  },
  schemaChange: function (msg) {
    if (msg.get("errors")) {
      this.showAlert('error', JSON.stringify(msg.get('errors')));
    }
    else if (msg.get("description")) {
      this.showAlert('success', "Schema saved successfully.");
    }
    else {
      this.showAlert('warning', "Couldn't determine if schema was saved.");
    }
  },
  initialize: function () {
    this.model.bind("change", this.schemaChange, this);
  },
  createFormObject: function () {
    var _newDesc = {};
    $("form.description fieldset", this.el).each(function () {
      var type = $(this).find("select").val();
      var key = $(this).find("input[type=text]").val();
      //TODO: Account for required as well
      if ($('input[type=checkbox]',this).is(':checked')) {
        _newDesc[key] = { type: type};
        if ($('.unique-checkbox', this).is(':checked')) _newDesc[key].unique = true;
        if ($('.required-checkbox', this).is(':checked')) _newDesc[key].required = true;
      }
      else {
        _newDesc[key] = type;
      }
    });
    return _newDesc;
  },
  createAllowedObject: function () {
    var allowed = {}, _allowedFormValues = $("form.allowed", this.el).serializeArray();
    _.each(_allowedFormValues, function (val, key, obj) {
      allowed[val.name] = val.value;
    });
    console.log(allowed);
    return allowed;
  },
  save: function (e) {
    $(".sync-status", this.el).attr("class", "alert-box sync-status").css("display", "none");
    $(".save-changes", this.el).html("Saving...").removeClass("blue").addClass("white");
    
    this.model.save({description: this.createFormObject(), allowed: this.createAllowedObject()});
  },
  deleteProperty: function (e, jq) {
    var _newDesc = this.createFormObject();
    delete _newDesc[$(e.currentTarget).parent().find("input[type=text]").val()];
    this.model.save({description: _newDesc});

    this.render();
  },
  addNewProperty: function (e) {
    $('.empty-result', this.el).hide();
    $("form.description", this.el).append(_.template($("#new-schema-property-template").html(),{key: Math.round(Math.random() * 1000000000000).toString(), type: 'string'}));
  },
  render: function () {
    var _viewModel = this.model.toJSON();    
    _viewModel.groups = typeof _viewModel.groups !== 'undefined' ? _viewModel.groups.toJSON() : {};
    
    $(this.el).html(this.template(_viewModel));
    // $('form.description', this.el).stylizeForms();
  }
});