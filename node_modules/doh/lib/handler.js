/**
 * Dependencies
 */

var domain = require('domain');

function Handler(req, res, respond, server) {
  this.req = req;
  this.res = res;
  this.respond = respond;
  this.server = server;
  this.domain = domain.create();
}
module.exports = Handler;

/**
 * Run the current request inside a new domain. Pass any errors to `respond`.
 */

Handler.prototype.run = function (fn) {
  var res = this.res
    , req = this.req
    , domain = this.domain
    , handler = this
    , server = this.server
    , error;

  domain.add(req);
  domain.add(res);

  domain.on('error', function (err) {
    if(res.statusCode < 400) res.statusCode = 500;
    res.on('close', function () {
      domain.dispose();
    });
    
    handler.respond(err, req, res, function (e) {
      if(e) {
        console.error(req.method, req.url, 'Error sending 500', e);
        domain.dispose();
      }
      req.resume(); // fixes pause causing requests to timeout
      server.emit('request:error', err, req, res);
    });
  });
  
  domain.run(fn);
}

Handler.createHandler = function (options) {
  var respond = require('./respond')(options.respondOptions);
  return new Handler(options.req, options.res, respond, options.server);
}