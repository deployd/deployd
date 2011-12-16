var CONFIG_PATH = './config/'
  , fs = require('fs')
  , cache = {};

exports.load = function(path) {
  var data = fs.readFileSync(CONFIG_PATH + (path || (path = 'app.json')))
    , json = cache[path] || (cache[path] = JSON.parse(data))
    , bootedJSON = bootParams()
  ;
  
  if(bootedJSON) {
    for(var key in bootedJSON) {
      if(bootedJSON.hasOwnProperty(key)) {
        json[key] = bootedJSON[key];
      }
    }
  }
  
  return json;
};

function bootParams() {
  for(var i = 0; i < process.argv.length; i++) {
    var val = process.argv[i];

    if(val.indexOf('-c') === 0) {
      return JSON.parse(val.substr(3, val.length - 1));
    }
  }
}