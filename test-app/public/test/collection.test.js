describe('Collection', function() {
  describe('dpd.todos', function() {
    it('should exist', function() {
      expect(dpd.todos).to.exist
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

    describe('.post({title: 7}, fn)', function() {
      it('should sanitize the title due to incorrect type', function(done) {
        dpd.todos.post({title: 7}, function (todo, err) {
          delete todo.id;
          expect(todo).to.eql({done: false});
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

    it('should only go one level deep', function(done) {
      this.timeout(1000);
      dpd.recursive.get(function(result, err) {
        var obj = result[0];
        expect(result.length).to.equal(1);
        expect(obj).to.exist;

        expect(obj.more).to.exist;
        expect(obj.more.length).to.equal(1);
        expect(obj.more[0].more).to.not.be.ok;
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
        })        
      });
    });
  });

  
})
