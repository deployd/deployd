window.FormView = Backbone.View.extend({
  template: _.template($('#plugin-form-template').html()),
  events: {
    "submit form": "submit"
  },
  submit: function (jQEvent) {
    var arrayVals = $(jQEvent.target).serializeArray(), newValues = {}, _self = this;

    $.each(arrayVals, function (i, val) {
      newValues[arrayVals[i].name] = arrayVals[i].value;      
    });
    
    this.model.set({
      newValues: newValues
    });

    this.model.save();
    
    return false;
  },
  render: function () {
    $(this.el).html(this.template(this.model.toJSON()));
  }
});