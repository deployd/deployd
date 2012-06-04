var Cookies = require('cookies')
	, qs = require('querystring')
  , parseUrl = require('url').parse;

/**
 * A utility for setting up a request and response.
 */

var autoParse = {
	'application/x-www-form-urlencoded': parseBody,
	'application/json': parseBody
};

exports.setup = function(req, res, next) {
  var mime = this.req.headers['content-type'] || '';
	mime = mime.split(';')[0]; //Just in case there's multiple mime types, pick the first

	req.cookies = res.cookies = new Cookies(req, res);

  if(~req.url.indexOf('?')) {
  	req.query = parseQuery(req.url);
  }

  if(autoParse[mime]) {
  	autoParse[mime](req, mime, next);
  } else {
  	next();
  }
}

/**
 * Attempts to parse the stream. Currently supports the following formats:
 * 
 * - application/json
 * - application/x-www-form-urlencoded (all values are strings)
 * 
 * @param {ServerRequest} req
 * @param {String} mime
 * @param {Function} callback (err, body)
 */

var parseBody = exports.parseBody = function(req, mime, callback) {
  var buf = '';

  req.on('data', function(chunk){ buf += chunk });
  req.on('end', function(){
    var parser = JSON;

    if (mime === 'application/x-www-form-urlencoded') {
      parser = qs;
    }

    try {
      callback(null, parser.parse(buf));
    } catch (ex) {
      callback(ex);
    }
  });
}

var parseQuery = exports.parseQuery = function(url) {
	var q = url.split('?')[1];
	
	if(q[0] === '{' && q[q.length - 1] === '}') {
		return JSON.parse(q);
	} else {
		return qs.parse(parseUrl(url).query); 
	}
}
