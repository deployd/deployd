window.PluginView = Backbone.View.extend({
	el: '#content',
	item: 'plugin-item-template',
	template: 'plugin-detail-template',
	
	render: function () {
	  var _self = this;
	  $(this.el).empty();
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
          // return;
	    }
	    var _collectionModel = {
	      name: "user",
        results: [
          {
            password: "1234hash!",
            name: "Joe",
            email: "j@joes.com",
            _id: "4ecbc17230a01d2465000001"
          },
          {
            password: "1234hash!",
            name: "Ritchie",
            email: "j@joes.com",
            _id: "1"
          }
        ]
      };
      var _collectionEl = $("<div />").attr("id", "id-PLACEHOLDER");
      $(_self.el).append(_collectionEl);
      var _collectionView = new CollectionView({
        el: _collectionEl,
        model: _collectionModel
      });
      _collectionView.render();
        
	  });
	}
});