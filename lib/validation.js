/**
 * Dependencies
 */
 
var revalidator = require('revalidator')
  , isIdentifier = require('./storage').isIdentifier
;

/**
 * Validate the attached resource and request.
 */
 
module.exports = function (req, res, next) {
  var method = req.method
    , resource = req.resource
    , validation
    , err
    , sanitized = {}
  ;
  
  // rewrite queries from references
  if(req.references && req.references.length && isIdentifier(req.references[0])) {
    // if the first reference is an id
    // rewrite the query to pull it
    req.query._id = req.references[0];
    req.one = true;
  }
  
  // root (or local) should skip validation
  if(req.isRoot || !req.isRemote) return next();
  
  // skip without a resource
  if(!resource) return next({error: 'Could not find a resource to validate.', status: 404});
  
  // if modifying data, require an id
  if((req.method === 'PUT' || req.method === 'DELETE') && (!req.query || !req.query._id)) {
    return next({error: 'An _id must be included when modifying a resource.'});      
  }
  
  // if trying to write data
  if((method === 'POST' || method === 'PUT') && req.body && resource && resource.properties) {
    // sanitize data
    Object.keys(resource.properties).forEach(function (key) {
      sanitized[key] = req.body[key];
    })
    
    // replace input with sanitized data
    req.body = req.data = sanitized;
    
    // validate JSON
    validation = revalidator.validate(req.body, resource);
    err = validation.valid ? err : transform(validation);
    
    next(err);
  } else {
    // continue
    next(err);
  }

}

/**
 * Transform revalidator errors into human redable errors.
 */

function transform(validation) {
  var err = {}
    , errors = validation.errors
    , e
    , prop
  ;
  
  for(var i = 0, len = errors.length; i < len; i++) {
    e = errors[i];
    prop = e.property;
    
    switch(e.attribute) {
      case 'type':
        err[prop] = 'must be a ' + e.expected;
      break;
      case 'required':
        err[prop] = 'is required';
      break;
      default:
        err[prop] = 'is not valid'
      break;
    }
  }
  
  // rename and add human readable errors
  validation.validation = validation.errors;
  validation.errors = err;
  
  return validation;
}
