var fs = require('fs')
  , spawn = require('child_process').spawn
  , debug = require('debug')('mongod');

/**
 * Utility for restarting the current apps mongod instance.
 */

exports.restart = function (mongod, fn) {
  var pid;

  debug('starting %s', mongod);

  try {
    pid = JSON.parse(fs.readFileSync('./.dpd/pids/mongod'));

    if(pid) {
      debug('pid %s', pid);
      process.kill(pid);
    } else {
      debug('no pid found');
    }
  } catch(e) {}
  
  var proc = spawn(mongod, ['--dbpath', './data', '--pidfilepath', './.dpd/pids/mongod'], {title: 'FOOBAR'})
    , buf = '';
  proc.stdout.on('data', function(data) {
    buf += data;
    if(~buf.indexOf('waiting for connections on port')) {
      proc.emit('listening');
    }
    debug(data);
  });

  function kill(e) {
    if(e) console.error(e);
    debug('killing mongod');
    fs.writeFileSync('./.dpd/pids/mongod', '');
    proc.kill();
    process.exit(0);
  }

  // callback
  proc.once('listening', fn);

  process.on('exit', kill);
  process.on('uncaughtException', kill);
}