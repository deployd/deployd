function d(route, data, callback) {
  var arg
    , i = 0
    , host = d.host()
    , options = {
        dataType: 'json',
        contentType: 'application/json'
      }
  ;
  
  while(arg = arguments[i++]) {
    switch(typeof arg) {
      case 'string':
        options.url = arg;
      break;
      case 'object':
        options.data = JSON.stringify(arg);
        options.type = 'POST';
      break;
      case 'function':
        options.error = options.success = arg;
      break;
    }
  }
  
  if(host && host !== window.location.host) {
    options.url = window.location.protocol + '//' + host + options.url;
    if(d.can('use cors')) {
      options.beforeSend = function(xhr) {
        xhr.withCredentials = true;
      };
    } else {
      options.dataType = 'jsonp';
    }
  }
  
  $.ajax(options);
}

d.host = function(host) {
  host && (d._host = host);
  return d._host || '';
};

d.can = function(feature) {
  // cache test results
  d.results = d.results || {};
  d.tests = d.tests || {
    'use cors': function() {
      var fauxXHR = new XMLHttpRequest();
      return typeof fauxXHR.withCredentials !== 'undefined';
    }
  };
  
  return d.results[feature] || (d.results[feature] = d.tests[feature]());
};