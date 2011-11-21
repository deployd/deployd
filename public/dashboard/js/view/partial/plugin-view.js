window.PluginView = Backbone.View.extend({
	el: '#content',
	item: 'plugin-item-template',
	template: 'plugin-detail-template',
	
	render: function () {
	  var _self = this;
	  this.model.get("objects").each(function(obj){
	    if (obj.get("description")) {
	      //TODO: Plug this in to a view/model/template
	      var _schemaModel = new SchemaModel(obj);
	      var _schemaEl = $("<div />").attr("id", "id-"+obj._id);
	      $(_self.el).append(_schemaEl);
	      var _schemaView = new SchemaView({
	        el: _schemaEl,
	        model: _schemaModel
	      });
	      _schemaView.render();
	      return;
	    }
	  });
	}
});