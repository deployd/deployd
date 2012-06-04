var Server = require('./lib/server');

/**
 * export a simple function that constructs a dpd server based on a config
 */

module.exports = function (config) {
	return new Server(config);
}