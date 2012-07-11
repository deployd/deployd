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
					,	titleB = Math.random().toString();

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
					,	titleB = Math.random().toString();

				dpd.todos.get({id: "non existent"}, function (todos, err) {
					expect(todos).to.not.exist;
					expect(err.message).to.equal('not found');
					expect(err.statusCode).to.equal(404);
					done();
				})
			})
		})

		describe('.get({title: "$TESTFAIL2"}, fn)', function() {
			it('should corretly respond to errors in event IO', function(done) {
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
			dpd.recursive.get(function (recursive) {
				var total = recursive.length;
				if(total === 0) return done();
				recursive.forEach(function(todo) {
					dpd.recursive.del({id: todo.id}, function () {
						total--;
						if(!total) {
							done();
						}
					})
				})
			})
		})
	});

	afterEach(function (done) {
		this.timeout(10000);
		dpd.todos.get(function (todos) {
			var total = todos.length;
			if(total === 0) return done();
			todos.forEach(function(todo) {
				dpd.todos.del({id: todo.id}, function () {
					total--;
					if(!total) {
						done();
					}
				})
			})
		})
	})
})
