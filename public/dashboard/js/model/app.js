window.App = Backbone.Model.extend({
	
	url: function(id) {
	 return '/settings/app';
	}
	
	
});

// Example
// var app = new App({
//   name: 'Hello World',
//   _id: 1234,
//   host: 'hello-world.myname.deployd.com',
// });