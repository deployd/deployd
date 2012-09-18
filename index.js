var Server = require('./lib/server')
  , upgrade = require('doh').upgrade
  , Monitor = require('./lib/monitor')
  , EventEmitter = require('events').EventEmitter;

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

module.exports.createMonitor = function (config) {
  var keypress = require('keypress');
  var monitor = new Monitor(__dirname + '/lib/start.js')
    , server = new EventEmitter();
    
  keypress(process.stdin);
    
  server.listen = function () {
    monitor.start(function (err, commands, restarting) {
      commands.start(config, function (err) {
        if(err) {
          server.emit('error', err);
        } else if(!restarting) {
          server.emit('listening');
        }
      });
      
      monitor.child.on('message', function (data) {
        if(data.moduleError) {
          monitor.stop();
        }
      });
    });
    
    return server;
  };
  
  monitor.on('exit', function () {
    console.log();
    process.stdout.write('Press any key to restart... or q to quit: ');
    
    function keypress(key, e) {
      if(e.ctrl) {
        // allow ctr+c, z, etc
        console.log();
      } else if(key == 'q') {  
        console.log();
        process.exit();
      } else {
        monitor.start(true);
      }
      process.stdin.pause();
      process.stdin.setRawMode(false);
    }
    
    process.stdin.once('keypress', keypress);
    process.stdin.setRawMode(true);
    process.stdin.resume();
  });

  return server;
};