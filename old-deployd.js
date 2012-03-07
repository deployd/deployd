/**
 * Export a function to mount the new server by name.
 */

module.exports = function (name, port, mhost) {

  /**
   * Server info
   */

  process.name = name;
  process.port = port || process.env.PORT || 2304;
  
  /**
   * Mongodb host info (can be mongodb:// url or just hostname)
   */
   
  process.mhost = mhost || 'localhost';

  /**
   * Server dependencies
   */
   
  var resources = require('./resources')
    , sessions = require('./sessions')
    , storage = require('./storage')
    , router = require('./router')
    , server = require('./server')
    , users = require('./users')
    , types = require('./types')
    , mdoq = require('mdoq')
  ;

  /**
   * Serve resources over http.
   */

  server.use('/resources', resources.proxy());

  /**
   * Serve resource types over http.
   */

  server.get('/types', function (req, res) {
    res.send(types);
  });

  /**
   * Serve resources from storage.
   */

  server.use(storage.proxy());

  /**
   * Error Handling.
   */
  
  server.error(function (err, req, res, next) {
    if(typeof err == 'object' && !(err instanceof Error)) {
      res.statusCode = 400;
      res.send(err);
    } else {
      next(err);
    }
  });

  /**
   * Export the server.
   */
  
  return server;
};