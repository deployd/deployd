window.Model = Backbone.Model.extend({
	
	url: function() {
	 return '/' + this.type + '/' + id;
	}
	
});

window.Models = Backbone.Collection.extend({
  url: '/models',
  model: Model,
  parse: function (response) {
    return response['results'];
  }
});