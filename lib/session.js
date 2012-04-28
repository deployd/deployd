/**
 * Dependencies
 */

var sessions = require('./collections/sessions')
  , collection = require('./types/collection')
;

module.exports = function (req, res, next) {  
  var sid = req.cookies && req.cookies.sid;
  
  if(sid) {
    sessions.get({_id: sid}).first(function (err, session) {
      if(session) {
        req.session = session;
        if(session.type && session.user && session.user._id) {
          collection.use('/' + session.type).get({_id: session.user._id}).first(function (err, user) {
            delete user.password;
            session.user = user;
            next(err);
          })
        } else {
          next(err);
        }
      } else {
        next(err);  
      }
    })
  } else {
    next();
  }
}