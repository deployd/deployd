var dpd = require('./deployd')
  , name = dpd.name
  , express = require('express')
  , server = express.createServer(express.bodyParser())
  , resources = require('./resources')
  , router = require('./router')
  , types = require('./types')
;

/**
 * Serve storage at each resource route.
 */

server.use(router);

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
 * Export a function to mount the new server to a name.
 */

module.exports = function (name) {
  server.name = name || 'deployd';
  return server;
};