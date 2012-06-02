module.exports = function (port, host) {
	var repl = require("repl")
	,	context = repl.start("dpd $ ", null, replEval, false, true).context;
}

function replEval(src, ctx, name, fn) {
	var result;

	try {
		result = eval(src);
	} catch(e) {}

	fn(null, result);
}