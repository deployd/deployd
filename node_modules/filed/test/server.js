var http = require('http')

function createServer () {
  var s = http.createServer(function (req, resp) {
    resp.___end = resp.end
    resp.end = function (chunk) {
      s.completed[req.url] = true
      resp.___end(chunk)
      if (Object.keys(s._events).filter(function(n){return n[0] === '/'}).length === Object.keys(s.completed).length) {
        setTimeout(function () {
          s.close()
        }, 0)
      }
    }
    s.emit(req.url, req, resp)
  })
  s.completed = {}
  return s;
}
module.exports = createServer;