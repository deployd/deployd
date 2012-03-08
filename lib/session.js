/**
 * Dependencies
 */

var sessions = require('./collections/sessions');

module.exports = function (req, res, next) {  
  var sid = req.cookies && req.cookies.sid;
  
  if(sid) {
    sessions.get({_id: sid}).first(function (err, session) {
      if(session) {
        req.session = session;
      }
      
      next(err);
    })
  } else {
    next();
  }
}