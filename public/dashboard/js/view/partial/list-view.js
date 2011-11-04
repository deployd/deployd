window.ListView = Backbone.View.extend({

  initialize: function() {
    this.model.bind('all', this.render, this);
  },

  tagName: 'ul',
  id: 'list',

  render: function() {
    var self = this
      , el = $(this.el).empty()
      , child
    ;
    
    // render items
    this.model.each(function(item) {
      console.log(item);
      child = new window[self.item]({model: item, item: true});
      child.el = $('<li />');
      el.append(child.render().el)
    });
    
    return this;
  },

  select: function(e) {
    
  },

  next: function() {
    this.model.next();
  },

  previous: function() {
    this.model.previous();
  }

})