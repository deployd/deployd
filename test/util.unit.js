describe('uuid', function() {
	describe('.create()', function() {
		var uuid = require('../lib/util/uuid');
		var used = {};
		// max number of objects that must not conflict
		// total of about 2 trillion possible combinations
		var i = 1000; // replace this with a larger number to really test
		while(i--) {
			var next = uuid.create();
			if(used[next]) throw 'already used'
			used[next] = 1;
		}
	});
});