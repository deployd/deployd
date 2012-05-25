/**
 * Dependencies
 */
 
var parse = require('url').parse;

function Resource(settings) {
  this.settings = settings;
}

Resource.prototype.match = function (url) {
  var settings = this.settings
    , path = settings && settings.path;
  
  if(url[0] !== '/') return false;
  
  var parsed = this.parse(url);
  if(url === path) return true;
  if(('/' + parsed.basepath) === path && parsed.parts.length < 3) return true;
  if(parsed.id === 'index.html' || parsed.id === 'index.htm') return true;
  return false;
}

Resource.prototype.parse = function (url) {
  var parsed = parse(url, true)
    , pathname = parsed.pathname
    , parts = parsed.parts = pathname.split('/');
  
  // remove empty
  parts.shift();
  parsed.basepath = parts[0];
  
  // remove empty trailing slash part
  if(parts[parts.length - 1] === '') parts.pop();
  
  // the last part is always the identifier
  if(parts.length > 1) parsed.id = parts[parts.length - 1];
  
  if(parsed.query.q && parsed.query.q[0] === '{' && parsed.query.q[parsed.query.q.length - 1] === '}') {
    parsed.query.q = JSON.parse(parsed.query.q);
  }
  
  return parsed;
}

Resource.prototype.handle = function (req, res) {
  res.end();
}

/**
 * Export
 */
 
module.exports = Resource;