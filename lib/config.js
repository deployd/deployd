var CONFIG_PATH = './config/'
  , fs = require('fs')
  , cache = {};

exports.load = function(path) {
  var data = fs.readFileSync(CONFIG_PATH + (path || (path = 'app.json')))
    , json = cache[path] || (cache[path] = JSON.parse(data))
    , bootedWith = process.argv[2]
    , bootedJSON = bootedWith && JSON.parse(bootedWith)
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