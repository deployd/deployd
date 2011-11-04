var MultiPageView = Backbone.View.extend({
	
	// ##Examples
	// instances of a MultiPageView should include
	// a model with a *page* property
	//	e.g. new MultiPageView({new Backbone.Model({page: 'home'})})
	// the name of this property can be overidden by setting *watch*
	//	e.g. var v = new MultiPageView({model: m}); v.watch = 'section';
	
	// ###Layouts
	// the different pages must be described in a layouts object
	// where *view* corresponds to the Backbone.View
	//     v.layouts = {
	//      'dressing-room': {view: 'DressingRoomView'},
	//      'boutique': {view: 'BoutiqueView'},
	//      'style-match': {view: 'StyleMatchView'}
	//     }
	
	// ###Navigate       
	// to change the current page you set a different value for page or
	// the property that is being watched
	// myModel.set({page: 'about'})
	
	initialize: function(options) {
		options && typeof options.watch === 'string' && (this.watch = options.watch);
		// when the watched property is changed, re-render the MultiPageView
		this.model.bind('change:' + this.watch, this.render, this);
	},
	
	watch: 'page',
	
	render: function() {
		// watch a property of the model for changes such as
		// 'section' or 'page' and render the correct section or page
		var watch = this.watch,
			layout = this.model.get(watch) || this.defaultLayout;
			
		if(this.model.hasChanged(watch) || (!this.previous && this.defaultLayout)) {
			this.select(layout);
			this.layout.render();
		}
		
		return this;
	},
	
	select: function(id) {
		var info = this.layouts[id],
			previous = this.previous,
			sel = 'selected',
			btn = 'Btn',
			layout = this.layout
		;
		
		if(layout) {
			// if it exists, hide previous layout 
			layout.el.hide();

			// if defined, call a method to remove elements from the dom
			layout.dematerialize && layout.dematerialize();

			// if defined, call a method to do additional hide logic
			layout.hide && layout.hide();
		}
		
		// deselect the previous btn
		if(previous) {
			$('#' + previous + btn).removeClass(sel);
		}
		
		this.previous = id;
		
		// without an id we can't continue
		if(!id) return;
		
		try {
			// set the layout as the cached section view or create it based on
			// the name of the view that corresponds to the section
			layout = this.layout = info.instance || (info.instance = new (window[info.view] || Backbone.View)({
				el: $('#' + id),
				model: info.model,
				parentView: this
			}));
		} catch(e) {
			// debug only
			// console.log('Failed to build view with data provided.', 'Error Object:', {
			// 	id: id || 'A view id was not provided.',
			// 	view: (info && info.view) || 'A view class was not provided as a string.',
			// 	info: info || 'Info was not found.',
			// 	el: document.getElementById(id) || "Element was not found using " + id,
			// 	error: e,
			// 	layouts: this.layouts || 'No layouts were defined.'
			// });
		}
		
		// if defined, call a method to add elements to the dom
		layout.materialize && layout.materialize();
		
		// if defined, call a method to do additional show logic
		layout.show && layout.show();
		this.show && this.show(id, this.layout.model);
		
		// show current layout
		layout.el.show();

		// select the current btn
		$('#' + id + btn).addClass(sel);
		
		if (this.afterRender) {
			this.afterRender();
		}
	}
	
});