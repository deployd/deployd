var Module = require('../module')
  , path = require('path')
  , Script = require('../script');

module.exports = Module.extend({

  load: function(fn) {
    var events = this.server.events = this.events = {};
    
    Script.loaddir(path.join(this.server.options.dir, 'events'), events, fn);
  }
  
});