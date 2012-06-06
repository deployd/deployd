var fs = require('fs')
  , path = require('path')
  , Resource = require('./resource');

/**
 * Loads resources from a project folder
 * Callback receives two arguments `(err, resources)`.
 * 
 * @param {String} basepath
 * @param {Function} callback
 */
module.exports.loadConfig = function(basepath, fn) {
  var resourcesPath = path.join(basepath, '/resources.json');

  fs.readFile(resourcesPath, 'utf-8', function(err, data) {
    if (err) { return fn(err); }  

    // TODO - refactor this
    // if an error isnt caught in fn() it will call itself again with an err
    try {
      var jsonData = JSON.parse(data);
      fn(null, jsonData);
    } catch (ex) {
      return fn(ex);
    }
    
  });
};

/**
 * Saves resources to a project folder. Callback receives `(err)`.
 * 
 * @param {String} basepath
 * @param {Array of Object} resources (configuration objects)
 * @param {Function} callback
 */
module.exports.saveConfig = function(resources, basepath, fn) {
  var resourcesPath = path.join(basepath, '/resources.json')
    , json = JSON.stringify(resources);

  fs.writeFile(resourcesPath, json, 'utf-8', function(err) {
    if (err) return fn(err);
    fn();
  });
};
