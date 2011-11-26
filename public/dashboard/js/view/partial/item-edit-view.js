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
  _formObjectFromArray: function (formArray) {
    var _formObject = {};
    _.each(formArray, function (item, index, list) {
      _formObject[item.name] = item.value;
    });
    return _formObject;
  },
  save: function (e) {
    var _values = this._formObjectFromArray($('form', this.el).serializeArray());
    this.model.save({values: _values});
  },
  render: function () {
    $(this.el).empty().append(this.template(this.model.toJSON())).reveal();
  }
});