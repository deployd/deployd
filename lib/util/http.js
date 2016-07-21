var Cookies = require('cookies')
  , qs = require('qs')
  , parseUrl = require('url').parse
  , corser = require('corser')
  , ALLOWED_METHODS = ['GET', 'POST', 'PUT', 'DELETE'];

/*!
 * A utility for setting up a request and response.
 */

exports.setup = function(options, req, res, next) {
  var remoteHost = req.headers.origin
    , corsOpts = {supportsCredentials: true, methods: ALLOWED_METHODS, maxAge: 300};

  if(remoteHost) {
    corsOpts.origins = options.origins;
  } else {
    corsOpts.supportsCredentials = false;
  }
  corsOpts.responseHeaders = corser.simpleResponseHeaders.concat(["X-Session-Token", "X-Session-Invalidated"]).concat(options.allowedResponseHeaders || []);
  corsOpts.requestHeaders = corser.simpleRequestHeaders.concat(["X-Requested-With", "Authorization"]).concat(options.allowedRequestHeaders || []);
  if (options.allowCorsRootRequests) {
    corsOpts.requestHeaders.push("dpd-ssh-key");
  }

  var handler = corser.create(corsOpts);

  handler(req, res, function () {
    req.cookies = res.cookies = new Cookies(req, res);

    if(~req.url.indexOf('?')) {
      try {
        req.query = parseQuery(req.url);
        var m = req.query._method;
        if ( m ) {
            req.originalMethod = req.method;
            req.method = m.toUpperCase();
            delete req.query._method;
        }
      } catch (ex) {
        res.setHeader('Content-Type', 'text/plain');
        res.statusCode = 400;
        res.end('Failed to parse querystring: ' + ex);
        return;
      }
    }

    switch(req.method) {
      case 'OPTIONS':
        // End CORS preflight request.
        res.writeHead(204);
        res.end();
      break;
      case 'POST':
      case 'PUT':
      case 'DELETE':
        var mime = req.headers['content-type'] || 'application/json';
        mime = mime.split(';')[0]; //Just in case there's multiple mime types, pick the first

        if(autoParse[mime]) {
          autoParse[mime](req, res, mime, next);
        } else if(typeof options.mimeParser === 'function') {
          options.mimeParser(req, res, mime, next);
        } else {
          if(req.headers['content-length']) req.pause();
          next();
        }
      break;
      default:
        next();
      break;
    }
  });
};


/*!
 * Gets the body the request by either reading a stream or by loading req.rawBody
 * For compatibility with middlewares that read the stream, create compatibility
 * middleware that writes to req.rawBody or override this method
 * @param {ServerRequest} req
 * @param {Function} callback (body)
 */
exports.getBody = function(req, callback){
  if(req.rawBody) {
    return callback(req.rawBody);
  }

  var buf = '';

  req.on('data', function(chunk){ buf += chunk; });

  req.on('end', function(){
    return callback(buf);
  });
};

/*!
 * Attempts to parse the request. Currently supports the following formats:
 *
 * - application/json
 * - application/x-www-form-urlencoded (all values are strings)
 *
 * @param {ServerRequest} req
 * @param {String} mime
 * @param {Function} callback (err)
 */

var parseBody = exports.parseBody = function(req, res, mime, callback) {
  exports.getBody(req, function(buf){

    var parser = JSON;

    if (mime === 'application/x-www-form-urlencoded') {
      parser = qs;
    }

    try {
      if(buf.length) {
        if(mime === 'application/json' && '{' != buf[0] && '[' != buf[0]) {
          res.setHeader('Content-Type', 'text/plain');
          res.statusCode = 400;
          res.end('Could not parse invalid JSON');
          return;
        }

        req.body = parser.parse(buf);
        var m = req.body._method;
        if ( m ) {
          req.originalMethod = req.method;
          req.method = m.toUpperCase();
          delete req.body._method;
        }
      } else {
        req.body = {};
      }
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

  if(q) q = decodeURIComponent(q);

  if(q[0] === '{' && q[q.length - 1] === '}') {
    return JSON.parse(q);
  } else {
    var parsedQuery = qs.parse(parseUrl(url).query);
    if (parsedQuery._jsonquery) {
      return JSON.parse(parsedQuery._jsonquery);
    }

    return parseNumbersInObject(parsedQuery);
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

/*
 * Number parsing that fails in qs
 */

var isInt = /^[0-9]+$/;
var isFloat = /^[-+]?[0-9]*\.?[0-9]+$/;
var parseNumbersInObject = function( obj ){
  var ret = {}, key;
  for(key in obj){
    var val = obj[key];
    if(isInt.test(val)){
      ret[key] = parseInt(val);
    } else if(isFloat.test(val)){
      ret[key] = parseFloat(val);
    } else if (typeof val === 'object'){
      ret[key] = parseNumbersInObject(val);
    } else {
      ret[key] = val;
    }
  }
  return ret;
};
