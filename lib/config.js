var CONFIG_PATH = './config/'
  , fs = require('fs')
  , util = require('util')
  , cache = {}
  , data = fs.readFileSync(CONFIG_PATH + 'app.json')
  , json =JSON.parse(data)
  , bootedJSON = bootParams()
;

function bootParams() {
  for(var i = 0; i < process.argv.length; i++) {
    var val = process.argv[i];

    if(val.indexOf('-c') === 0) {
      return JSON.parse(val.substr(3, val.length - 1));
    }
  }
}

if(bootedJSON) {
  for(var key in bootedJSON) {
    if(bootedJSON.hasOwnProperty(key)) {
      json[key] = bootedJSON[key];
    }
  }
}

var log = 'Configuration \n'
        + util.inspect(json);
        
console.log(log);

module.exports = json;