var Server = require('./lib/server')
  , upgrade = require('doh').upgrade
  , Monitor = require('./lib/monitor');

/**
 * export a simple function that constructs a dpd server based on a config
 */

module.exports = function (config) {
  var server = new Server(config);
  upgrade(server);
  return server;
};

/**
 * opt-in process monitoring support
 */

module.exports.createMonitor = Monitor.createMonitor;