var Cookies = require('cookies');

/**
 * A utility for setting up a request and response.
 */

exports.setup = function(req, res) {
	req.cookies = res.cookies = new Cookies(req, res);
}