window.List = Backbone.Collection.extend({
	
	url: function() {
    // TODO: add filter
    return '/' + this.type;
	},
	
	parse: function(json) {
    return json.results;
	}
	
});