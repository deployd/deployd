var upgrade = require('../lib/upgrade');
var http = require('http');
var fs = require('fs');
var net = require('net');
var request = require('request');
var EventEmitter = require('events').EventEmitter;
var numRequests = 50;

test('should be able to handle ' + numRequests + ' requests', function (done) {

  var server = http.createServer();
  server.on('request', function (req, res) {
    req.pause();
    recursiveTimers(res);
  });
  
  upgrade(server);
  
  server.listen(3001).on('listening', function () {
    var to = setTimeout(function () {
      fail('load test timed out after 5sec');
    }, 3000);
    
    var remaining = numRequests;
    
    for(var i = remaining; i > 0; i--) {
      request('http://localhost:3001', function (err, res, bdy) {
        remaining--;
        if(res.statusCode !== 500) fail('load test failed with incorrect response');
        if(remaining === 0) {
          clearTimeout(to);
          done();
        }
      })
    }
  })
})


net.createServer().listen(3003);

/**
 * this function is designed to create tons of timers and event emitters
 */
 
function recursiveTimers(res, total) {
  total = total || 0;
  total++;
  process.nextTick(function () {
    setTimeout(function () {
      fs.readFile('non-existent.txt', function () {
        var e = new EventEmitter();
        net.connect(3003, function (err) {
          e.on('next', function () {
            if(total < 16) {
              recursiveTimers(res, total);
            } else {
              process.nextTick(function () {
                setTimeout(function () {
                  doesntExist();
                }, 1)
              })
            }
          });
          e.emit('next');
        })
      });
    }, 1)
  })
}