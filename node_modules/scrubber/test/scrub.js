var scrub = require('../').scrub
  , expect = require('chai').expect;

describe('scrubber', function(){
  describe('.scrub(target, fn)', function(){
    
    it('should recurse through every value', function() {
      var sum = {
        a: [1],
        b: {
          c: [2],
          d: {
            e: [3],
            f: {
              g: [4]
            }
          }
        }
      }

      var total = 0

      scrub(sum, function(obj, key, parent, type) {
        if(type == 'number') {
          total += obj
        }
      })
      
      expect(total).to.equal(10);
    })
  })
})