var fork = require('child_process').fork
  , shelljs = require('shelljs')
  , fs = require('fs');


if (!fs.existsSync('app.dpd')) {
  console.log('Not a deployd app directory, please run this from a deployd app directory');
  process.exit();
  return;
}

console.log('Running integration tests');
console.log('');

if (fs.existsSync('data')) {
  console.log('Removing previous data directory');
  shelljs.rm('-rf', 'data');
}
var proc = fork("../bin/dpd", [], {silent: true})
  , buf = '';

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
  process.exit(e);
}

proc.once('listening', function (port){
  var mpjsProc = fork('../node_modules/mocha-phantomjs/bin/mocha-phantomjs', [ '--ignore-resource-errors', 'http://localhost:' + port ], {silent: true});
  mpjsProc.stdout.on('data', function(data) {
    process.stdout.write(data.toString());
  });
  mpjsProc.on('exit', kill);
})
