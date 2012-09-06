describe('chain() function', function() {
	it('should call functions in order', function(done) {
		var val;
		chain(function(next) {
			val = 1;
			next();
		}).chain(function(next) {
			expect(val).to.equal(1);
			val++;
			next();
		}).chain(function(next) {
			expect(val).to.equal(2);
			val++;
			next();
		}).chain(function(next) {
			expect(val).to.equal(3);
			done();
		});
	});

	it('should call functions in order asynchronously', function(done) {
		this.timeout(1000);
		var val;
		chain(function(next) {
			val = 1;
			setTimeout(next, 5);
		}).chain(function(next) {
			expect(val).to.equal(1);
			val++;
			setTimeout(next, 5);
		}).chain(function(next) {
			expect(val).to.equal(2);
			val++;
			setTimeout(next, 5);
		}).chain(function(next) {
			expect(val).to.equal(3);
			done();
		});
	});

	it('should pass results to the next function', function(done) {
		chain(function(next) {
			next(1);
		}).chain(function(next, val) {
			expect(val).to.equal(1);
			val++;
			next(val);
		}).chain(function(next, val) {
			expect(val).to.equal(2);
			val++;
			next(val);
		}).chain(function(next, val) {
			expect(val).to.equal(3);
			done();
		});
	});

	it('should pass results to the next function asynchronously', function(done) {
		this.timeout(1000);
		chain(function(next) {
			setTimeout(function() {next(1);}, 5);
		}).chain(function(next, val) {
			expect(val).to.equal(1);
			val++;
			setTimeout(function() {next(val);}, 5);
		}).chain(function(next, val) {
			expect(val).to.equal(2);
			val++;
			setTimeout(function() {next(val);}, 5);
		}).chain(function(next, val) {
			expect(val).to.equal(3);
			done();
		});
	});
});