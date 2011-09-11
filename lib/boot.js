// dependencies for initial app load

// why is the file name for the config file hidden in boot.js?
var config = require('./config').load()
  , app = require('./app')
  , EventEmitter = require('events').EventEmitter
  , loader = new EventEmitter();

function load(type) {
  config[type].forEach(function(item) {
    require('./' + type + '/' + item);
  });
}

// load all controllers and models in the config
load('controller');
load('model');

// start up the app
app.listen(config.port, config.host);