var dns = require('dns')
  , os = require('os');

module.exports = function (fn) {
  dns.lookup(os.hostname(), fn);
}