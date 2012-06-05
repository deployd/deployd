var fs = require('fs')
  , path = require('path');

/**
 * Loads resources from a project folder
 */
module.exports.loadConfig = function(basepath, store, fn) {
  var resourcesPath = path.join(basepath, '/resources');

  fs.readdir(resourcesPath, function(err, files) {
    if (err) { return fn(err); }  
    var file
      , count = files.length
      , resources = {};

    for (var i = 0; i < files.length; i++) {
      file = path.join(resourcesPath, files[i]);
      loadResourceFromFile(file, store, function(err, config) {
        resources[config.path + ":" + config.type] = config;
        count--;
        if (!count) {
          deleteExcessResources(resources, store, fn);
        }
      });
    };
  });
};

function loadResourceFromFile(file, store, fn) {
  fs.readFile(file, 'utf-8', function(err, data) {
    if (err) return fn(err);
    var result
      , dbResource;

    try {
      result = JSON.parse(data);
      saveResourceToDb(result, store, function(err) { fn(err, result); });
    } catch (ex) {
      fn(ex);
    }
  });
}

function saveResourceToDb(config, store, fn) {
  var query = {path: config.path, type: config.type};

  store.find(query, function(err, resources) {
    if (!resources) {
      store.insert(config, fn)
    } else {
      store.update(query, config, fn)
    }
  });
}

function deleteExcessResources(resources, store, fn) {
  var count = 0;

  store.find(function(err, existing) {
    if (!resources) return fn(err);

    existing.forEach(function(r) {
      var key = r.path + ":" + r.type;
      if (!resources[key]) {
        count++;
        store.remove(r, function() {
          process.nextTick(function() {
            count--;
            if (!count) { fn(); }    
          })
        });
      }
    });

    if (!count) { fn(); }
  });
}

module.exports.saveConfig = function(basepath, store, fn) {
  fn();
};