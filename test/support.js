/**
 * Dependencies
 */

expect = require('chai').expect;
request = require('request');
http = require('http');
TEST_DB = {name: 'test-db', host: 'localhost', port: 27017};
mongodb = require('mongodb');

// request mock
var port = 7000;
freq = function(url, options, fn, callback) {
  options = options || {};
  options.url = 'http://localhost:' + port + url;
  var s = http.createServer(function (req, res) {
    if(callback) {
      var end = res.end;
      res.end = function () {
        callback(req, res);
        var r = end.apply(res, arguments);
        s.close();
        return r;
      }
    } else {
      s.close();
    }
    fn(req, res);
  })
  .listen(port++)
  .on('listening', function () {
    request(options);
  })
}

// before(function (done) {
//   var mdb = new mongodb.Db(TEST_DB.name, new mongodb.Server(TEST_DB.host, TEST_DB.port));

//   mdb.open(function (err) {
//     mdb.dropDatabase(function (err) {
//       done(err);
//       mdb.close();
//     });
//   })
// })