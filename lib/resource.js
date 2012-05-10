/**
 * Dependencies
 */

var types = require('./types')
  , event = require('./event')
  , mdoq = require('mdoq')
;

/**
 * Execute the request against the provided resource.
 */
 
module.exports = function (req, res, next, end) {
  var resource = req.resource
    , method = req.method;

  // skip without a resource
  if(!resource) return next({status: 404});
  
  // use type's require if provided
  var modulePath = (types[resource.type] || resource).require;
  
  // skip without a module path
  if(!modulePath) return next({error: 'Resource does not have a require property.'});
  
  // require module
  var module = req.module = require(modulePath);
  
  // execute on post handler
  if(resource.onPost && method === 'POST') {
    end(event(resource.onPost));
  }
  
  // exec on put handler
  if(resource.onPut && method === 'PUT' && req.query && req.query._id) {
    end(event(resource.onPut));
  }
  
  // exec on delete handler
  if(resource.onDelete && method === 'DELETE' && req.query && req.query._id) {
    end(event(resource.onDelete));
  }
  
  // end with the module as the finalware
  if(module.middleware || typeof module == 'function') {
    end(function (req, res, next) {
      if(typeof module == 'function') {
        module.apply(this, arguments);
      } else {
        module.exec(req, function (err, data) {
          res.data = data;
          next();
        })
      }
    });
  } else {
    return next(new Error('The provided module is not supported'));
  }
  
  // exec on get handler after data is retrieved
  if(method === 'GET' && resource.onGet) {
    end(event(resource.onGet));
  }
  
  // continue
  next();
}