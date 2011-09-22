// dependencies for initial app load

// why is the file name for the config file hidden in boot.js?
var config = require('./config').load()
  , fs = require('fs')
  , app = require('./app')
  , plugins = fs.readdirSync('plugins')
  , path
;

lib = {
  require: function(module) {
    return require('./' + module);
  }
}

// load plugins
plugins.forEach(function(fd) {
  path = './plugins/' + fd;
  if(fs.statSync(path).isDirectory()) {
    require('.' + path);
  }
})

// start up the app
app.listen(config.port, config.host);