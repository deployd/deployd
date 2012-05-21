require('shelljs/make');
var md = require('node-markdown').Markdown;
var path = require('path');

target.all = function() {
  target.docs();
}

target.docs = function() {
  cd('docs');
  var header = cat('layout/header.html')
    , body = '';
  
  // index should be first

  body += md(cat('index.markdown'));
  
  ls('*.markdown').forEach(function(file, i, arr) {
    if(file != 'index.markdown') {
      console.log(cat(file));
      body += md(cat(file));
      if(i < arr.length - 1) body += '<hr />';
    }
  });
  var footer = cat('layout/footer.html');
  (header + body + footer).to('index.html');
  cd('..');
}