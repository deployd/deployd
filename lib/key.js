/**
 * Generate deployd auth key using random bytes.
 */

exports.keygen = function () {
  var strength = Math.floor(Math.random() * 5) + 2
    , crypto = require('crypto')
    , key = {}
  ;
  
  
  try {
    while(strength--) {
      var hash = crypto.createHash('md5')
      key[Math.random().toString().substr(2, 3)] = hash.update(crypto.randomBytes(128)).digest('hex');
    }
  } catch(e) {  
    key[Math.random().toString().substr(2, 3)] = Math.random().toString().split('.')[1];
  }
  
  return key;
}