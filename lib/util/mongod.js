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

  /*! 
  * The mongodb config file is set to the platform-specific null device in order to override the default options of mongodb in 
  * Homebrew and similar distributions.
  */
  var options =  ['--dbpath', './data', '--pidfilepath', './.dpd/pids/mongod', '--port', port, '-f', fs.existsSync('/dev/null') ? '/dev/null' : 'NUL' ];
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
  proc.on('error', function(err) {
    debug('proc error %s %s', mongod, err);
    // report error to startup function in bin/dpd
    fn(err);
  });
  proc.on('exit', function(code) {
    debug('exit code %s', code);
    if (code) fn(code);
  });

  process.on('exit', kill);
  // on non win32 platforms SIGTERM is emitted instead of exit when
  // a process is killed by another process, so use it to end our mongo
  // process
  process.on('SIGTERM', kill);
};
