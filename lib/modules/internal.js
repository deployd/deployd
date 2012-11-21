var Module = require('../module');

module.exports = Module.extend({

  init: function() {
    this.addResourceType(require('../internal-resources/client-lib'));
    this.addResourceType(require('../internal-resources/dashboard'));
    this.addResourceType(require('../internal-resources/files'));
    this.addResourceType(require('../internal-resources/internal-modules'));
    this.addResourceType(require('../internal-resources/internal-resources'));
  }

});
