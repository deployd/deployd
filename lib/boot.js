// dependencies for initial app load
// use spawn inheritance
require('./spawn');

lib = {};

var config = require('./config').load()
  , fs = require('fs')
  , app = require('./app')
  , plugins = fs.readdirSync(__dirname + '/plugins')
  , path
;

// expose current directory to plugins
require.paths.unshift('.');

// load plugins
plugins.forEach(function(fd) {
  path = __dirname + '/plugins/' + fd;
  if(fs.statSync(path).isDirectory()) {
	lib[fd] = require(path);
  }
});

// start up the app
var port = process.argv[3] || config.port;

console.log(['deployd is listening at', config.host || 'localhost', 'on port', port].join(' '));

app.listen(port, config.host);