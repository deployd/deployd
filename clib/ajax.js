/* Adapted from http://www.quirksmode.org/js/xmlhttp.html */

/*jshint undef:true, browser: true*/
/*global ActiveXObject:false, console:false */

(function() {

function parseBody(req) {
  var header = req.getResponseHeader('Content-Type');
  if (header === "application/json" && req.response) {
    try {
      return JSON.parse(req.response);
    } catch (ex) {
      console.error("Failed to parse \"" + req.response + "\" as JSON", ex);
      return req.response;
    }
  } else {
    return req.response;  
  }
  
}

function sendRequest(url,options) {
  var req = createXMLHTTPObject();
  if (!req) return Error("AJAX is somehow not supported");

  if (options.query) url += '?' + options.query;

  var data = options.data;
  var method = options.method || "GET";
  req.open(method,url,true);
  // req.setRequestHeader('User-Agent','XMLHTTP/1.0');
  if (data)
    req.setRequestHeader('Content-type', options.contentType || 'application/json');
  req.onreadystatechange = function () {
    if (req.readyState != 4) return;
    if (req.status != 200 && req.state != 204 && req.status != 304) {
      if (typeof options.error === 'function') options.error(parseBody(req));
      return;
    }
    if (typeof options.success === 'function') options.success(parseBody(req));
  };
  if (req.readyState == 4) return;
  req.send(data);
}

var XMLHttpFactories = [
  function () {return new XMLHttpRequest()},
  function () {return new ActiveXObject("Msxml2.XMLHTTP")},
  function () {return new ActiveXObject("Msxml3.XMLHTTP")},
  function () {return new ActiveXObject("Microsoft.XMLHTTP")}
];

function createXMLHTTPObject() {
  var xmlhttp = false;
  for (var i=0;i<XMLHttpFactories.length;i++) {
    try {
      xmlhttp = XMLHttpFactories[i]();
    }
    catch (e) {
      continue;
    }
    break;
  }
  return xmlhttp;
}

if (!window._dpd) window._dpd = {};
window._dpd.ajax = sendRequest;

})();