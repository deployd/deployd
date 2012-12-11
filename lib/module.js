var makeExtendable = require('./util/extendable');

var Module = function Module(options) {
  options = options || {};
  this.config = options.config || {};
  this.server = options.server;
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

Module.prototype.addResource = function(resource) {
  this.resources = this.resources || [];
  resource.__hide = true;
  this.resources.push(resource);
}

makeExtendable(Module);

module.exports = Module;