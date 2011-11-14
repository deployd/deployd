window.FormView = Backbone.View.extend({
  template: _.template($('#plugin-form-template').html()),
  events: {
    "submit form": "submit"
  },
  submit: function (jQEvent) {
    var arrayVals = $(jQEvent.target).serializeArray(), newValues = {}, _self = this;
    console.log(arrayVals);
    $.each(arrayVals, function (i, val) {
      newValues[arrayVals[i].name] = arrayVals[i].value;
      
    });
    
    
    this.model.set({
      newValues: newValues
    });
    console.log("new model: " + JSON.stringify(this.model.toJSON()));
    this.model.save();
    
    return false;
  },
  render: function () {
    console.log("Form rendered. Model: " + JSON.stringify(this.model.toJSON()));
    
    $(this.el).html(this.template(this.model.toJSON()));
  }
});