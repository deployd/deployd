function basic(validator) {
  return function(val) {
    // by default, values are optional
    if(typeof val === 'undefined') return true;
     
    return validator.apply(this, arguments);
  }
}

var validators = {
	
	object: basic(function(val) {
    return 'object' === typeof val;
	}),
	
  string: basic(function(val) {
    return 'string' === typeof val;
  }),

  number: basic(function(val) {
    return 'number' === typeof val;
  }),
  
  array: basic(function(val) {
    return Array.isArray(val);
  }),
  
  'boolean': basic(function(val) {
    return 'boolean' === typeof val;
  }),
  
  binary: basic(function(val) {
    return 'string' === typeof val;
  }),
  
  date: basic(function(val) {
    return 'string' === typeof val;
  }),
  
  password: function(val, error) {
    if(!val) error('Password is required', 'Validation');
    return 'string' === typeof val;
  },
  
  email: basic(function(val) {
    return 'string' === typeof val;
  }),
  
  range: basic(function(val) {
    return 'number' === typeof val;
  })
  
};

// source can be a String, a validator Function(val), or an Object with a 'type'
exports.compile = function(source) {
  var sourceType = typeof source
    , type = sourceType === 'string' ? source : source && source.type
    , validator = sourceType === 'function' ? source : validators[type]
    , required = sourceType === 'object' && source.required
  ;
  
  if(required) {
    return function(val, error) {
      if(!val) error('{key} is required', 'Validation');
      return false;
    }
  }
  
  return validator || function() {};
}