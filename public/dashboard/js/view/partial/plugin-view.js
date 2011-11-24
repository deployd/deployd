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
	      var _schemaEl = $("<div />").attr("id", "id-"+obj.get('_id'));
	      $(_self.el).append(_schemaEl);
	      var _schemaView = new SchemaView({
	        el: _schemaEl,
	        model: _schemaModel
	      });
	      _schemaView.render();
	    }
	    if (obj.get("collection")) {
	      console.log(obj.toJSON());
	      var _collectionModel = new CollectionModel({
	        name: obj.get('collection'),
	        numFields: _.size(obj.get('decsription')),
	        description: obj.get('decsription'),
	        results: []
	      });
	      console.log(obj.get('collection'));
	      console.log(_collectionModel.url());
        var _collectionEl = $("<div />").attr("id", "id-PLACEHOLDER");
        $(_self.el).append(_collectionEl);
        var _collectionView = new CollectionView({
          el: _collectionEl,
          model: _collectionModel
        });
        _collectionModel.fetch();
        // _collectionView.render();
	    }        
	  });
	}
});