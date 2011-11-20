window.Plugin = Backbone.Model.extend({
  
	dashboard_url: function() {
  	 return '/dashboard/#/' + this.get('type') + '/' + this.id;
	},
	url: function () {
	  return '/settings/' + this.get("name");
	},
	initialize: function () {
	  this.set({url: this.url()});
	}
});
/*
_id: 123,
name: "graph",
objects: [...]
//Objects will all be rendered onto the plugin page with different templates
*/

window.PluginObject = Backbone.Model.extend({
  validate: function (attributes) {
    if(typeof attributes._id === "undefined"
      || typeof attributes.name === "undefined") {
      return { error: "error validating object", attributes: attributes };
    }
  }
});
/* 
  // Example
  _id: "123",
  name: "User Roles",
  control: "one-dimensional-list", //Mapped to an HTML template. May require additional properties depending on the control. Could also be schema-definition, 
  ui_body: [
    {
      //...form fields, or whatever the view needs.
    }
  ]
*/