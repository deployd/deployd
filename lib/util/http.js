var Cookies = require('cookies')
  , qs = require('querystring')
  , parseUrl = require('url').parse;

/*!
 * A utility for setting up a request and response.
 */

exports.setup = function(req, res, next) {
  var mime = req.headers['content-type'] || '';
  mime = mime.split(';')[0]; //Just in case there's multiple mime types, pick the first

  req.cookies = res.cookies = new Cookies(req, res);

  if(~req.url.indexOf('?')) {
    try {
      req.query = parseQuery(req.url);  
    } catch (ex) {
      res.setHeader('Content-Type', 'text/plain');
      res.statusCode = 400;
      res.end('Failed to parse querystring: ' + ex);
      return;
    }
  }

  if(autoParse[mime]) {
    autoParse[mime](req, res, mime, next);
  } else {
    if(req.headers['content-length']) req.pause();
    next();
  }
};

/*!
 * Attempts to parse the stream. Currently supports the following formats:
 * 
 * - application/json
 * - application/x-www-form-urlencoded (all values are strings)
 * 
 * @param {ServerRequest} req
 * @param {String} mime
 * @param {Function} callback (err)
 */

var parseBody = exports.parseBody = function(req, res, mime, callback) {
  var buf = '';

  req.on('data', function(chunk){ buf += chunk; });
  req.on('end', function(){
    var parser = JSON;

    if (mime === 'application/x-www-form-urlencoded') {
      parser = qs;
    }

    try {
      req.body = parser.parse(buf);
      callback();
    } catch (ex) {
      res.setHeader('Content-Type', 'text/plain');
      res.statusCode = 400;
      res.end('Failed to parse body as ' + mime);
    }
  });
};

var parseQuery = exports.parseQuery = function(url) {
  var q = url.substr(url.indexOf('?') + 1);

  if(q) q = decodeURI(q);

  if(q[0] === '{' && q[q.length - 1] === '}') {
    return JSON.parse(q);
  } else {
    return qs.parse(parseUrl(url).query); 
  }
};

/*!
 * Redirects to the given url.
 */

exports.redirect = function(res, url, statusCode) {
  res.statusCode = statusCode || 301;
  res.setHeader("Location", url);
  res.end();
};


var autoParse = {
  'application/x-www-form-urlencoded': parseBody,
  'application/json': parseBody
};