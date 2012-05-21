/**
 * Dependencies
 */
 
var revalidator = require('revalidator')
  , propertyTypes = require('./property-types')
  , types = require('./types')
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
    , type = types[resource.type]
  ;
  
  // inherit types prior to validation
  if(type && type.properties && resource.properties) {
    Object.keys(type.properties).forEach(function (key) {
      !resource.properties[key] && (resource.properties[key] = type.properties[key]);
    })
  }
  
  // local should skip validation
  if(!req.isRemote) return next();
  
  // root can get anything
  if(req.method === 'GET' && req.isRoot) return next();
  
  // skip without a resource
  if(!resource) return next({error: 'Could not find a resource to validate.', status: 404});
  
  // default _id to current user when logging out
  if(!req.isRoot && resource.type === 'UserCollection' && req.url.indexOf('/logout') === req.url.lastIndexOf('/')) {
    if(!req.session) return next({status: 404});
    req.query._id = req.session._id;
    return next();
  }
  
  // if modifying data, require an id
  if(!req.isRoot && (req.method === 'PUT' || req.method === 'DELETE') && (!req.query || !req.query._id)) {
    return next({error: 'An _id must be included when modifying a resource.'});      
  }
  
  // if trying to write data
  if((method === 'POST' || method === 'PUT') && req.body && resource && resource.properties) {
    // sanitize data
    var keys = Object.keys(resource.properties);

    if (method === 'PUT') { keys = Object.keys(req.body); }

    keys.forEach(function (key) {

      if (!resource.properties[key]) { return; }

      if (req.body[key] === '') {
        sanitized[key] = null;
      } else if (resource.properties[key].type === 'number' && typeof req.body[key] === 'string') {
        var parsed = parseInt(req.body[key]);
        sanitized[key] = isNaN(parsed) ? req.body[key] : parsed;
      } else if (resource.properties[key].type === 'date' && req.body[key]) {
        try {
          sanitized[key] = new Date(req.body[key]).toISOString();
        } catch(e) {
          sanitized[key] = 'invalid date';
        }
      } else if (resource.properties[key].type === 'boolean' && !req.body[key]) {
        sanitized[key] = false;
      } else {
        sanitized[key] = req.body[key];
      }
      
    })
    
    // validate login separately
    if(resource.type === 'UserCollection' && req.url.indexOf('/login') === req.url.lastIndexOf('/')) {
      // explicitely sanitize login data
      sanitized = {
        email: req.body.email,
        password: req.body.password
      };

      return next();
    }
    
    // replace input with sanitized data
    req.body = req.data = sanitized;

    var revalidatorHash = {};
    Object.keys(sanitized).forEach(function (key) {
      if (!(resource.properties[key].optional && req.body[key] == null)) {
        var prop = {};
        var type = resource.properties[key].type;
        Object.keys(propertyTypes[type]).forEach(function(ruleKey) {
          prop[ruleKey] = propertyTypes[type][ruleKey];
        });
        if (!resource.properties[key].optional) {
          prop.required = true;
        }

        revalidatorHash[key] = prop;
      }
    });

    // validate JSON
    validation = revalidator.validate(req.body, {properties: revalidatorHash});
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
  // validation.validation = validation.errors;
  delete validation.valid;
  validation.errors = err;
  
  return validation;
}
