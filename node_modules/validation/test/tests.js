var validation = require('../')
  , expect = require('chai').expect;

describe('validation', function() {
  describe('.isValid(value, description)', function () {
    function example(type, value, valid) {
      var v = validation.isType(value, type);
      if(v != valid) {
        console.log(type, value, valid, v);
      }
      expect(v).to.equal(valid);
    }
    
    it('should validate the given property as a number', function() {
      example('number', 10, true);
      example('number', 1, true);
      example('number', 100000000000000000, true);
      example('number', -10000000000000000, true);
      example('number', Infinity, false);
      example('number', '10', false);
      example('number', '10.0', false);
      example('number', "10", false);
      example('number', new Date(), false);
      example('number', {}, false);
      example('number', null, false);
      example('number', undefined, false);
      example('number', /hello/, false);
      example('number', NaN, false);
    })
    
    it('should validate the given property as a string', function() {
      example('string', 'test', true);
      example('string', "another test", true);
      example('string', 'Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.', true);
      example('string', '<html>', true);
      example('string', 1, false);
      example('string', {}, false);
      example('string', null, false);
      example('string', undefined, false);
      example('string', new Date(), false);
      example('string', function() {}, false);
      example('string', NaN, false);
    })
    
    it('should validate the given property as a date', function() {
      example('date', new Date(), true);
      example('date', new Date().toString(), true);
      example('date', new Date().getTime(), true);
      example('date', new Date(Infinity), false);
      example('date', 'blah', false);
      example('date', /regex/, false);
      example('date', function() {}, false);
      example('date', null, false);
      example('date', undefined, false);
      example('date', NaN, false);
    })
    
    it('should validate the given property as a boolean', function() {
      example('boolean', true, true);
      example('boolean', false, true);
      example('boolean', 0, false);
      example('boolean', 1, false);
      example('boolean', 'true', false);
      example('boolean', 'false', false);
      example('boolean', null, false);
    })
    
    it('should validate the given property as an object', function() {
      example('object', {}, true);
      example('object', {length: 7}, true);
      example('object', {foo: 'bar'}, true);
      example('object', [], false);
      example('object', '{}', false);
      example('object', function() {}, false);
      example('object', undefined, false);
      example('object', null, false);
      example('object', NaN, false);
      example('object', 'foo', false);
      example('object', /test/, false);
      example('object', Infinity, false);
      example('object', Array, false);
    })
    
    it('should validate the given property as an array', function() {
      example('array', [], true);
      example('array', [1,2,3], true);
      example('array', {length: 7}, false);
      example('array', {}, false);
      example('array', arguments, false);
    })
    
    it('should validate the given property exists', function() {
      function required(value, exists) {
        var e = validation.exists(value);
        expect(e).to.equal(exists);
      }
      
      required('foobar', true);
      required(function() {}, true);
      required(-1, true);
      required(0.000000000000000000000001, true);
      required(/foo/, true);
      required(null, false);
      required(undefined, false);
      required(NaN, false);
      required(NaN, false);
      required(0, true);
    })
  })
})


