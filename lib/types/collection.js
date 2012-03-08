function format(name) {
  name = name.toLowerCase().replace(/\W/g, '-').replace(/--+/g, '');
  return '/' + name;
}

var storage = require('../storage');

module.exports = storage;