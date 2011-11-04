window.Model = Backbone.Model.extend({
	
	url: function() {
	 return '/' + this.type + '/' + id;
	}
	
});