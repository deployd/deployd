/**
 * Dependencies
 */

expect = require('chai').expect;
request = require('request');
http = require('http');
TEST_DB = {name: 'test-db', host: 'localhost', port: 27017};

// request mock
freq = function(url, options, fn) {
  options.url = 'http://localhost:7777' + url;
  var s = http.createServer(function (req, res) {
    fn(req, res);
    s.close();
  })
  .listen(7777)
  .on('listening', function () {
    request(options);
  })
}