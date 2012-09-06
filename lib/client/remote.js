/*!
 * A proxy client for connecting to a remote instance of dpd
 */

var http = require('http')
  , util = require('util')
  , request = require('request')
  , Keys = require('../keys')
  , debug = require('debug')('remote')
  , httpProxy = require('http-proxy')
  , url = require('url');

/*!
 * Create a remote and host it at the given port.
 */

exports.createRemote = function(remote, port) {
  debug('proxying to %s', remote);

  if(remote.substr(0,7) !== 'http://') remote = 'http://' + remote;

  var remoteUrl = url.parse(remote);
  var keys = new Keys();
  var server = httpProxy.createServer(function(req, res, proxy) {
    var buffer = httpProxy.buffer(req);

    debug('[%s] %s', req.method, req.url);
    keys.getLocal(function(err, key) {
      debug('key [%s]', key);
      if(err) return res.end('error reading .dpd/keys.json: ' + err.message);
      req.headers['dpd-ssh-key'] = key;
      req.headers.host = remoteUrl.hostname;
      proxy.proxyRequest(req, res, {
        host: remoteUrl.hostname,
        port: remoteUrl.port || 80,
        buffer: buffer
      });
    });
  });
  server.listen(port || 2403);
  server.on('listening', function() {
    console.log('remote dashboard is available at http://localhost:%s/dashboard', port || 2403);
  });
};
