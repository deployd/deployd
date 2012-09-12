require('shelljs/make');

var path = require('path');

target.all = function() {
  target.jshint();
};

target.jshint = function() {
  target.jshintLib();
  target.jshintTest();
  target.jshintDpdJs();
  target.jshintCli();
};

function hint(pathName, fileName) {
  var lastPath = process.cwd();
  cd(pathName);
  echo("Linting " + pathName + (fileName ? ("/" + fileName) : "") + "...");
  exec('jshint ' + (fileName || '.') + " --extra-ext " + fileName);
  echo();
  cd(lastPath);
}

target.jshintLib = function() {
  hint('lib');
};

target.jshintTest = function() {
  hint('test');
  hint('test-app');
};

target.jshintDpdJs = function() {
  hint('clib', 'dpd.js');
};

target.jshintCli = function() {
  cp('bin/dpd', 'bin/dpd.js');
  hint('bin', 'dpd.js');
  rm('bin/dpd.js');
};