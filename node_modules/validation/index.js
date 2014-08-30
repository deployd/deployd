/**
 * Validates the given value against the specified type.
 * 
 * Examples:
 * 
 *     validation.isType('foobar', 'string')
 *     validation.isType(7, 'number')
 *     validation.isType(true, 'boolean')
 *     validation.isType(new Date().getTime(), 'date')
 *     validation.isType({}, 'object')
 *     validation.isType([], 'array')
 * 
 */
 
exports.isType = function (value, type) {
  if(typeof type != 'string') throw Error('bad arguments when calling validation.isValid');
  
  switch(type) {
    case 'date':
      if(!value) return false;
      try {
        value = new Date(value);
      } catch(e) {
        return false;
      }
    
      return value instanceof Date && isFinite(value);
    break;
    case 'object':
      return !!(value && toString.call(value) === '[object Object]' && 'isPrototypeOf' in value);
    break;
    case 'array':
      return Array.isArray(value);
    break;
    case 'number':
      if(value === Infinity || isNaN(value)) return false;
    default:
      return typeof value == type;
    break;
  }
}

/**
 * Validates the value exists.
 * 
 * Examples:
 * 
 *     validation.exists('foobar')  // true
 *     validation.exists(0)         // true
 *     validation.exists(null)      // false
 *     validation.exists(undefined) // false
 * 
 */

exports.exists = function (value) {
  return !!(value || value === 0);
}