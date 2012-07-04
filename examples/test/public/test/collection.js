describe('Collection', function() {
	describe('dpd.todos', function() {
		it('should exist', function() {
			expect(dpd.todos).to.exist;
		});

		describe('.post(query, fn)', function() {
			it('should create a todo with an id', function(done) {
				dpd.todos.post({title: 'faux'}, function (todo) {
					expect(todo.id.length).to.equal(24);
					done();
				});
			});
		});

		describe('.get(query, fn)', function() {
			
		});
	});
});