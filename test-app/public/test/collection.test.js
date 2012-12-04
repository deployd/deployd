/*global _dpd:false, $:false */
describe('Collection', function() {
  describe('dpd.todos', function() {
    it('should exist', function() {
      expect(dpd.todos).to.exist;
    });

    describe('dpd.on("createTodo", fn)', function() {
      it('should respond to a realtime event', function(done) {
        this.timeout(1500);
        dpd.socketReady(function() {
          dpd.once('createTodo', function(todo) {
            expect(todo).to.exist;
            expect(todo.title).to.equal('$REALTIME');
            done();
          });

          dpd.todos.post({title: '$REALTIME'});
        });
      });
    });

    describe('dpd.on("createTodo2", fn)', function() {
      it('should respond to a realtime event without a parameter', function(done) {
        dpd.socketReady(function() {
          dpd.once('createTodo2', function(todo) {
            expect(todo).to.not.exist;
            done();
          });

          dpd.todos.post({title: '$REALTIME2'});
        });
      });
    });
    
    describe('dpd.todos.on("changed", fn)', function() {
      it('should respond to the built-in changed event on post', function(done) {
        dpd.socketReady(function() {
          dpd.todos.once('changed', function() {
            done();
          });

          dpd.todos.post({title: 'changed - create'});
        });
      });
      
      it('should respond to the built-in changed event on put', function(done) {
        dpd.todos.post({title: 'changed - create'}, function(item) {
          dpd.socketReady(function() {
            dpd.todos.once('changed', function() {
              done();
            });
            
            dpd.todos.put(item.id, {title: 'changed - updated'});
          });
        });
      });
      
      it('should respond to the built-in changed event on del', function(done) {
        dpd.todos.post({title: 'changed - create'}, function(item) {
          dpd.socketReady(function() {
            dpd.todos.once('changed', function() {
              done();
            });
            
            dpd.todos.del(item.id);
          });
        });
      });
    });

    describe('.post({title: \'faux\'}, fn)', function() {
      it('should create a todo with an id', function(done) {
        dpd.todos.post({title: 'faux'}, function (todo, err) {
          expect(todo.id.length).to.equal(16);
          expect(todo.title).to.equal('faux');
          expect(err).to.not.exist;
          done();
        });
      });
      it('should create a todo that exists in the store', function(done) {
        dpd.todos.post({title: 'faux'}, function (todo, err) {
          expect(todo.id.length).to.equal(16);
          expect(todo.title).to.equal('faux');
          expect(err).to.not.exist;
          dpd.todos.get(todo.id, function(res, err) {
            if (err) return done(err);
            expect(res.title).to.equal('faux');
            done();
          });          
        });
      });
    });

    describe('.post({title: "notvalid"}, fn)', function() {
      it('should properly return an error', function(done) {
        dpd.todos.post({title: "notvalid"}, function(result, err) {
          expect(err).to.exist;
          expect(err.errors).to.exist;
          expect(err.errors.title).to.equal("Title must not be notvalid");
          done();
        });
      });
    });

    describe('.post({}, fn)', function() {
      it('should return a validation error', function(done) {
        dpd.todos.post({}, function(res, err) {
          expect(err).to.exist;
          expect(err.errors.title).to.be.ok;
          done();
        });
      });
    });

    describe('.post({message: "notvalid"}, fn)', function() {
      it('should properly return an error', function(done) {
        dpd.todos.post({message: "notvalid"}, function(result, err) {
          expect(err).to.exist;
          expect(err.errors).to.exist;
          expect(err.errors.message).to.equal("Message must not be notvalid");
          done();
        });
      });

      it('should not post the message', function(done) {
        chain(function(next) {
          dpd.todos.post({title: "$POSTERROR"}, next);
        }).chain(function(next, res, err) {
          expect(err).to.exist;
          expect(err.errors).to.exist;
          expect(err.errors.title).to.equal("POST error");
          dpd.todos.get(next);
        }).chain(function(next, res) {
          expect(res.length).to.equal(0);
          done();
        });
        
      });
    });

    describe('.post({title: "foo", owner: 7}, fn)', function() {
      it('should sanitize the owner due to incorrect type', function(done) {
        dpd.todos.post({title: "foo", owner: 7}, function (todo, err) {
          delete todo.id;
          expect(todo).to.eql({title: "foo", done: false});
          done();
        });
      });
    });

    describe('.post({title: "$TESTFAIL", fn)', function() {
      it('should correctly respond to errors in event IO', function(done) {
        dpd.todos.post({title: "$TESTFAIL"}, function(todo, err) {
          expect(todo.err).to.exist;
          done();
        });
      });
    });

    describe('.get(fn)', function() {
      it('should not return any cancelled objects', function(done) {
        chain(function(next) {
          dpd.todos.post({title: "This one is OK"}, next);
        }).chain(function(next, res, err) {
          if (err) return done(err);
          dpd.todos.post({title: "$GET_CANCEL"}, next);
        }).chain(function(next, res, err) {
          if (err) return done(err);
          dpd.todos.get(next);
        }).chain(function(next, res, err) {
          if (err) return done(err);
          expect(res.length).to.equal(1);
          expect(res[0].title).to.equal("This one is OK");
          done();
        });
      });
    });

    describe('.get({title: title}, fn)', function() {
      it('should return a single result', function(done) {
        var title = Math.random().toString();

        dpd.todos.post({title: title}, function () {
          dpd.todos.post({title: "Some other"}, function() {
            dpd.todos.get({title: title}, function (todos, err) {
              expect(todos.length).to.equal(1);
              done(err);
            });
          });
        });
      });
    });

    describe('.get({$sort: {title: 1}}, fn)', function() {
      it('should order by title', function(done) {
        chain(function(next) {
          dpd.todos.post({title: "C"}, next);
        }).chain(function(next) {
          dpd.todos.post({title: "A"}, next);
        }).chain(function(next) {
          dpd.todos.post({title: "B"}, next);
        }).chain(function(next) {
          dpd.todos.get({$sort: {title: 1}}, next);
        }).chain(function(next, result, err) {
          expect(result).to.exist;
          expect(result.length).to.equal(3);
          expect(result[0].title).to.equal("A");
          expect(result[1].title).to.equal("B");
          expect(result[2].title).to.equal("C");
          done(err);
        });
      });
    });

    describe('.get({id: {$ne: "..."}}, fn)', function() {
      it('should return all results that do not match the given id', function(done) {       
        var titleA = Math.random().toString()
          , titleB = Math.random().toString();

        dpd.todos.post({title: titleA}, function () {
          dpd.todos.post({title: titleB}, function () {
            dpd.todos.get({title: {$ne: titleA}}, function (todos, err) {
              expect(todos.length).to.equal(1);
              expect(todos[0].title).to.not.equal(titleA);
              var id = todos[0].id;
              dpd.todos.get({id: {$ne: id}}, function (todos, err) {
                expect(todos.length).to.equal(1);
                expect(todos[0].id).to.not.equal(id);
                done(err);
              });
            });
          });
        });
      });
    });
    
    describe('GET /full?boolean=true', function () {
      it('should filter boolean properties by query string', function(done) {
        dpd.full.post({boolean: true}, function (full) {
          dpd.full.post({boolean: false}, function(full){
            $.ajax({
              type: "GET",
              url: "/full?boolean=true",
              success: function (res) {
                expect(res.length).to.be.greaterThan(0);
                res.forEach(function(obj){
                  expect(obj.boolean).to.equal(true);  
                });
                done();
              },
              error: function (e) {
                done(e);
              }
            });
          });
        });
      });
    });

    describe('.get({id: "non existent"}, fn)', function() {
      it('should return a 404', function(done) {        
        var titleA = Math.random().toString()
          , titleB = Math.random().toString();

        dpd.todos.get({id: "non existent"}, function (todos, err) {
          expect(todos).to.not.exist;
          expect(err.message).to.equal('not found');
          expect(err.statusCode).to.equal(404);
          done();
        });
      });
    });

    describe('.get({title: "$TESTFAIL2"}, fn)', function() {
      it('should correctly respond to errors in event IO', function(done) {
        dpd.todos.post({title: "$FAIL2"}, function() {
          dpd.todos.post({title: "$TESTFAIL2"}, function() {
            dpd.todos.get({title: "$TESTFAIL2"}, function(todos, err) {
              expect(todos).to.exist;
              expect(todos[0].err).to.exist;
              done();
            });
          });
        });
      });
    });

    describe('.get(27, fn)', function() {
      it('should not hang if given a number as id', function(done) {
        dpd.todos.post({title: 'foobar'}, function () {
          dpd.todos.get(27, function (todos, err) {
            expect(err).to.exist;
            done();
          });
        });
      });
    });

    describe('.get({numberGet: true}, fn)', function() {
      it('should not hang if given a number as id', function(done) {
        dpd.todos.post({title: 'foobar'}, function () {
          dpd.todos.get({numberGet: true}, function (todos, err) {
            expect(todos.length).to.equal(1);
            expect(todos[0].numberGet).to.equal('noResponse');
            done(err);
          });
        });
      });
    });

    describe('.get({arbitrary: true}, fn)', function() {
      it('should allow arbitrary query parameters', function(done) {
        dpd.todos.post({title: 'foobar'}, function () {
          dpd.todos.get({arbitrary: true}, function (todos, err) {
            expect(todos.length).to.equal(1);
            expect(todos[0].custom).to.equal('arbitrary');
            done(err);
          });
        });
      });
      
      it('should run events when an id is included', function(done) {
        dpd.todos.post({title: 'foobar'}, function (todo) {
          dpd.todos.get({arbitrary: true, id: todo.id}, function (t) {
            expect(t.custom).to.equal('arbitrary');
            done();
          });
        });
      });
    });

    describe('.get(id, fn)', function() {
      it('should run events when an id is queried', function(done) {
        dpd.todos.post({title: 'foobar'}, function (todo) {
          dpd.todos.get(todo.id, function (t) {
            expect(t.custom).to.equal('custom');
            done();
          });
        });        
      });
    });

    describe('.put(id, {title: "todo 2"}, {done: true},  fn)', function() {
      it('should throw an error if the filter does not apply', function(done) {
        var todoId;
        chain(function(next) {
          dpd.todos.post({title: 'todo 1'}, next);
        }).chain(function(next, res, err) {
          if (err) return done(err);
          todoId = res.id;
          dpd.todos.put(todoId, {title: "todo 2"}, {done: true}, next);
        }).chain(function(next, res, err) {
          expect(err).to.exist;
          dpd.todos.get(todoId, next);
        }).chain(function(next, res, err) {
          expect(res.done).to.be['false'];
          done();
        });
      });
    });

    describe('.put(id, {done: true}, fn)', function() {
      it('should add properties', function(done) {
        chain(function(next) {
          dpd.todos.post({title: 'foobar'}, next);
        }).chain(function(next, result) {
          dpd.todos.put(result.id, {done: true}, next);
        }).chain(function(next, result) {
          expect(result.title).to.equal('foobar');
          expect(result.done).to.equal(true);
          dpd.todos.get(result.id, next);
        }).chain(function(next, result) {
          expect(result.title).to.equal('foobar');
          expect(result.done).to.equal(true);
          done();
        });
      });
    });

    describe('.put(id, {done: true}, fn)', function() {
      it('should be able to access old properties in On Put', function(done) {
        chain(function(next) {
          dpd.todos.post({title: '$PUT_TEST', message: "x"}, next);
        }).chain(function(next, result) {
          dpd.todos.put(result.id, {done: true}, next);
        }).chain(function(next, result) {
          expect(result.message).to.equal("xx");
          dpd.todos.get(result.id, next);
        }).chain(function(next, result) {
          expect(result.message).to.equal("xx");
          expect(result.done).to.equal(true);
          done();
        });
      });
    });

    describe('.put(id, {message: "notvalid"}, fn)', function() {
      it('should cancel the update', function(done) {
        var todoId;
        chain(function(next) {
          dpd.todos.post({title: "Some todo"}, next);
        }).chain(function(next, res, err) {
          if (err) return done(err);
          todoId = res.id;
          dpd.todos.put(todoId, {message: "notvalid"}, next);
        }).chain(function(next, res, err) {
          expect(err).to.exist;
          expect(err.errors).to.exist;
          expect(err.errors.message).to.equal("Message must not be notvalid");
          dpd.todos.get(todoId, next);
        }).chain(function(next, res, err) {
          if (err) return done(err);
          expect(res.message).to.not.equal("notvalid");
          done();
        });
      });
    });

    describe('.put(id, {message: "notvalidput"}, fn)', function() {
      it('should cancel the update', function(done) {
        var todoId;
        chain(function(next) {
          dpd.todos.post({title: "Some todo"}, next);
        }).chain(function(next, res, err) {
          if (err) return done(err);
          todoId = res.id;
          dpd.todos.put(todoId, {message: "notvalidput"}, next);
        }).chain(function(next, res, err) {
          expect(err).to.exist;
          expect(err.errors).to.exist;
          expect(err.errors.message).to.equal("message should not be notvalidput");
          dpd.todos.get(todoId, next);
        }).chain(function(next, res, err) {
          if (err) return done(err);
          expect(res.message).to.not.equal("notvalidput");
          done();
        });
      });
    });

    describe('.put(id, {done: true}, fn)', function() {
      it('should be able to access old properties in On Validate', function(done) {
        chain(function(next) {
          dpd.todos.post({title: '$VALIDATE_TEST', message: ""}, next);
        }).chain(function(next, result) {
          expect(result.message).to.equal("x");
          dpd.todos.put(result.id, {done: true}, next);
        }).chain(function(next, result) {
          expect(result.message).to.equal("xx");
          dpd.todos.get(result.id, next);
        }).chain(function(next, result) {
          expect(result.message).to.equal("xx");
          expect(result.done).to.equal(true);
          done();
        });
      });
    });

    describe('.put(id, {tags: ["red", "blue"]}, fn)', function() {
      it('should set an array', function(done) {
        chain(function(next) {
          dpd.todos.post({title: 'foobar'}, next);
        }).chain(function(next, result) {
          dpd.todos.put(result.id, {tags: ["red", "blue"]}, next);
        }).chain(function(next, result) {
          expect(result.tags).to.exist;
          expect(result.tags.length).to.equal(2);
          expect(result.tags).to.include("red").and.include("blue");
          dpd.todos.get(result.id, next);
        }).chain(function(next, result) {
          expect(result.tags).to.exist;
          expect(result.tags.length).to.equal(2);
          expect(result.tags).to.include("red").and.include("blue");
          done();
        });
      });
    });

    describe('.put(id, {tags: {$push: "red"}}, fn)', function() {
      it('should update an array', function(done) {
        chain(function(next) {
          dpd.todos.post({title: 'foobar', tags: ['blue']}, next);
        }).chain(function(next, result) {
          dpd.todos.put(result.id, {tags: {$push: "red"}}, next);
        }).chain(function(next, result) {
          expect(result.tags.length).to.equal(2);
          expect(result.tags).to.include("red").and.include("blue");
          done();
        });
      });

      it('should update an empty array', function(done) {
        chain(function(next) {
          dpd.todos.post({title: 'foobar'}, next);
        }).chain(function(next, result) {
          dpd.todos.put(result.id, {tags: {$push: "red"}}, next);
        }).chain(function(next, result) {
          expect(result.tags.length).to.equal(1);
          expect(result.tags).to.include("red");
          done();
        });
      });
    });

    describe('.put(id, {tags: {$pushAll: ["red", "yellow"]}}, fn)', function() {
      it('should update an array', function(done) {
        chain(function(next) {
          dpd.todos.post({title: 'foobar', tags: ['blue']}, next);
        }).chain(function(next, result) {
          dpd.todos.put(result.id, {tags: {$pushAll: ["red", "yellow"]}}, next);
        }).chain(function(next, result) {
          expect(result.tags.length).to.equal(3);
          expect(result.tags).to.include("red").and.include("blue").and.include("yellow");
          done();
        });
      });
    });

    describe('.put(id, tags: {$pull: "red"}, fn)', function() {
      it('should remove an item from an array', function(done) {
        chain(function(next) {
          dpd.todos.post({title: 'foobar', tags: ['red', 'blue']}, next);
        }).chain(function(next, result) {
          dpd.todos.put(result.id, {tags: {$pull: "red"}}, next);
        }).chain(function(next, result) {
          expect(result.tags.length).to.equal(1);
          expect(result.tags).to.include("blue");
          done();
        });
      });
    });

    describe('.put(id, tags: {$pullAll: ["red", "blue"]}, fn)', function() {
      it('should remove multiple items from an array', function(done) {
        chain(function(next) {
          dpd.todos.post({title: 'foobar', tags: ['red', 'blue', 'yellow']}, next);
        }).chain(function(next, result) {
          dpd.todos.put(result.id, {tags: {$pullAll: ["red", "blue"]}}, next);
        }).chain(function(next, result) {
          expect(result.tags.length).to.equal(1);
          expect(result.tags).to.include("yellow");
          done();
        });
      });
    });
    
    describe('.put({done: true})', function(){
      it('should not update multiple items', function(done) {
        chain(function(next) {
          dpd.todos.post({title: 'foo'}, next);
        }).chain(function(next) {
          dpd.todos.post({title: 'bar'}, next);
        }).chain(function(next, result) {
          dpd.todos.put({done: true}, function (res, err) {
            expect(err).to.exist;
            done();
          });
        });
      });
    });

    afterEach(function (done) {
      this.timeout(10000);
      cleanCollection(dpd.todos, done);
    });

  });

  describe('issue 76', function() {
    it('should prevent unauthorized post', function(done) {
      chain(function(next) {
        dpd.todos.post({title: "$REQUIRE_AUTH"}, next);
      }).chain(function(next, res, err) {
        expect(err).to.exist;
        done();
      });
    });

    it('should allow logged in user to post', function(done) {
      chain(function(next) {
        dpd.users.post({username: 'foo', password: 'bar'}, next);
      }).chain(function(next) {
        dpd.users.login({username: 'foo', password: 'bar'}, next);
      }).chain(function(next) {
        dpd.todos.post({title: "$REQUIRE_AUTH"}, next);
      }).chain(function(next, res, err) {
        expect(err).to.not.exist;
        expect(res.title).to.equal("$REQUIRE_AUTH");
        done();
      });
    });

    it('should allow logged in user to post after second try', function(done) {
      chain(function(next) {
        dpd.users.post({username: 'foo', password: 'bar'}, next);
      }).chain(function(next) {
        dpd.users.login({username: 'foo', password: 'bar'}, next);
      }).chain(function(next) {
        dpd.todos.post({title: "$REQUIRE_AUTH"}, next);
      }).chain(function(next) {
        dpd.todos.post({title: "$REQUIRE_AUTH"}, next);
      }).chain(function(next, res, err) {
        expect(err).to.not.exist;
        expect(res.title).to.equal("$REQUIRE_AUTH");
        done();
      });
    });


    afterEach(function(done) {
      this.timeout(10000);
      dpd.users.logout(function() {
        cleanCollection(dpd.users, function() {
          cleanCollection(dpd.todos, done);
        });  
      });
    });
  });

  describe('internal cancel()', function(){
    it('should not cancel the internal call', function(done) {
      dpd.todos.post({title: '$CANCEL_TEST'}, function (todo) {
        expect(todo.err).to.not.exist;
        dpd.todos.get({title: '$INTERNAL_CANCEL_TEST'}, function (todos) {
          expect(todos.length).to.equal(1);
          done();
        });
      });
    });


    
    afterEach(function (done) {
      this.timeout(10000);
      cleanCollection(dpd.todos, done);
    });
  });

  describe('events', function() {
    describe('cancelIf()', function() {
      it('should cancel', function(done) {
        dpd.todos.post({title: "$CANCEL_IF_TEST"}, function(todo, err) {
          expect(err).to.exist;
          expect(err.message).to.equal("Cancel if");
          done();
        });
      });
    });

    describe('cancelUnless()', function() {
      it('should cancel', function(done) {
        dpd.todos.post({title: "$CANCEL_UNLESS_TEST"}, function(todo, err) {
          expect(err).to.exist;
          expect(err.message).to.equal("Cancel unless");
          done();
        });
      });
    });

    describe('hasErrors()', function() {
      it('should cancel', function(done) {
        dpd.todos.post({title: "$HAS_ERRORS_TEST"}, function(todo, err) {
          expect(err).to.exist;
          expect(err.errors.hasErrors).to.equal("Yep");
          expect(err.errors.otherError).to.exist;
          done();
        });
      });
    });

    describe('errorIf()', function() {
      it('should error', function(done) {
        dpd.todos.post({title: "$ERROR_IF_TEST"}, function(todo, err) {
          expect(err).to.exist;
          expect(err.errors).to.exist;
          expect(err.errors.errorIf).to.equal("Yep");
          done();
        });
      });
    });

    describe('errorUnless()', function() {
      it('should error', function(done) {
        dpd.todos.post({title: "$ERROR_UNLESS_TEST"}, function(todo, err) {
          expect(err).to.exist;
          expect(err.errors).to.exist;
          expect(err.errors.errorUnless).to.equal("Yep");
          done();
        });
      });
    });
  });

  describe('root', function() {
    afterEach(function(done) {
      _dpd.ajax.headers = {};
      cleanCollection(dpd.todos, done);
    });

    describe('dpd-ssh-key', function() {
      beforeEach(function() {
        _dpd.ajax.headers = {
          'dpd-ssh-key': true
        };
      });

      it('should detect root', function(done) {
        chain(function(next) {
          dpd.todos.post({title: 'valid'}, next);
        }).chain(function(next, res, err) {
          if (err) return done(err);
          expect(res.isRoot).to.equal(true);
          done();
        });
      });

      it('should allow skipping events', function(done) {
        chain(function(next) {
          dpd.todos.post({title: 'notvalid', $skipEvents: true}, next);
        }).chain(function(next, res, err) {
          if (err) return done(err);
          expect(res.title).to.equal('notvalid');
          done();
        });
      });

      it('should allow skipping events on get', function(done) {
        var id;
        chain(function(next) {
          dpd.todos.post({title: '$GET_CANCEL'}, next);
        }).chain(function(next, res, err) {
          if (err) return done(err);
          id = res.id;
          dpd.todos.get(id, {$skipEvents: true}, next);
        }).chain(function(next, res, err) {
          if (err) return done(err);
          expect(res.title).to.equal("$GET_CANCEL");
          done();
        });
      });
    });

    it('should not allow skipping events', function(done) {
      chain(function(next) {
        dpd.todos.post({title: 'notvalid', $skipEvents: true}, next);
      }).chain(function(next, res, err) {
        expect(err).to.exist;
        expect(err.errors).to.exist;
        done();
      });
    });

    it('should not detect root', function(done) {
      chain(function(next) {
        dpd.todos.post({title: 'valid'}, next);
      }).chain(function(next, res, err) {
        if (err) return done(err);
        expect(res.isRoot).to.not.exist;
        done();
      });
    });

  });

  describe('dpd.recursive', function() {
    beforeEach(function(done) {
      dpd.recursive.post({name: "dataception"}, function(res) {
        done();
      });
    });

    it('should only go two levels deep', function(done) {
      this.timeout(1000);
      dpd.recursive.get(function(result, err) {
        var obj = result[0];
        expect(result.length).to.equal(1);
        expect(obj).to.exist;

        expect(obj.more).to.exist;
        expect(obj.more[0]).to.exist;
        expect(obj.more[0].more).to.exist;
        expect(obj.more[0].more[0]).to.exist;
        expect(obj.more[0].more[0].more).to.not.exist;
        done(err);
      });
    });

    it('should be customizable', function(done) {
      this.timeout(1000);
      dpd.recursive.get({$limitRecursion: 10}, function(result, err) {
        var obj = result[0];
        expect(result.length).to.equal(1);
        expect(obj).to.exist;
        expect(obj.more).to.exist;

        var current = obj.more[0];
        for (var i = 0; i < 9; i++) {
          expect(current).to.exist;
          expect(current.more).to.exist;
          current = current.more[0];
        }
        expect(current.more).to.not.exist;
        done(err);
      });
    });

    it('should not change a query', function(done) {
      this.timeout(1000);
      chain(function(next) {
        dpd.recursive.post({name: "test2"}, next);
      }).chain(function(next) {
        dpd.recursive.post({name: "test3"}, next);
      }).chain(function(next) {
        dpd.recursive.get({$limitRecursion: 10, mode: "self"}, next);
      }).chain(function(next, res, err) {
        if (err) return done(err);
        expect(res.length).to.equal(3);
        res.forEach(function(x) {
          var self = x.self;
          expect(self).to.exist;
          expect(self.name).to.equal(x.name);
          expect(self.id).to.equal(x.id);
          expect(self.randQuery).to.equal(x.rand);
        });
        done();
      });
    });

    afterEach(function (done) {
      this.timeout(10000);
      cleanCollection(dpd.recursive, done);
    });
  });

  describe('dpd.empty', function() {
    describe('.get(fn)', function() {
      it('should return an empty array', function(done) {
        dpd.empty.get(function(result) {
          expect(result).to.eql([]);
          done();
        });
      });
    });
    
    describe('cancel()', function(){
      it('should cancel when POSTing', function(done) {
        dpd.empty.post({}, function (item, err) {
          expect(err).to.exist;
          expect(err.message).to.equal('testing cancel');
          done();
        });
      });
    });
    
    afterEach(function (done) {
      this.timeout(10000);
      cleanCollection(dpd.empty, done);
    });
  });

  describe('changed()', function(){
    it('should detect when a value has changed', function(done) {
      dpd.changed.post({name: 'original'}, function (c) {
        dpd.changed.put(c.id, {name: 'first name change'}, function (c) {
          if(c.name !== 'saw first name changed previous original') {
            throw Error('missed name change');
          }
          done();
        });
      });
    });
    
    it('should not return true when a value has not changed', function(done) {
      dpd.changed.post({name: '$NO_CHANGE'}, function (c) {
        dpd.changed.put(c.id, {name: '$NO_CHANGE'}, function (c) {
          if(c.name != '$NO_CHANGE') {
            throw new Error('incorrect name change');
          }
          done();
        });
      });
    });
    
    afterEach(function (done) {
      this.timeout(10000);
      cleanCollection(dpd.changed, done);
    });
  });

  
});
