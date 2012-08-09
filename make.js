require('shelljs/make');

var less = require('less');

target.all = function() {
  target.dashboard();
}

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
      tree.toCSS().to('lib/resources/dashboard/stylesheets/style.css');
    });

  }


  // var result = exec('lessc lib/resources/dashboard/stylesheets/style.less', {silent: true});
  // if (result.code) {
  //   console.error(result.output);
  // } else {
  //   result.output.to('lib/resources/dashboard/stylesheets/style.css')
  // }
}