var fs = require('fs')
  , spawn = require('child_process').spawn
  , debug = require('debug')('mongod');

/*!
 * Utility for restarting the current apps mongod instance.
 */

exports.restart = function (mongod, env, port, fn) {
  var pid;

  debug('starting %s', mongod);

  try {
    fs.unlinkSync('./data/mongod.lock');
    pid = JSON.parse(fs.readFileSync('./.dpd/pids/mongod'));

    if(pid) {
      debug('pid %s', pid);
      process.kill(pid);
    } else {
      debug('no pid found');
    }
  } catch(e) {}

  var options =  ['--dbpath', './data', '--pidfilepath', './.dpd/pids/mongod', '--port', port];
  if(env === 'development') {
    options.push('--nojournal');
    options.push('--smallfiles');
    options.push('--nssize');
    options.push('4');
  } 
  
  var proc = spawn(mongod, options, {title: 'FOOBAR'})
    , buf = '';
  proc.stdout.on('data', function(data) {
    buf += data;
    if(~buf.indexOf('waiting for connections on port')) {
      proc.emit('listening');
    }
    debug(data);
  });

  function kill(e) {
    if(e) debug('error: %s', e);
    debug('killing mongod');
    fs.writeFileSync('./.dpd/pids/mongod', '');
    proc.kill();
    process.exit(0);
  }

  // callback
  proc.once('listening', fn);
  proc.on('exit', function(code) {
    debug('exit code %s', code);
    if (code) fn(code);
  });

  process.on('exit', kill);
};