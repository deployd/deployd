window.ItemEditView = Backbone.View.extend({
  template: _.template($('#item-edit-modal-template').html()),
  events: {
    'click .save-item'  : 'save',
    'click .discard-changes'  : 'discard'
  },
  discard : function (e) {
    console.log('discard');
    this._closeModal();
  },
  _closeModal : function () {
    
  },
  save: function (e) {
    console.log('save');
  },
  render: function () {
    $(this.el).empty().append(this.template(this.model.toJSON())).reveal();
  }
});