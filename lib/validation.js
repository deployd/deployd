/**
 * Dependencies
 */
 
var revalidator = require('revalidator');

/**
 * Validate the attached resource and request.
 */
 
module.exports = function (req, res, next) {
  var method = req.method
    , resource = req.resource
    , validation
    , err
  ;
  
  // root should skip validation
  if(req.isRoot) return next();
  
  // skip without a resource
  if(!resource) return next({error: 'Could not find a resource to validate.', status: 404});
  
  // if trying to write data
  if((method === 'POST' || method === 'PUT') && resource && resource.properties) {
    
    // validate JSON
    validation = revalidator.validate(req.body, resource);
    err = validation.valid ? err : validation;
  }
  
  // continue
  next(err);
}