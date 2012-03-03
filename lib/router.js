/**
 * Dependencies
 */

var storage = require('./storage')
  , resources = require('./resources')
  , revalidator = require('revalidator')
;

module.exports = function (req, res, next) {
  var path = req.url.split('?')[0];
  
  resources.get({path: path}, function (err, resource) {
    
    // HACK - REMOVE ONCE `first()` LANDS IN MDOQ-MONGODB
    
    resource = resource && resource[0] || resource;
    
    if(resource && tryingToModify(req)) {
      if(resource.settings) {
        var result = revalidator.validate(req.body, {properties: resource.settings});
        
        if(result.valid) {
          storage.proxy().call(this, req, res, next);
        } else {
          res.send(result);
        }
      } else {
        storage.proxy().call(this, req, res, next);
      }
    } else if(resource) {
      storage.exec(req, function (err, r) {
        res.send(err || r);
      });
    } else {
      next();
    }
  })
}

function tryingToModify(req) {
  var method = req.method;
  return method === 'POST' || method === 'PUT';
}
