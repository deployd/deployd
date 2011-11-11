// Balancer tells requests where to go
// - If a internal host (ihost) is not found within its cache, it boots a deployd
//   app at a new ihost and saves this location to the central deployd db
// - Subsequent requests should be mapped from host to ihost and routed

var bouncy = require('bouncy')
  , apps = {}
  ,	exec = require('child_process').exec
  , ERROR = '<h1>Not Found</h1>There is no app configured to listen to this host. Perhaps you mistyped the url?\n'
  , App = require('./app')
;

bouncy(function (req, bounce) {
  var host = req.headers.host
    , app = App.spawn()
  ;
  
  if(apps[host]) {
    bounce(apps[host].ihost || currentHost(), apps[host].port);
    return;
  }
  
  app.query = {host: host.replace('.deployd.com', '')};
  app
    .notify(function(json) {
      apps[host] = json;
      if(json.ihost && json.port) {
        bounce(app.ihost, json.port);
      } else if(json._id) {
        // app exists, but not on any internal hosts
        // set the internal host to the machine that spawned it
        json.ihost = currentHost();
        json.port = nextPort();
        
        console.log(['deployd', "'" + JSON.stringify(json) + "'"].join(' '));
        
        // then boot
        var d = exec(['deployd', "'" + JSON.stringify(json) + "'"].join(' '));
        
        d.stdout
        .on('data', function(data) {
          console.log(data.toString());
          if(data.toString().indexOf('listening') > -1) {
            bounce(json.port);
          }
        });
        
        d.stderr.on('data', function(data) {
          console.log(data.toString());
        });

        
        app.set(json).save();
      } else {
        var res = bounce.respond();
        res.writeHead(500, {
          'Content-Length': ERROR.length,
          'Content-Type': 'text/html'
        });
        res.end(ERROR);
      }
    })
    .fetch()
  ;
}).listen(80);

function nextPort() {
  process.last = (3001 || process.last);
  return process.last++;
}

function currentHost() {
  return 'localhost';
}