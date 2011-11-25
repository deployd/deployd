window.ItemEditView = Backbone.View.extend({
  template: _.template($('#item-edit-modal-template').html()),
  events: {
    'click .save-item'  : 'save',
    'click .discard-changes'  : 'discard'
  },
  discard : function (e) {
    this._closeModal();
  },
  _closeModal : function () {
    $('.close-reveal-modal').click();
  },
  _createFormObject: function () {
    var _newValues = {};
    $("fieldset", this.el).each(function () {
      //TODO: Account for required as well
      //TODO: Get the names/values of all the fields and return.
    });
    return _newValues;
  },
  save: function (e) {
    console.log('save');
    this.model.save(this._createFormObject())
  },
  render: function () {
    $(this.el).empty().append(this.template(this.model.toJSON())).reveal();
  }
});