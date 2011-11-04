var app = require('app')
  , assert = require('assert')
;

module.exports = {
  'method override': function() {
    assert.response(app, {
        url: '/?method=get',
        method: 'POST',
    }, {
        status: 200
    });
    
    assert.response(app, {
        url: '/',
        method: 'POST',
        headers: {
          'x-http-method-override': 'get'
        }
    }, {
        status: 200
    });
  }
}