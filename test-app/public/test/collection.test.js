describe('Collection', function() {
  describe('dpd.todos', function() {
    it('should exist', function() {
      expect(dpd.todos).to.exist
    })

    describe('dpd.on("createTodo", fn)', function() {
      it('should respond to a realtime event', function(done) {
        this.timeout(1500);
        dpd.on('createTodo', function(todo) {
          expect(todo).to.exist;
          expect(todo.title).to.equal('$REALTIME');
          done();
        });

        dpd.todos.post({title: '$REALTIME'});
      })
    })

    describe('dpd.on("createTodo2", fn)', function() {
      it('should respond to a realtime event without a parameter', function(done) {
        dpd.on('createTodo2', function(todo) {
          expect(todo).to.not.exist;
          done();
        });

        dpd.todos.post({title: '$REALTIME2'});
      })
    })
    
    describe('dpd.todos.on("changed", fn)', function() {
      it('should respond to the built-in changed event on post', function(done) {
        dpd.todos.on('changed', function() {
          done();
        });

        dpd.todos.post({title: 'changed - create'});
      })
      
      it('should respond to the built-in changed event on put', function(done) {
        dpd.todos.post({title: 'changed - create'}, function(item) {
          dpd.todos.on('changed', function() {
            done();
          });
          
          dpd.todos.put(item.id, {title: 'changed - updated'});
        });
      })
      
      it('should respond to the built-in changed event on del', function(done) {
        dpd.todos.post({title: 'changed - create'}, function(item) {
          dpd.todos.on('changed', function() {
            done();
          });
          
          dpd.todos.del(item.id);
        });
      })
    })

    describe('.post({title: \'faux\'}, fn)', function() {
      it('should create a todo with an id', function(done) {
        dpd.todos.post({title: 'faux'}, function (todo, err) {
          expect(todo.id.length).to.equal(16)
          expect(todo.title).to.equal('faux')
          expect(err).to.not.exist
          done()
        })
      })
    })

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
    });

    describe('.post({title: "foo", owner: 7}, fn)', function() {
      it('should sanitize the owner due to incorrect type', function(done) {
        dpd.todos.post({title: "foo", owner: 7}, function (todo, err) {
          delete todo.id;
          expect(todo).to.eql({title: "foo", done: false});
          done()
        })
      })
    })

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
        })
      })
    })

    describe('.get({title: title}, fn)', function() {
      it('should return a single result', function(done) {
        var title = Math.random().toString();

        dpd.todos.post({title: title}, function () {
          dpd.todos.post({title: "Some other"}, function() {
            dpd.todos.get({title: title}, function (todos, err) {
              expect(todos.length).to.equal(1);
              done(err);
            })  
          })
        })
      })
    })

    describe('.get({$sort: {title: 1}}, fn)', function() {
      it('should order by title', function(done) {
        chain(function(next) {
          dpd.todos.post({title: "C"}, next);
        }).chain(function(next) {
          dpd.todos.post({title: "A"}, next);
        }).chain(function(next) {
          dpd.todos.post({title: "B"}, next);
        }).chain(function(next) {
          dpd.todos.get({$sort: {title: 1}}, next)
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
              })
            })
          })
        })
      })
    })

    describe('.get({id: "non existent"}, fn)', function() {
      it('should return a 404', function(done) {        
        var titleA = Math.random().toString()
          , titleB = Math.random().toString();

        dpd.todos.get({id: "non existent"}, function (todos, err) {
          expect(todos).to.not.exist;
          expect(err.message).to.equal('not found');
          expect(err.statusCode).to.equal(404);
          done();
        })
      })
    })

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

    describe('.get({arbitrary: true}, fn)', function() {
      it('should allow arbitrary query parameters', function(done) {
        dpd.todos.post({title: 'foobar'}, function () {
          dpd.todos.get({arbitrary: true}, function (todos, err) {
            expect(todos.length).to.equal(1);
            expect(todos[0].custom).to.equal('arbitrary');
            done(err);
          })
        })
      });
      
      it('should run events when an id is included', function(done) {
        dpd.todos.post({title: 'foobar'}, function (todo) {
          dpd.todos.get({arbitrary: true, id: todo.id}, function (t) {
            expect(t.custom).to.equal('arbitrary');
            done();
          })
        });
      })
    });

    describe('.get(id, fn)', function() {
      it('should run events when an id is queried', function(done) {
        dpd.todos.post({title: 'foobar'}, function (todo) {
          dpd.todos.get(todo.id, function (t) {
            expect(t.custom).to.equal('custom');
            done();
          })
        });        
      });
    });

    describe('.put(id, {done: true}, fn)', function() {
      it('should add properties', function(done) {
        chain(function(next) {
          dpd.todos.post({title: 'foobar'}, next)
        }).chain(function(next, result) {
          dpd.todos.put(result.id, {done: true}, next)
        }).chain(function(next, result) {
          expect(result.title).to.equal('foobar');
          expect(result.done).to.equal(true);
          dpd.todos.get(result.id, next);
        }).chain(function(next, result) {
          expect(result.title).to.equal('foobar');
          expect(result.done).to.equal(true);
          done();
        })
      });
    });

    describe('.put(id, {done: true}, fn)', function() {
      it('should be able to access old properties in On Put', function(done) {
        chain(function(next) {
          dpd.todos.post({title: '$PUT_TEST', message: "x"}, next)
        }).chain(function(next, result) {
          dpd.todos.put(result.id, {done: true}, next)
        }).chain(function(next, result) {
          expect(result.message).to.equal("xx");
          dpd.todos.get(result.id, next);
        }).chain(function(next, result) {
          expect(result.message).to.equal("xx");
          expect(result.done).to.equal(true);
          done();
        })
      });
    });

    describe('.put(id, {done: true}, fn)', function() {
      it('should be able to access old properties in On Validate', function(done) {
        chain(function(next) {
          dpd.todos.post({title: '$VALIDATE_TEST', message: ""}, next)
        }).chain(function(next, result) {
          expect(result.message).to.equal("x");
          dpd.todos.put(result.id, {done: true}, next)
        }).chain(function(next, result) {
          expect(result.message).to.equal("xx");
          dpd.todos.get(result.id, next);
        }).chain(function(next, result) {
          expect(result.message).to.equal("xx");
          expect(result.done).to.equal(true);
          done();
        })
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
        })
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
    })

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
    })

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
    })

  })

  describe('internal cancel()', function(){
    it('should not cancel the internal call', function(done) {
      dpd.todos.post({title: '$CANCEL_TEST'}, function (todo) {
        expect(todo.err).to.not.exist;
        dpd.todos.get({title: '$INTERNAL_CANCEL_TEST'}, function (todos) {
          expect(todos.length).to.equal(1);
          done();
        })
      })
    })
    
    afterEach(function (done) {
      this.timeout(10000);
      cleanCollection(dpd.todos, done);
    })
  })

  describe('dpd.recursive', function() {
    beforeEach(function(done) {
      dpd.recursive.post({name: "dataception"}, function() {
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
        };
        expect(current.more).to.not.exist;
        done(err);
      });
    });

    afterEach(function (done) {
      this.timeout(10000);
      cleanCollection(dpd.recursive, done);
    })
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
    })
  });

  
})
