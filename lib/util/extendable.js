var util = require('util');

module.exports = function(parent, options) {

  options = options || {};
  var constructorProperties = options.constructorProperties || [];

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
      if (constructorProperties.indexOf(k) === -1) {
        constructor.prototype[k] = child[k];
      } else {
        constructor[k] = child[k];
      }
    });

    module.exports(constructor);
    return constructor;
  };
};