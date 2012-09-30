/* Adapted from http://www.quirksmode.org/js/xmlhttp.html */

/*jshint undef:true, browser: true*/
/*global ActiveXObject:false, console:false */

(function() {

function parseBody(req) {
  var header = req.getResponseHeader('Content-Type');
  if (header === "application/json" && req.responseText) {
    try {
      return JSON.parse(req.responseText);
    } catch (ex) {
      console.error("Failed to parse \"" + req.responseText + "\" as JSON", ex);
      return req.responseText;
    }
  } else {
    return req.responseText;  
  }
  
}

function sendRequest(url,options) {
  var req = createXMLHTTPObject();
  if (!req) return Error("AJAX is somehow not supported");

  if (options.query) url += '?' + options.query;

  var data = options.data;
  var method = options.method || "GET";
  req.open(method,url,true);
  req.withCredentials = true;
  // req.setRequestHeader('User-Agent','XMLHTTP/1.0');
  if (data)
    req.setRequestHeader('Content-type', options.contentType || 'application/json');
  if (typeof sendRequest.headers === 'object') {
    for (var k in sendRequest.headers) {
      if (sendRequest.headers.hasOwnProperty(k)) {
        req.setRequestHeader(k, sendRequest.headers[k]);  
      }
    }
  }
  req.onreadystatechange = function () {
    if (req.readyState != 4) return;
    if (req.status != 200 && req.status != 204 && req.status != 304) {
      if (typeof options.error === 'function') options.error(parseBody(req));
      return;
    }
    if (typeof options.success === 'function') options.success(parseBody(req));
  };
  if (req.readyState == 4) return;
  req.send(data);
}

sendRequest.headers = {};

var XMLHttpFactories = [
  function () {return new XMLHttpRequest()},
  function () {return new ActiveXObject("Msxml2.XMLHTTP")},
  function () {return new ActiveXObject("Msxml3.XMLHTTP")},
  function () {return new ActiveXObject("Microsoft.XMLHTTP")},
  function () {return new XDomainRequest()}
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