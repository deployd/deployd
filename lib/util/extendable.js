var util = require('util');

module.exports = function(parent) {
  parent.extend = function(name, child) { 
    if (typeof name === 'object') {
      child = arguments[0];
      name = undefined;
    }

    var constructor = function() {
      parent.apply(this, arguments);
    };
    constructor.id = name;

    util.inherits(constructor, parent);

    Object.keys(child).forEach(function(k) {
      constructor.prototype[k] = child[k];
    });

    module.exports(constructor);
    return constructor;
  };
};