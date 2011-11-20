window.PluginView = Backbone.View.extend({
	
	item: 'plugin-item-template',
	template: 'plugin-detail-template',
	formTemplate: _.template($("#plugin-form-template").html()),
	schemaTemplate: _.template($("#plugin-model-template").html()),
	
	showContext: function (context) {
	  //Method used to show any configurable object in a plugin, anything other than "overview"
	  this.contextID = context;
	  $(this.el).empty().html(this.model.toJSON());
    // var contexts = this.model.get("configurable_objects"), modelContext, output;

	  /*$.each(contexts, function (i, val) {
	    if (contexts[i].id == context) {
	      modelContext = contexts[i];
	      return false; //equivalent to break;
	    }
	  });*/

	  if (typeof modelContext !== "undefined") {
	    output =  modelContext.helper_text || "<em>No overview text</em>";
	    
	    //If there's a form, then implement the form view/template
	    if (typeof modelContext["form"] !== "undefined") {
	      $("<div />").addClass("plugin-form").appendTo($(this.el).find(".substance"));
	      var pluginFormModel = new FormModel(modelContext["form"]);
	      var pluginFormView = new FormView({
	        el: $(this.el).find(".substance > .plugin-form"),
	        model: pluginFormModel
	      });
	      pluginFormView.render();
  	  }
  	  
  	  //If there's a list, implement the list view/template
  	  if (typeof modelContext["list"] !== "undefined") {
  	    var _self = this, detailListTemplate;
  	    $("<div />").addClass("plugin-list").appendTo($(this.el).find(".substance"));
  	    var dataListCollection = new DataListCollection();
  	    detailListTemplate = _.template($("#plugin-datalist-template").html());
  	    
        dataListCollection.url = modelContext.source;
  	    dataListCollection.fetch({
  	      success: function (collection, response) {
            // $(".plugin-list").append(JSON.stringify(collection.models));
  	        $(".plugin-list").append(detailListTemplate({dataItems: dataListCollection.models}));
  	      }
  	    });  	    
  	  }
  	  
      if (typeof modelContext["model_description"] !== "undefined") {
        //TODO: Create a view and model for this.
  	    $(".substance").append(this.schemaTemplate({
  	      groupPermissions: [
    	      {
  	          groupID: "0",
  	          groupName: "Public",
  	          create: false,
  	          read: true,
  	          update: false,
              del: false
  	        },
  	        {
  	          groupID: "1",
  	          groupName: "Jeffs",
  	          create: true,
  	          read: true,
  	          update: true,
              del: false
  	        },
  	        {
  	          groupID: "2",
  	          groupName: "Object Owner",
  	          create: true,
  	          read: true,
  	          update: true,
              del: true
  	        }
  	      ]
  	    }));
      }
	  }
	  
	  var className = "context" + this.contextID;
	  
	  $(this.el).find("ul.plugin-nav > li.active").removeClass("active");
	  $(this.el).find("ul.plugin-nav > li." + className).addClass("active");
	}
});