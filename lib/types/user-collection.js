/**
 * Dependencies
 */
 
var sessions = require('../collections/sessions');

/**
 * A collection of user objects with login/out support.
 */

module.exports = function (req, res, next) {
  var col = require('./collection').use('/users');
  
  if(~req.url.indexOf('/login')) {
    console.log(req.url, req.data, 'trying to login');
    col.get(req.data).first(function (err, user) {
      if(user) {
        // login successful - create session
        sessions.post({user: user}, function (e, session) {
          console.log('created session id', session._id);
          res.data = session;
          console.log(res.cookie);
          next(e || err);
        })
      }
    })
  } else if(~req.url.indexOf('/logout')) {
    if(req.session) {
      
    } else {
      next(new Error('Session not found.'));
    }
  } else {
    col.exec(req, function (err, docs) {
      res.data = docs;

      next(err);
    });
  }
};