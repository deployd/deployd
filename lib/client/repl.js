var Server = require('../server')
	,	Client = require('./index');

module.exports = function (port, host) {
	var repl = require("repl")
	,	context = repl.start("dpd > ", null, replEval, true, true).context
	// TODO db port, host
	, info = {port: port || 2403, db: {host: host || 'localhost', port: 27015, name: 'my-db'}};

	context.server = new Server(info);
	context.server.listen();
	context.dpd = new Client(port || 2403);
}

function replEval(src, ctx, name, fn) {
	var result;

	try {
		result = eval(src);
	} catch(e) {}

	fn(null, result);
}