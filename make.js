require('shelljs/make');

var path = require('path')
  , less = require('less');

target.all = function() {
  target.dashboard();
  target.jshint();
};

target.dashboard = function() {
  cd(__dirname);

  var lessSource = cat('lib/resources/dashboard/stylesheets/style.less');

  if (lessSource) {
    var parser = new(less.Parser)({
      paths: ['lib/resources/dashboard/stylesheets'], // Specify search paths for @import directives
      filename: 'style.less' // Specify a filename, for better error messages
    });

    parser.parse(lessSource, function (e, tree) {
      if (e) return console.error(e.message);  
      try {
        tree.toCSS().to('lib/resources/dashboard/stylesheets/style.css');  
      } catch (ex) {
        console.error(path.basename(ex.filename) + ":" + ex.line + " - " + ex.message);
        ex.extract.forEach(function(line) {
          console.error("    " + line);
        });
      }
    });

  }
};

target.jshint = function() {
  target.jshintLib();
  target.jshintTest();
  target.jshintDpdJs();
  target.jshintCli();
  target.jshintDashboard();
  target.jshintCollectionDashboard();
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

target.jshintDashboard = function() {
  hint('lib/resources/dashboard/js');
};

target.jshintCollectionDashboard = function() {
  hint('lib/resources/collection/dashboard/js');
};
