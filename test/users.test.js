var app = require('../lib/app')
  , assert = require('assert')
;

module.exports = {
  '/users': function() {
    assert.response(app, {url: '/users'}, function(res) {
      try {
        var data = JSON.parse(res.body);
      } catch (e) {}
      assert.ok(data, 'response should be json');
    });
  }
}