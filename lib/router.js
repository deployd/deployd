/**
 * Dependencies
 */

var db = require('./db');

function Router(resources) {
  this.resources = resources;
}

Router.prototype.route = function (req, res) {
  var router = this;
  
  this.resources.find(function (err, resources) {
    var handler;
    resources.forEach(function (resource) {
      if(resource.handle(req, res)) {
        handler = resource;
        return false;
      }
      
      if(!handler) res.error('resource not found', 404);
    });
  })
};