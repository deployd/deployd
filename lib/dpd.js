var request = require('request')
  , app = require('./app')
;

function dpd() {
  var arg
    , i = 0
    , options = {}
  ;
  
  while(arg = arguments[i++]) {
    switch(typeof arg) {
      case 'string':
        options.uri = dpd.host() + arg;
      break;
      case 'object':
        options.json = JSON.stringify(arg);
        options.method = 'POST';
      break;
      case 'function':
        request(options, function() {
          console.log(arguments);
        });
      break;
    }
  }
}

dpd.host = function(host) {
  host && (dpd._host = host);
  return dpd._host || '';
};

// mixin app calls
['all', 'get', 'post', 'del', 'put'].forEach(function(method) {
  dpd[method] = app[method];
});

module.exports = dpd;