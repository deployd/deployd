var ForeverMonitor = require('forever-monitor').Monitor
  , util = require('util')
  , uuid = require('./util/uuid');

function Monitor(script, options) {
  options = options || {};
  options.fork = true;
  options.max = options.max || 10;
  // options.silent = true;
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