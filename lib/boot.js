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
try {
    require.paths.unshift('.');
} catch(e) {
    // no longer supported
    console.warn(e.message);
}

// load plugins
plugins.forEach(function(fd) {
  path = __dirname + '/plugins/' + fd;
  if(fs.statSync(path).isDirectory()) {
	lib[fd] = require(path);
  }
});

// start up the app
console.log(['deployd is listening at', config.ihost || 'localhost', 'on port', config.port].join(' '));

app.listen(config.port, config.ihost);