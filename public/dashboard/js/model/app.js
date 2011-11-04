window.App = Backbone.Model.extend({
	
	url: function(id) {
	 return '/config'
	}
	
});

// Example
// var app = new App({
//   name: 'Hello World',
//   _id: 1234,
//   host: 'hello-world.myname.deployd.com',
//   plugins: [{
//     name: 'Users',
//     models: [{
//         name: 'User',
//         attributes: {
//           name: 'String',
//           email: 'String',
//           age: 'Number',
//           password: 'Special'
//         }
//     }]
//   }]
// });