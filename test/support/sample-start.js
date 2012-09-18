var Monitor = require('../../lib/monitor');
var commands = {};

commands.test = function (msg, fn) {
  fn(null, msg);
}

commands.crash = function () {
  throw 'crash!';
}

Monitor.createCommands(commands);


