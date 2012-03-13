module.exports = {
  
  Static: {
    defaultPath: '/my-files',
    require: './types/static'
  },
  
  Collection: {
    defaultPath: '/my-objects',
    require: './types/collection'
  },
  
  UserCollection: {
    label: 'Users Collection',
    defaultPath: '/users',
    require: './types/user-collection',
    properties: {
      email: {
        description: 'the unique email of the user',
        type: 'string',
        pattern: "[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?",
        required: true,
        unique: true,
        minLength: 5,
        order: 0
      },
      password: {
        description: "the user's password",
        type: 'string',
        required: true,
        minLength: 5,
        order: 1
      }
    }
  }
  
};