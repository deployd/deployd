/**
 * Dependencies
 */

var types = require('./types')
  , isIdentifier = require('./storage').isIdentifier

/**
 * Execute the request against the provided resource.
 */
 
module.exports = function (req, res, next, end) {
  // skip without a resource
  if(!req.resource) return next({status: 404});
  
  // use type's require if provided
  var modulePath = (types[req.resource.type] || req.resource).require;
  
  // skip without a module path
  if(!modulePath) return next(new Error('Resource does not have a require property.'));
  
  // require module
  var module = require(modulePath);
  
  // rewrite queries for references
  if(req.references && req.references.length && isIdentifier(req.references[0])) {
    // if the first reference is an id
    // rewrite the query to pull it
    req.query._id = req.references[0];
    req.one = true;
  }
  
  // end with the module as the finalware
  if(module.middleware || typeof module == 'function') {
    end(function (req, res, next) {
      if(typeof module == 'function') {
        module(req, res, next);
      } else{
        module.exec(req, function (err, data) {
          res.data = data;
          next();
        })
      }
    });
  } else {
    return next(new Error('The provided module is not supported'));
  }
  
  // continue
  next();
}