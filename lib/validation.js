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
  
  // skip without a resource
  if(!resource) return next(new Error('validation 404'));
  
  // if trying to write data
  if((method === 'POST' || method === 'PUT') && resource && resource.settings) {
    
    // validate
    validation = revalidator.validate(req.body, {properties: resource.settings});
    console.log(validation);
    err = validation.valid ? err : validation;
  }
  
  // continue
  next(err);
}