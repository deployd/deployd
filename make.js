require('shelljs/make');
var path = require('path');

target.all = function() {
  target.docs();
}

target.docs = function() {
  cd('docs');
  ls('*.markdown').forEach(function(file) {
    var target = path.basename(file, path.extname(file)) + '.html';

    var header = cat('layout/header.html');
    var body = exec('markdown ' + file, {silent: true}).output;
    var footer = cat('layout/footer.html');

    (header + body + footer).to(target);
  });
  cd('..');
}