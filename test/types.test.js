var expect = require('chai').expect
  , client = require('../lib/client').use('http://localhost:3003')
  , dpd = require('../')
  , server = dpd('My Todo App')
  , types = client.use('/types')
;

describe('GET /types', function(){
  it('should respond with a list of resource definitions', function(done) {
    types.get(function (err, types) {
      expect(types).to.eql({
        Collection: {
          defaultPath: '/my-objects'
        },
        UserCollection: {
          label: 'Users Collection',
          defaultPath: '/users'
        }
      });
      
      done(err);
    })
  })
})