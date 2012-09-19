var Server = require('./server')
  , upgrade = require('doh').upgrade
  , Monitor = require('./monitor')
  , commands = {};
  
/**
 * Commands exposed to parent process.
 */

commands.start = function (config, fn) {
  var server = new Server(config);
  upgrade(server);
  server.on('listening', fn);
  server.on('error', fn);
  server.listen();
};

Monitor.createCommands(commands);