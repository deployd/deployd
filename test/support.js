/**
 * Dependencies
 */

expect = require('chai').expect;
request = require('request');
http = require('http');
TEST_DB = {name: 'test-db', host: 'localhost', port: 27017};
mongodb = require('mongodb');
var Stream = require('stream');
sh = require('shelljs');

// port generation
genPort = function() {
  var min = 6666, max = 9999;
  var result = min + (Math.random() * (max - min));
  return Math.floor(result);
};


// request mock
freq = function(url, options, fn, callback) {
  var port = genPort();
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
      };
    } else {
      s.close();
    }
    fn(req, res);
  })
  .listen(port)
  .on('listening', function () {
    request(options);
  });
};

before(function (done) {
  var mdb = new mongodb.Db(TEST_DB.name, new mongodb.Server(TEST_DB.host, TEST_DB.port));
  mdb.open(function (err) {
    if(err) {
      done(err);
    } else {
      mdb.dropDatabase(function (err) {
        done(err);
        mdb.close();
      });
    }
  });
});


/**
 * Utility for easily testing resources with mock contexts
 * 
 * Inputs:
 *  - url (relative to the base path)
 *  - query object
 *  - body object or stream
 *  - headers object
 *  - method (get,post,put,delete,etc)
 * 
 * Output:
 *   Should be what context.done should be called with
 * 
 * Behavior:
 *  - error true if should expect an error
 *  - next should call next if 
 */

var ServerRequest = require('http').ServerRequest
  , ServerResponse = require('http').ServerResponse;

fauxContext = function(resource, url, input, expectedOutput, behavior) {
  input = input || {};
  var context = {
    url: url,
    body: input.body,
    query: input.query,
    done: function(err, res) {
      if(behavior && behavior.next) throw new Error('should not call done');
      if(expectedOutput && typeof expectedOutput == 'object') expect(res).to.eql(expectedOutput);
      context.done = function() {
        throw 'done called twice...';
      };
      if(behavior && behavior.done) behavior.done(err, res);
    },
    res: input.res || new ServerResponse(new ServerRequest())
  };

  context.res.end = function() {
    context.done();
  };

  function next(err) {
    if(!(behavior && behavior.next)) {
      throw new Error('should not call next');
    }
    if(behavior && behavior.done) behavior.done(err);
  }

  resource.handle(context, next);
};


