var makeExtendable = require('./util/extendable');

var Module = function Module(options) {
  options = options || {};
  this.config = options.config || {};
  if (typeof this.init === 'function') this.init();
};

Module.prototype.load = function(fn) {
  fn();
};

Module.prototype.addResourceType = function(resourceType) {
  this.resourceTypes = this.resourceTypes || [];
  if (!resourceType.id) {
    // Fall back on constructor name
    resourceType.id = resourceType.name;
  }
  this.resourceTypes.push(resourceType);
}

makeExtendable(Module);

module.exports = Module;