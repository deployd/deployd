var Cookies = require('cookies')
  , qs = require('querystring')
  , parseUrl = require('url').parse
  , corser = require('corser')
  , ALLOWED_METHODS = ['GET', 'POST', 'PUT', 'DELETE'];
  
/*!
 * A utility for setting up a request and response.
 */

exports.setup = function(req, res, next) {
  var remoteHost = req.headers.origin
    , corsOpts = {supportsCredentials: true, methods: ALLOWED_METHODS};
    
  if(remoteHost) {
    corsOpts.origins = [remoteHost];
  } else {
    corsOpts.supportsCredentials = false;
  }
  
  var handler = corser.create(corsOpts);
  
  handler(req, res, function () {
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
      if(buf.length) {
        if(mime === 'application/json' && '{' != buf[0] && '[' != buf[0]) {
          res.setHeader('Content-Type', 'text/plain');
          res.statusCode = 400;
          res.end('Could not parse invalid JSON');
          return;
        }
        
        req.body = parser.parse(buf); 
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