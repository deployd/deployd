var Server = require('./lib/server')
  , upgrade = require('doh').upgrade;

/**
 * export a simple function that constructs a dpd server based on a config
 */

module.exports = function (config) {
  return new Server(config);
};