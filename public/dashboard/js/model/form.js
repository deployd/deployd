window.FormModel = Backbone.Model.extend({
  save: function () {
    var _self = this;
    $.ajax(this.get('action'), {
      complete: function (jqXHR, status) {
        _self.trigger("save:complete");
      },
      success: function (data, jqXHR, status) {
        console.log("Success.");
      },
      error: function (jqXHR, status, error) {
        console.log("Error");
      },
      data: _self.get('newValues'),
      type: _self.get('method')
    });
  }
});