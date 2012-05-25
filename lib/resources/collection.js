/**
 * Dependencies
 */

var validation = require('validation');
 
function Collection(settings, req, res) {
  this.req = req;
  this.res = res;
  this.properties = settings.properties;
}

Collection.prototype.authorize = function () {
  var req = this.req
    , query = req.query;
  
  if(req.user && req.user.root) return;
  if(!(query && query._id)) {
    switch(req.method) {
      case 'PUT':
      case 'DELETE':
        return 'An _id must be included when modifying a Collection.';
      break;
    }
  }
}

Collection.prototype.validate = function (body) {
  var keys = Object.keys(this.properties)
    , props = this.properties
    , errors = {};
    
  keys.forEach(function (key) {
    var prop = props[key]
      , val = body[key]
      , type = prop.type || 'string';
    
    if(validation.exists(val)) {
      if(!validation.isType(val, type)) {
        errors[key] = 'must be a ' + type;
      }
    } else if(prop.required) {
      errors[key] = 'is required';
    }
  });
  
  if(Object.keys(errors).length) return errors;
}

Collection.prototype.sanitize = function (body) {
  var sanitized = {}
    , props = this.properties
    , keys = Object.keys(props);

  keys.forEach(function (key) {
    var prop = props[key]
    , expected = prop.type
    , val = body[key]
    , actual = typeof val;

    // skip properties that dont exist
    if(!prop) return;

    if(expected == actual) {
      sanitized[key] = val;
    } else if(expected == 'number' && actual == 'string') {
      sanitized[key] = parseInt(val);
    }
  });
  
  return sanitized;
}

/**
 * Export
 */
 
module.exports = Collection;