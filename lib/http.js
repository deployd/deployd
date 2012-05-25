/**
 * Dependencies
 */
 
var http = require('http')
  , Router = require('./router')
  , db = require('./db')
  , resources = require('./resources');
  
function Server(options) {
  var server = http.createServer(options.host, options.port)
    , db = db.connect(options.db)
    , router = new Router(resources.build(db.createStore('resources')));

  server.on('request', router.route);
}