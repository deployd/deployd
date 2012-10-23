var uuid = require('./util/uuid')
  , SYNC_INTERVAL = 3000
  , address = require('./util/address')
  , request = require('request');

function Cluster(server) {
  var cluster = this;
  this.remotes = {};
  this.sockets = {};
  this.server = server;
  this.store = server.createStore('__servers');
  
  var local = this.local = {};
  local.port = server.options.port;
  
  address(function (err, add) {
    local.ip = add;
    local.id = add + ':' + local.port;
    cluster.store.remove(local.id, function () {
      cluster.store.insert(local, function (err, l) {
        setInterval(function () {
          cluster.sync();
        }, SYNC_INTERVAL);
      });
    });
  });
}

module.exports = Cluster;

Cluster.prototype.sync = function() {
  var cluster = this;
  
  // XXX - handle cleanup of dead instances
  this.store.update(this.local.id, this.local);
  
  this.store.find(function(err, all) {
    if(Array.isArray(all)) {
      cluster.remotes = {};
      all.forEach(function (info) {
        cluster.remotes[info.id] = info;
      });
    }
  });
}

Cluster.prototype.emitToAll = function (ev, data) {
  var cluster = this;
  
  Object.keys(this.remotes).forEach(function (r) {
    cluster.emitToServer(r, ev, data);
  });
}

Cluster.prototype.emitToServer = function(host, ev, data) {
  var body = {
    event: ev,
    data: data
  };
  
  try {
    request.post({url: 'http://' + host + '/__proxy', json: body});
  } catch(e) {
    console.error('could not proxy to host %s', host);
    delete this.remotes[host];
  }
}

Cluster.prototype.handleProxy = function (req, res) {
  if(req.body && req.body.event) {
    process.server.sockets.emit(req.body.event, req.body.data);
  }
  
  res.end();
}