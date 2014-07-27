var upgrade = require('../lib/upgrade');
var http = require('http');
var request = require('request');
var SAMPLE_ERROR = 'testing 123';

test('server should respond with the sample error', function (done) {
  var server = http.createServer();
  upgrade(server);

  server.on('request', function (req, res) {
    throw SAMPLE_ERROR;
  });

  server.listen(3000);

  server.on('listening', function () {
    request('http://localhost:3000', function (err, res, bdy) {
      if(bdy.indexOf(SAMPLE_ERROR) === -1) fail('server should return the SAMPLE_ERROR');
      done();
    });
  });
});

test('server should handle timer errors', function (done) {
  var server = http.createServer();
  upgrade(server);

  server.on('request', function (req, res) {
    setTimeout(function () {
      throw SAMPLE_ERROR;
    }, 10);
  });

  server.listen(4000);

  server.on('listening', function () {
    request('http://localhost:4000', function (err, res, bdy) {
      if(bdy.indexOf(SAMPLE_ERROR) === -1) fail('server should return the SAMPLE_ERROR');
      done();
    });
  });
});


test('server should handle nextTick errors', function (done) {
  var server = http.createServer();
  upgrade(server);

  server.on('request', function (req, res) {
    process.nextTick(function () {
      process.nextTick(function () {
        process.nextTick(function () {
          throw SAMPLE_ERROR;
        });
      });
    });
  });

  server.listen(5000);

  server.on('listening', function () {
    request('http://localhost:5000', function (err, res, bdy) {
      if(bdy.indexOf(SAMPLE_ERROR) === -1) fail('server should return the SAMPLE_ERROR');
      done();
    });
  });
});