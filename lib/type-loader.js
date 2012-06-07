var fs = require('fs');

module.exports = function loadTypes(basepath, fn) {
	var types = {}
		, defaults = {};

	if(typeof basepath == 'function') {
		fn = basepath; 
		basepath = undefined;
	}

	var path = basepath || './resources';

	// read local project resources
	fs.readdir(path, function(err, dir) {
		dir.forEach(function(file) {
			if(file.indexOf('.js') == file.length - 3) {
				var c = require(require('path').resolve(path) + '/' + file);
				types[c.name] = c;
			}
		});

		// read default lib resources
		fs.readdir(__dirname + '/resources', function(err, dir) {
			dir.forEach(function(file) {
				if(file.indexOf('.js') == file.length - 3) {
					var c = require(path + '/' + file);
					defaults[c.name] = c;
				}
			});

			fn(defaults, types);
		});
	});
}