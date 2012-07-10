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

		describe('.get({title: title}, fn)', function() {
			it('should return a single result', function(done) {
				var title = Math.random().toString();

				dpd.todos.post({title: title}, function () {
					dpd.todos.get(function (todos, err) {
						expect(todos.length).to.equal(1);
						done(err);
					})
				})
			})
		})

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
	})

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
