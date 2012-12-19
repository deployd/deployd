var uuid = require('./util/uuid')
  , SYNC_INTERVAL = 3000
  , address = require('./util/address')
  , request = require('request')
  , now = require('./util/time').now;

function Cluster(server) {
  var cluster = this;
  this.remotes = {};
  this.sockets = {};
  this.server = server;
  this.store = server.createStore('dpd__servers');
  
  server.on('listening', function () {
    var local = cluster.local = {};
    local.port = server.options.port;
    local.lastHeartbeat = now();
  
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
  
    cluster.trackRequests(server);
  });
}

module.exports = Cluster;

Cluster.prototype.sync = function() {
  var cluster = this
    , local = this.local
    , store = this.store;
    
  local.lastHeartbeat = now();
  this.updateHealth();
    
  store.update({id: local.id}, local);
  
  var oldestAcceptableHeartbeat = this.getHeartBeatCutoff();
  store.find({lastHeartbeat: {$gt: oldestAcceptableHeartbeat}}, function(err, all) {
    
    if(Array.isArray(all) && all.length) {
      cluster.remotes = {};
      all.forEach(function (info) {
        if(info.id === local.id) return;
        
        cluster.remotes[info.id] = info;
      });
    }
  });
  
  this.cleanup();
}

Cluster.prototype.updateHealth = function () {
  // memory
  this.local.memory = process.memoryUsage();
  this.local.pid = process.pid;
  this.local.uptime = process.uptime();
}

Cluster.prototype.getHeartBeatCutoff = function () {
  return now() - (SYNC_INTERVAL * 3);
}

Cluster.prototype.cleanup = function () {
  this.store.remove({lastHeartbeat: {$lte: this.getHeartBeatCutoff()}});
}

Cluster.prototype.emitToAll = function (ev, data) {
  var cluster = this;
  
  Object.keys(this.remotes).forEach(function (r) {
    cluster.emitToServer(r, ev, data);
  });
}

Cluster.prototype.emitToUsers = function (uids, ev, data) {
  var cluster = this;
  
  Object.keys(this.remotes).forEach(function (r) {
    var q = {host: r, uid: {$in: uids}};
    process.server.sessions.find(q, function (err, sessions) {
      if(Array.isArray(sessions) && sessions.length) {
        var sids = [];
        
        sessions.forEach(function (s) {
          sids.push(s.id);
        });
    
        cluster.emitToServer(r, ev, data, sids); 
      }
    });
  });
}

Cluster.prototype.emitToServer = function(host, ev, data, sids) {
  var cluster = this;
  
  if(cluster.rootKey) {
    emit();
  } else {
    process.server.keys.getLocal(function (err, key) {
      if(err) throw err;
      cluster.rootKey = key;
      emit();
    });
  }
  
  function emit() {
    var headers = {'dpd-ssh-key': cluster.rootKey};
    var body = {
      event: ev,
      data: data
    };
  
    if(sids) {
      body.sids = sids;
    }
  
    try {
      request.post({url: 'http://' + host + '/__proxy', headers: headers, json: body});
    } catch(e) {
      delete cluster.remotes[host];
    }
  }
}

Cluster.prototype.handleProxy = function (req, res) {
  var cmd = req.body
    , sessions = process.server.sessions; 

  if(cmd.uids) {
    // only emit to sockets that match this query
    sessions.emitToUsers(cmd.uids, cmd.event, cmd.data);
  } else {
    // emit to all
    sessions.emitToAll(req.body.event, req.body.data);
  }
  
  res.end();
}

Cluster.prototype.trackRequests = function (server) {
  var cluster = this;
  var resTimes = []
    , reqTimes = []
    , MAX = 1024; 
  
  server.on('request', function (req, res) {
    var start = process.hrtime();
    
    req.on('end', function () {
      reqTimes.push(process.hrtime(start));
      if(reqTimes.length > MAX) reqTimes.shift();
    });
    
    var end = res.end;
    res.end = function () {
      end.apply(res, arguments);
      resTimes.push(process.hrtime(start));
      if(resTimes.length > MAX) reqTimes.shift();
    }
  });
  
  function calc(arr) {
    if(!arr || arr.length === 0) return 0;
    var total = 0;
    arr.forEach(function (time) {
      total += (time[0] * 1000000000) + time[1];
    });
    return Math.round(total / arr.length) / 1000000;
  }
  
  setInterval(function () {
    cluster.local.processing = {
      req: calc(reqTimes),
      res: calc(resTimes)
    };
  }, SYNC_INTERVAL);
}