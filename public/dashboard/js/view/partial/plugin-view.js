window.PluginView = Backbone.View.extend({
	el: '#content',
	tabsEl: '#plugin-tabs-nav',
	item: 'plugin-item-template',
	template: 'plugin-detail-template',
	
	render: function () {
	  var _self = this;
    $(this.el).empty();
    $(this.tabsEl).empty();

    // if its the models plugin
    if(this.model.get('plugin') === 'models') {
  	    var tabContent = _self.addTab('overview', '');
  	    tabContent
  	      .append('<input id="model-name" type="text"" placeholder="Model Name" />')
  	      .append(
  	        $('<button>Create</button>')
    	      .click(function() {
    	        var name = $('#model-name').val();
    	        if(!name) return;
              d('/settings', {plugin: 'models', name: name, collection: name, description: {}, allowed: {}}, function(res) {
                window.location.hash = '/plugins/models/' + res._id;
                window.location.reload();
              });
    	      })
	        );
    }

	  this.model.get("objects").each(function(obj){
	    var tabContent = _self.addTab(obj.get("name"), obj.get("_id"));
	    if (obj.get("collection")) {
	      var _collectionModel = new CollectionModel({
	        name: obj.get('collection'),
	        plugin: obj.get('plugin'),
	        numFields: _.size(obj.get('description')),
	        description: obj.get('description'),
	        results: []
	      });

        var _collectionEl = $("<div />").attr("id", "collection-"+obj.get('collection'));
        $(tabContent).append(_collectionEl);
        var _collectionView = new CollectionView({
          el: _collectionEl,
          model: _collectionModel
        });
        _collectionModel.fetch();
        _collectionView.render();
	    }
	    if (obj.get("description")) {
	      var _schemaModel = new SchemaModel(obj);
        var _groupCollection = new CollectionModel({name: 'groups'});
        _schemaModel.set({groups: _groupCollection});
	      
	      var _schemaEl = $("<div />").attr("id", "id-"+obj.get('_id'));
        $(tabContent).append(_schemaEl);
	      var _schemaView = new SchemaView({
	        el: _schemaEl,
	        model: _schemaModel
	      });
	      _schemaView.render();
        _groupCollection.bind('change', function onGroupUpdate(e){ 
          _schemaModel.get('groups').get('results').push({name:'creator',creator:'root'});
          _schemaView.render(); 
        });
        _groupCollection.fetch();
	    }    
	  });
	  
	  if (typeof this.tabId !== "undefined") {
	    $('#tab-content-'+this.tabId).addClass('active').show();
	    $('#tab-link-'+this.tabId+' > a').addClass('active');
	  }
	  else {
	    $('#plugin-tabs-nav > dd > a:first').addClass('active');
	    $('.tabs-content > li:first').show();
	    $('#bread > h4').append(' &raquo; <a href="/dashboard/#/plugins/'+this.model.get('plugin')+'/'+$('#plugin-tabs-nav > dd:first').attr('id').replace('tab-link-','')+'">'+$('#plugin-tabs-nav > dd > a:first').html()+'</a>');
	  }
	},
	
	addTab: function (tabName, id) {
	  //Create a new li to add to the tabs nav
	  var _navItem = $("<dd />").attr('id','tab-link-'+id);
	  $(_navItem).append($('<a />').attr('href','/dashboard/#/plugins/'+this.model.get('plugin')+'/'+id).html(tabName));
	  $(this.tabsEl).append(_navItem);
	  
    //Create a new container to add to the content area
    var _contentArea = $("<li />").attr('id', 'tab-content-'+id).css('display','none');
    $(this.el).append(_contentArea);
  
    return _contentArea;
	}
});