window.CollectionUtil = (function() {

  var exports = {};

  exports.propsToArray = function(propertiesJson) {
    var propertiesArray = Object.keys(propertiesJson || {}).reduce(function(prev, cur) {
      prev.push(propertiesJson[cur]);
      return prev;
    }, []).sort(function(a, b) {
      return a.order - b.order;
    });

    return propertiesArray;
  };

  return exports;

})();