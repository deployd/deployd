var Collection = require('./collection')
  , users = new Collection()
;

users.collection = 'users';

console.log(users);

module.exports = users;