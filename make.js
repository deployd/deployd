require('shelljs/make');
var path = require('path');

target.all = function() {
  target.docs();
}

target.docs = function() {
  cd('docs');
  var header = cat('layout/header.html')
    , body = '';
  
  // index should be first
  body += exec('markdown ' + 'index.markdown', {silent: true}).output;
  
  ls('*.markdown').forEach(function(file, i, arr) {
    if(file != 'index.markdown') {
      body += exec('markdown ' + file, {silent: true}).output;
      if(i < arr.length - 1) body += '<hr />';
    }
  });
  var footer = cat('layout/footer.html');
  (header + body + footer).to('index.html');
  cd('..');
}