// Balancer tells requests where to go
// - If a internal host (ihost) is not found within its cache, it boots a deployd
//   app at a new ihost and saves this location to the central deployd db
// - Subsequent requests should be mapped from host to ihost and routed

var bouncy = require('bouncy')
  , apps = {
    'deploydapp.com': {port: 3000, ihost: 'localhost'}
  }
  ,	exec = require('child_process').exec
  , ERROR = '<h1>Not Found</h1>There is no app configured to listen to this host. Perhaps you mistyped the url?\n'
  , App = require('./app')
  , children = []
;

process.on('exit', function() {
  console.log('killing child processes');
  children.forEach(function(c) {
    c.kill();
  });
});

process.on('uncaughtException', function(err) {
  console.log(err);
  children.forEach(function(c) {
     c.kill();
   });
});

bouncy(function (req, bounce) {
  var headers = req.headers
    , host = headers && headers.host && headers.host.replace('.deploydapp.com', '')
    , app = App.spawn()
  ;
  
  if(!host) {
    console.log('host not included with request');
    return;
  }
  
  if(apps[host]) {
    console.log('bouncing to', apps[host].ihost || currentHost(), apps[host].port);
    bounce(apps[host].ihost || currentHost(), apps[host].port);
    return;
  }
  
  app
    .find({host: host})
    .notify(function(json) {
      if(json._id && !json.errors) {
        apps[json.host] = json;
        
        // app exists, but not on any internal hosts
        // set the internal host to the machine that spawned it
        json.ihost = currentHost();
        
        // store the dynamic port the app is hosted on
        json.port = nextPort();
        
        console.log(['node index.js', "-c " + JSON.stringify(json)].join(' '));
        
        // then boot
        // var d = exec(['deployd', "'" + JSON.stringify(json) + "'"].join(' '));
        
        // new child boot
        var spawn = require('child_process').spawn;

        process.chdir(__dirname + '/../../../');
        
        var d = spawn('node', ['index.js', '-c ' + JSON.stringify(json)]); 

        children.push(d);
        
        d.stdout
        .on('data', function(data) {
          console.log(data.toString());
          if(data.toString().indexOf('listening') > -1) {
            console.log('bouncing to', currentHost(), 'on port', json.port);
            setTimeout(function() {
              bounce(currentHost(), json.port);
            }, 1500);
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
  process.last = (process.last || 3001);
  return process.last++;
}

function currentHost() {
  return 'localhost';
}