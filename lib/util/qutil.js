var q = require('q');

exports.cinvoke = function(obj, func) {
  var args = Array.prototype.slice.call(arguments, 2);

  var d = q.defer();

  if (typeof func !== 'function') {
    func = obj[func];
  }

  var callback = function(result) {
    d.resolve(result);
  };

  args.push(callback);

  func.apply(obj, args);

  return d.promise;

};