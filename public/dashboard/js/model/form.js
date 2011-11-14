window.FormModel = Backbone.Model.extend({
  save: function () {
    var _self = this;
    console.log("Save! action: " + this.get('action'));
    console.log("values: "  + _self.get('newValues'));
    $.ajax(this.get('action'), {
      complete: function (jqXHR, status) {
        _self.trigger("save:complete");
        console.log(_self.get('method') + "ed " + _self.get('action'));
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