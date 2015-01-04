var fork = require('child_process').fork
  , spawn = require('child_process').spawn
  , shelljs = require('shelljs')
  , fs = require('fs');


if (!fs.existsSync('app.dpd')) {
  console.log('Not a deployd app directory, please run this from a deployd app directory');
  process.exit(1);
  return;
}

console.log('Running integration tests');
console.log('');

if (fs.existsSync('data')) {
  console.log('Removing previous data directory');
  shelljs.rm('-rf', 'data');
}

// using `spawn` because with `fork` the child script won't be able to catch a `process.exit()` event
// thus leaving mongod zombie processes behind. see https://github.com/joyent/node/issues/5766
var proc = spawn(process.argv[0], ["../bin/dpd"], {env: process.env})
  , buf = '';

proc.on("error", function(err) {
  console.error(err);
  process.exit(1);
});

proc.stdout.on('data', function(data) {
  buf += data.toString();
  var match = buf.match(/listening on port (\d+)/);
  if(match && match[1]) {
    proc.emit('listening', match[1]);
  }
});

proc.stderr.on('data', function(data) {
  buf += data.toString();
});

function kill(e) {
  if (e && e !== 0){
    process.stdout.write("Test run failed. dpd output was: \n\n" + buf);
  }
  proc.kill();
  process.exit(e);
}

proc.once('listening', function (port){
  var mpjsProc = fork('../node_modules/mocha-phantomjs/bin/mocha-phantomjs', [ '--ignore-resource-errors', 'http://localhost:' + port ], {silent: true});
  mpjsProc.on("error", function(err) { 
    console.error(err);
  });
  mpjsProc.stdout.on('data', function(data) {
    process.stdout.write(data.toString());
  });
  mpjsProc.stderr.on('data', function(data) {
    process.stderr.write(data.toString());
  });
  mpjsProc.on('exit', kill);
})
