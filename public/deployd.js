function d(route, data, callback) {
  var arg
    , i = 0
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
  
  console.log(options);
  
  $.ajax(options);
}