var Handler = require('./handler');

/**
 * Upgrade the server by creating handlers for incoming server requests.
 *
 * Example: 
 *     
 *    upgrade(http.createServer(), {template: 'foo.html'})
 *
 */

module.exports = function (server, options) {
  var emit = server.emit
    , respond = require('./respond')(options);
  
  server.emit = function (ev, req, res) {
    if(ev === 'request') {
      var h = new Handler(req, res, respond, server)
        , args = arguments;
      
      h.run(function () {
        emit.apply(server, args);
      });
    } else {
      emit.apply(server, arguments);
    }
  }
  
  return server;
} 