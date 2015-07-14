var Script = require('../lib/script');
    ayepromise = require('../clib/ayepromise');

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

    it('should keep error intact when calling cancel(err)', function(done) {
      var s = new Script('cancel(new Error("test"))');
      s.run({}, function (e) {
        expect(e).to.exist;
        expect(e.message).to.equal('test');
        done();
      });
    });

    it('should keep object intact when calling cancel({message: , status: })', function(done) {
      var s = new Script('cancel({message: "test", status: 404})');
      s.run({}, function (e) {
        expect(e).to.exist;
        expect(e.message).to.equal('test');
        expect(e.statusCode).to.equal(404); // status is turned into statusCode
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

    it('should not change null to empty object', function (done) {
      var s = new Script('if(previous.foo !== null) throw "foo was " + JSON.stringify(previous.foo)');
      s.run({}, { previous: { foo: null } }, done);
    });

    it('should not be slow and leak memory', function (done) {
      var s = new Script('if(!foo) throw "foo not passed"');
      var time = Date.now();
      var numDone = 0;
      for (var i = 0; i < 15000; i++) {
        s.run({ }, { foo: 123 }, function() {
          numDone++;
          if (numDone >= 15000) {
            done();
          }
        });
      }
    });

    it('should callback with error on script syntax error', function (done) {
      var s = new Script('if(!foo throw "foo not passed"');
      s.run({ }, { foo: 123 }, function (err) {
        expect(err.name).to.equal("SyntaxError");
        done();
      });
    });
  });

  describe('async', function(){
    it('should allow manual callback counting', function(done) {
      this.timeout(200);
      var s = new Script('$addCallback(); async(function() { setTimeout(function() { inc(); $finishCallback(); }, 20); }, 20)');
      var i = 0;
      function inc() {
        i++;
      }

      s.run({}, {async: function(fn){
        setTimeout(fn, 50);
      }, inc: inc}, function () {
        expect(i).to.equal(1);
        done();
      });
    });

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

  describe('promises', function(){
    it('should resolve after promise is resolved', function(done) {
      this.timeout(200);
      var s = new Script('var p = aye.defer(); p.promise.then(inc); setTimeout(p.resolve, 10)');
      var i = 0;
      function inc() {
        i++;
      }

      s.run({}, {aye: ayepromise, setTimeout: setTimeout, inc: inc}, function () {
        expect(i).to.equal(1);
        done();
      });
    });

    it('should reject after promise is rejected', function(done) {
      this.timeout(200);
      var s = new Script('var p = aye.defer(); p.promise.then(function() {}, inc); setTimeout(p.reject, 10)');
      var i = 0;
      function inc() {
        i++;
      }

      s.run({}, {aye: ayepromise, setTimeout: setTimeout, inc: inc}, function () {
        expect(i).to.equal(1);
        done();
      });
    });

    it('should resolve after nested promises is resolved and outer promise is resolved', function(done) {
      this.timeout(200);
      var s = new Script('var p = aye.defer(), p2 = aye.defer(); p.promise.then(function() { return p2.promise; }).then(inc); setTimeout(p.resolve, 22); setTimeout(p2.resolve, 44);');
      var i = 0;
      function inc() {
        i++;
      }

      s.run({}, {aye: ayepromise, setTimeout: setTimeout, inc: inc}, function () {
        expect(i).to.equal(1);
        done();
      });
    });

    it('should reject after nested promises is rejected and outer promise is resolved', function(done) {
      this.timeout(200);
      var s = new Script('var p = aye.defer(), p2 = aye.defer(); p.promise.then(function() { return p2.promise; }).then(function() {}, inc); setTimeout(p.resolve, 22); setTimeout(p2.reject, 44);');
      var i = 0;
      function inc() {
        i++;
      }

      s.run({}, {aye: ayepromise, setTimeout: setTimeout, inc: inc}, function () {
        expect(i).to.equal(1);
        done();
      });
    });

    it('should reject after nested promises is resolved and outer promise is rejected', function(done) {
      this.timeout(200);
      var s = new Script('var p = aye.defer(), p2 = aye.defer(); p.promise.then(function() { return p2.promise; }).then(function() {}, inc); setTimeout(p.reject, 22); setTimeout(p2.resolve, 44);');
      var i = 0;
      function inc() {
        i++;
      }

      s.run({}, {aye: ayepromise, setTimeout: setTimeout, inc: inc}, function () {
        expect(i).to.equal(1);
        done();
      });
    });

    it('should reject after nested promises is rejected and outer promise is rejected', function(done) {
      this.timeout(200);
      var s = new Script('var p = aye.defer(), p2 = aye.defer(); p.promise.then(function() { return p2.promise; }).then(function() {}, inc); setTimeout(p.reject, 22); setTimeout(p2.reject, 44);');
      var i = 0;
      function inc() {
        i++;
      }

      s.run({}, {aye: ayepromise, setTimeout: setTimeout, inc: inc}, function () {
        expect(i).to.equal(1);
        done();
      });
    });
  });
});
