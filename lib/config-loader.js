var fs = require('fs')
  , path = require('path')
  , Resource = require('./resource');

/*!
 * Loads resources from a project folder
 * Callback receives two arguments `(err, resources)`.
 * 
 * @param {String} basepath
 * @param {Function} callback
 */
module.exports.loadConfig = function(basepath, fn) {
  var resourcesPath = path.join(basepath, '/app.dpd');

  fs.readFile(resourcesPath, 'utf-8', function(err, data) {
    if (err) { return fn(err); }  

    var jsonData
      , error;

    try {
      jsonData = JSON.parse(data);
    } catch (ex) {
      error = ex;
    }

    fn(error, jsonData);
  });
};

/*!
 * Saves resources to a project folder. Callback receives `(err)`.
 * 
 * @param {String} basepath
 * @param {Array of Object} resources (configuration objects)
 * @param {Function} callback
 * @ignore
 */
module.exports.saveConfig = function(resources, basepath, fn) {
  var resourcesPath = path.join(basepath, '/app.dpd')
    , json = JSON.stringify(resources);

  fs.writeFile(resourcesPath, json, 'utf-8', function(err) {
    if (err) return fn(err);
    fn();
  });
};
