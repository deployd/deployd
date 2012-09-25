var ForeverMonitor = require('forever-monitor').Monitor
  , util = require('util')
  , uuid = require('./util/uuid')
  , keypress = require('keypress')
  , EventEmitter = require('events').EventEmitter;

function Monitor(script, options) {
  options = options || {};
  options.fork = true;
  ForeverMonitor.call(this, script, options);
}
util.inherits(Monitor, ForeverMonitor);
module.exports = Monitor;

function createCommands(monitor, data, restarting, fn) {
  var commands = {};
  
  if(data.createCommands) {
    Object.keys(data.createCommands).forEach(function (cmd) {
      commands[cmd] = function () {
        var fn
          , fnIndex
          , args = Array.prototype.slice.call(arguments)
          , finalArgs = [];
        
        args.forEach(function (val) {
          if(typeof val == 'function') {
            fn = val;
          } else {
            finalArgs.push(val);
          }
        });

        monitor.exec(cmd, finalArgs, fn);
      };
    });
    
    fn.call(monitor, null, commands, restarting);
  }
}

Monitor.prototype.start = function (fn) {
  var start = ForeverMonitor.prototype.start  
    , monitor = this
    , restarting = arguments[0] === true
    , startCallback = this.startCallback;

  if(typeof fn === 'function') {
    startCallback = this.startCallback = fn;
    start.call(this);
  } else {
    start.apply(this, arguments);
  }
  
  if(!(this.child.stdout && this.child.stderr)) {
    this.child.stdout = process.stdout;
    this.child.stderr = process.stderr;
  }
  
  if(this.startCallback) {
    this.child.once('message', function (data) {
      createCommands(monitor, data, restarting, startCallback);
    });
  }
}

Monitor.prototype.exec = function (cmd, args, fn) {
  var ticket = uuid.create()
    , monitor = this;
  
  this.child.send({command: cmd, args: args, ticket: ticket});
  this.once(ticket, function (data) {
    if(data.command === cmd) {
      fn && fn.apply(monitor, data.args);
    }
  });
  
  this.child.on('message', function (data) {
    if(data.command && data.ticket) {
      monitor.emit(data.ticket, data);
    }
  });
}

Monitor.createCommands = function (commands) {
  var funcs = {}
    , ctx = this;
  
  process.on('message', function (data) {
    var cmd = data.command
      , fn = funcs[cmd];
      
    if(typeof fn === 'function') {
      var args = data.args;
      args.push(function () {
        process.send({command: cmd, args: Array.prototype.slice.call(arguments), ticket: data.ticket});
      });
      
      fn.apply(ctx, args);
    }
  });
  
  Object.keys(commands).forEach(function (cmd) {
    funcs[cmd] = commands[cmd];
    commands[cmd] = true;
  });
  
  process.send({createCommands: commands});
}

Monitor.createMonitor = function (config) {
  var opts = {stdio: ['pipe', process.stdout, process.stderr, 'ipc']}
    , monitor = new Monitor(__dirname + '/start.js', opts)
    , server = new EventEmitter();
    
  server.options = config;
    
  server.listen = function () {
    monitor.start(function (err, commands, restarting) {
      keypress(process.stdin);
      commands.start(config, function (err) {
        if(err) {
          server.emit('error', err);
        } else if(!restarting) {
          server.emit('listening');
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
        process.exit(1);
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
}