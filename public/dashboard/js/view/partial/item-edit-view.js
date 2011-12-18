window.ItemEditView = Backbone.View.extend({
  
  template: _.template($('#item-edit-modal-template').html()),
  
  events: {
    'click .save-item'  : 'save',
    'click .discard-changes'  : 'discard'
  },
  
  initialize: function () {
    var _self = this;
    this.model.bind('sync-success', function (e) {
      _self._onSync(e);
    });
    this.model.bind('sync-error', function (e) {
      _self._onSyncError(e);
    });
  },
  
  discard : function (e) {
    this._closeModal();
  },
  
  _closeModal : function () {
    $('.close-reveal-modal').click();
  },
  
  _onSync: function (e) {
    $('.alert-box', this.el).empty().attr('class','alert-box').addClass('success').html('Object saved successfully').show();
    setTimeout(function() {
      window.location.reload();
    }, 1500);
  },
  
  _onSyncError: function (e) {
    $('.alert-box', this.el).empty().attr('class','alert-box').addClass('error').html('Error saving object:'+JSON.stringify(e.errors)).show();
  },
  
  _formObjectFromArray: function (formArray) {
    var _formObject = {};
    _.each(formArray, function (item, index, list) {
      _formObject[item.name] = item.value;
    });
    return _formObject;
  },
  
  save: function (e) {
    var _self = this;
    $.each($('form', this.el).find('textarea'), function (index, object) {
      $(object).val($(object).val().replace(/\n/g,'').replace(/\r/g,''));
    });

    var _values = this._formObjectFromArray($('form', this.el).serializeArray());
    $.each(_values, function(i, field){
      //Convert values to null if they are empty
      if (_values[i].replace(/ /g,'') === '') {
        _values[i] = null;
        return;
      }
      //Convert strings to objects, if they should be objects
      if (_self.model.get('description')[i].type === 'object') {
        try {
          _values[i] = JSON.parse(field);
        }
        catch (e) {
          if (console) console.log('Couldn\'t parse object');
        }
      }
    });
    this.model.save({values: _values});
  },
  
  render: function () {
    $(this.el).empty().append(this.template(this.model.toJSON())).reveal();
  }
});