// dependencies for initial app load
// use spawn inheritance
require('./spawn');

var config = require('./config').load()
  , fs = require('fs')
  , app = require('./app')
  , plugins = fs.readdirSync(__dirname + '/plugins')
  , path
;

lib = {
  require: function(module) {
    return require('./' + module);
  }
};

// load plugins
plugins.forEach(function(fd) {
  path = __dirname + '/plugins/' + fd;
  if(fs.statSync(path).isDirectory()) {
	lib[fd] = require(path);
  }
});

// start up the app
app.listen(config.port, config.host);