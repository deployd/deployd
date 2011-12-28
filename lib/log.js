var util = require('util')
  , prevLines = 0
  , prevTime = new Date().getTime();


function time() {
  // the time since last log if longer than a while
  var result = ''
    , now = new Date().getTime()
    , diff = (now - prevTime) / 1000;
    
  if(diff > 5) {
    result = '\n...' + "\033[31m" + diff.toFixed(2) + "\033[m" + 's...\n';
  } else if(diff > 1) {
    result = '\n...' + "\033[1;33m" + diff.toFixed(2) + "\033[m" + 's...\n';
  } else if(diff > 0.1) {  
    result = '\n...' + "\033[32m" + diff.toFixed(2) + "\033[m" + 's...\n';
  }
  
  prevTime = new Date().getTime();
  return result;
}

function notice(type) {
  var colors = {
      error: '31', // red
      info: '32', // green
      warn: '1;33', // yellow
      log: ''
  };
  
  var messages = {
    error: 'ERR     ',
    info:  'INFO    ',
    warn:  'WARN    ',
    log:   'LOG     '
  }
  
  return "\033[" + colors[type] + "m" + messages[type] + "\033[m"
}

function format(msg, method) {
  var result = notice(method) + msg.replace(/\n/g, '\n' + notice(method))
    , parts = result.split('\n');

  if(prevLines > 1 || parts.length > 1) {
    result = '\n' + result;
  }
  
  prevLines = parts.length;
  
  return result + '\n';
}

if(util.format) {

  ['log', 'info', 'error', 'warn'].forEach(function(method) {
    var old = console[method];
  
    console[method] = module.exports[method] = function() {
      var msg = util.format.apply(this, arguments);

      if(method === 'error') {
        var err = new Error;
        err.name = 'Error';
        err.message = arguments[0];
        Error.captureStackTrace(err, arguments.callee);
        msg = err.stack;
      }

      // allow for a custom writer
      if(module.exports.writer) exports.writer(msg, method);

      // format for readability
      msg = format(msg, method);

      // output
      process.stdout.write(time() + msg);
    }
  });

}