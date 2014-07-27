var chain = function(fn) {
	var queue = [];
	var executing = false;
	var lastResult = [];

	var execute = function() {
		var func = queue.shift();
		var args = [_next];
		if (func) {
			executing = true;
			args.push.apply(args, lastResult.length ? lastResult : arguments);
			func.apply(this, args);
		}
	};

	var _next = function() {
		executing = false;
		lastResult = arguments;
		execute();
	};

	var _chain = function(fn) {
		queue.push(fn);	

		if (!executing) {
			execute();
		}

		return {chain: _chain};	
	};

	return _chain(fn);
};

var cleanCollection = function(collection, done) {
	collection.get({clean: true}, function (items) {
		var total = items.length;
		if(total === 0) return done();
		items.forEach(function(item) {
			collection.del({id: item.id}, function () {
				total--;
				if(!total) {
					done();
				}
			});
		});
	});
};