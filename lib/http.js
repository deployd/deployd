var http = require('http')
  , Router = require('./router')
  , db = require('./db')
  , resources = require('./resources');

/**
 * Create an http server with the given options and create a `Router` to handle its requests.
 *
 * Options:
 *
 *   - `db`           the database connection info
 *   - `host`         the server's hostname
 *   - `port`         the server's port
 *
 * Example:
 *
 *     var server = new Server({port: 3000, db: {host: 'localhost', port: 27015, name: 'my-db'}});
 *     
 *     server.listen();
 *
 * @param {Object} options
 * @return {HttpServer}
 */

function Server(options) {
  var server = http.createServer(options.host, options.port)
    , db = db.connect(options.db)
    , router = new Router(resources.build(db.createStore('resources')));

  server.on('request', router.route);
}