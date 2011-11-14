window.DataListView = Backbone.View.extend({
  template: _.template($("#plugin-datalist-template").html()),
  render: function () {
    $(this.el).html(this.template(this.model.toJSON()));
  }
});