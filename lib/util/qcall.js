var q = require('q');

module.exports = function(promise, fn) {
  if (typeof promise === 'function') {
    promise = q.fcall(promise);
  }

  promise.then(function(val) {
    fn(null, val);
  }, function(err) {
    fn(err);
  });
};