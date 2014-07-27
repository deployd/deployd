var respond = require('../lib/respond')();

test('respond should return html based on the error', function (done) {
  var ended = false
    , headerSet = false;
  
  var res = {
    end: function (str) {
      ended = true;
      if(str.indexOf('<h1>') < 0) fail('response should include html');
    },
    setHeader: function (key, val) {
      headerSet = true;
      if(key != 'Content-Type') fail('respond should set content type');
    }
  };
  
  var req = {};
  
  respond(new Error('test error'), req, res, function () {
    if(!ended) fail('respond should call end');
    if(!headerSet) fail('respond should set a content type header');
    done();
  });
});