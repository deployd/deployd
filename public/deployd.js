function dpd(route, data, callback) {
  var arg
    , i = 0
    , host = dpd.host()
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
    if(dpd.can('use cors')) {
      options.xhrFields = {
        withCredentials: true
      }
    } else {
      options.dataType = 'jsonp';
    }
  }
  
  $.ajax(options);
}

dpd.host = function(host) {
  host && (dpd._host = host);
  return dpd._host || '';
};

dpd.can = function(feature) {
  // cache test results
  dpd.results = dpd.results || {};
  dpd.tests = dpd.tests || {
    'use cors': function() {
      var fauxXHR = new XMLHttpRequest();
      return typeof fauxXHR.withCredentials !== 'undefined';
    }
  };
  
  return dpd.results[feature] || (dpd.results[feature] = dpd.tests[feature]());
};