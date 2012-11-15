var fs = require('fs')
  , path = require('path')
  , domain = require('domain')

  , q = require('q')
  , async = require('async')

  , loadModules = require('./module-loader');


module.exports.loadConfig = function(basepath, server, fn) {
  var allModulesQ = q.ncall(loadModules, this, basepath);


  var modulesQ = allModulesQ.next(function(allModules) {
    // instantiate all modules
    return [];
  });

  var resourceTypesQ = allModulesQ.next(function(allModules) {
    // filter all modules
    return [];
  });

  var resourcesQ = resourceTypesQ.next(function(resourceTypes) {
    // instantiate all resources
    return [];
  });

  q.spread(modulesQ, resourcesQ, resourceTypesQ, 
    function(modules, resources, resourceTypes) {
      return {
        modules: modules,
        resources: resources,
        resourceTypes: resourceTypes
      };
  }).then(function(result) {
    if (server.options && server.options.env !== 'development') {
      server.__resourceCache = result;
    }
    fn(null, result);
  }, function(err) {
    fn(err);
  });

};