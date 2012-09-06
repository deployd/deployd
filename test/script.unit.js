var Script = require('../lib/script');

describe('script', function(){
  describe('.run(ctx, fn)', function(done){
    it('should execute the script', function(done) {
      var s = new Script('2 + 2');
      s.run({}, done);
    });
    
    it('should always have access to cancel()', function(done) {
      var s = new Script('cancel()');
      s.run({}, function (e) {
        expect(e).to.exist;
        done();
      });
    });
    
    it('should have access to the current user if one exists', function(done) {
      var s = new Script('if(!me) throw "no user"');
      var session = {
        user: {name: 'foo'}
      };
      s.run({session: session}, done);
    });
  });
  
  describe('.run(ctx, domain, fn)', function(){
    it('should expose the domain directly to the script', function(done) {
      var s = new Script('if(!foo) throw "foo not passed"');
      s.run({}, {foo: 123}, done);
    });
  });
  
  describe('async', function(){
    it('should return after all callbacks are complete', function(done) {
      this.timeout(200);
      var s = new Script('setTimeout(function() { inc() }, 50)');
      var i = 0;
      function inc() {
        i++;
      }
      
      s.run({}, {setTimeout: setTimeout, inc: inc}, function () {
        expect(i).to.equal(1);
        done();
      });
    });
    
    it('should callback even an error occurs asynchronously', function(done) {
      var s = new Script('setTimeout(function() { throw "test err" }, 22)');
      
      s.run({}, {setTimeout: setTimeout}, function (e) {
        expect(e).to.exist;
        done();
      });
    });
    
    it('should return errors even when nested in objects', function(done) {
      var domain = {
        foo: {
          bar: {
            baz: function (fn) {
              setTimeout(function () {
                fn();
              }, 50);
              throw 'test error baz';
            }
          }
        }
      };
      
      var s = new Script('foo.bar.baz(function() {  })');
      
      s.run({}, domain, function (e) {
        expect(e).to.exist;
        
        done();
      });
      
      
    });
  });
});