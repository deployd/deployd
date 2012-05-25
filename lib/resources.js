/**
 * Dependencies
 */
 
var fs = require('fs');

exports.build = function (store) {
  var definitions = define(__dirname);

  store.find = function (query, fn) {
    if(typeof query == 'function') {
      fn = query;
      query = {};
    }
    
    store.__proto__.find.call(store, query, function (err, resources) {
      if(err) return fn(err);
      // build resources from data
      var result = [];
      if(resources) {
        resources.forEach(function (resource) {
          result.push(new definitions[resource.type](resource));
        })
      }
      
      fn(err, result);
    })
  }
  
  return store;
}

function define(dir) {
  var definitions = {};
  
  fs.readdirSync(dir + '/resources').forEach(function (path) {
    if(~path.indexOf('.js')) {
      var constructor = require(__dirname + '/resources/' + path);
      definitions[constructor.name] = constructor;
    }
  });
  
  return definitions;
}