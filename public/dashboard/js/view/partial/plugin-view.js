window.PluginView = View.extend({
	
	item: 'plugin-item-template',
	template: 'plugin-detail-template',
	formTemplate: _.template($("#plugin-form-template").html()),
	
	showContext: function (context) {
	  //Method used to show any configurable object in a plugin, anything other than "overview"
	  this.contextID = context;
	  $(this.el).find(".substance").empty();
	  var contexts = this.model.get("configurable_objects"), modelContext, output;

	  $.each(contexts, function (i, val) {
	    if (contexts[i].id == context) {
	      modelContext = contexts[i];
	      return false; //equivalent to break;
	    }
	  });

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
  	    var _self = this;
  	    $("<div />").addClass("plugin-list").appendTo($(this.el).find(".substance"));
  	    var dataListCollection = new DataListCollection();
  	    dataListCollection.fetch({
  	      success: function (collection, response) {
  	        console.log("Successful response of collection: " + JSON.stringify(response));
  	        $(".plugin-list").append(JSON.stringify(response));
  	      }
  	    });
  	    //TODO: Create DataListView
  	    /*var pluginListView = new DataListView({
  	      el: $(this.el).find(".substance > .plugin-list"),
  	      model: pluginListModel
  	    });
  	    pluginListView.render();
  	    pluginListModel.bind("all", pluginListView.render);
  	    pluginListModel.fetch();*/
  	  }
	  }
	  
	  var className = "context" + this.contextID;
	  
	  $(this.el).find("ul.plugin-nav > li.active").removeClass("active");
	  $(this.el).find("ul.plugin-nav > li." + className).addClass("active");
	}
});