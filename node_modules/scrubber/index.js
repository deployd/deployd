exports.scrub = function (target, fn) {
  (function scrub(object, key, parent, type) {
    if(Array.isArray(object)) {
      object.forEach(function (val, i) {
        scrub(val, i, object);
      })
    } else if(typeof object == 'object') {   
      Object.keys(object).forEach(function (key) {
        scrub(object[key], key, object);
      })
    } else {    
      fn(object, key, parent, typeof object);
    }
  })(target)
}