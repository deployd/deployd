// dependencies for initial app load
require('./log');
// use spawn inheritance
require('./spawn');
// custom logging

lib = {};

var config = require('./config')
  , fs = require('fs')
  , app = require('./app')
  , plugins = fs.readdirSync(__dirname + '/plugins')
  , path
;

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