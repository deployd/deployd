var CONFIG_PATH = './config/'
  , fs = require('fs')
  , cache = {};

exports.load = function(path) {
  var data = fs.readFileSync(CONFIG_PATH + (path || (path = 'app.json')))
    , json = cache[path] || (cache[path] = JSON.parse(data));
  
  return json;
};