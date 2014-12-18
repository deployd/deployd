var Server = require('./lib/server')
  , upgrade = require('doh').upgrade;

/**
 * export a simple function that constructs a dpd server based on a config
 */

module.exports = function (config) {
  var server = new Server(config);
  upgrade(server);
  return server;
};



module.exports.attach = require('./lib/attach');
