/**
 * Dependencies
 */

var sessions = require('./collections/sessions');

module.exports = function (req, res, next) {  
  var sid = req.cookies.sid;
  
  if(req.cookies.sid) {
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