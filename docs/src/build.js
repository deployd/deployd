var dox = require('dox')
  , ejs = require('ejs')
  , lib = __dirname + '/../../lib'
  , shelljs = require('shelljs/global')
  , src = cat(find(lib).filter(function(file) { return file.match(/\.js$/); }))
  , out = dox.parseComments(src);


exec('lessc ' + __dirname + '/style.less', {silent: true}).output.to(__dirname + '/../style.css');
ejs.renderFile(__dirname + '/template.ejs', {locals: {comments: out}}, function (err, result) {
  result.to(__dirname + '/../index.html');
});