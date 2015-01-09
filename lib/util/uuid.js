var crypto = require('crypto');

// Modified RFC 4122 v4 UUID
exports.create = function (length) {
  length = length || 16;
  var hexDigits = "0123456789abcdef";
  var s = crypto.randomBytes(length).toString('hex').split(''); // convert string to array
  s.length = length; // trim to length if bigger
    
  s[length - 3] = hexDigits.substr((s[length - 3] & 0x3) | 0x8, 1);

  // return the uuid
  return s.join('');
};