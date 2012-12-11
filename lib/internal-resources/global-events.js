var Module = require('../module');

module.exports = Module.extend({

  init: function() {
    console.log('foo');
    
    this.server.globalEvents = {foo: 'bar'};
  }
  
});