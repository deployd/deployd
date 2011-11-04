window.Search = List.extend({
	
	url: function() {
	 return '/search?type=' + this.type + '&find=' + JSON.stringify(this.query);
	}
	
});