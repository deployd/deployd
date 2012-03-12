/**
 * Dependencies
 */
 
var sessions = require('../collections/sessions');

/**
 * A collection of user objects with login/out support.
 */

module.exports = function (req, res, next) {
  // support separate collections for each type of user
  var col = require('./collection').use(req.resource.path);
  
  // TODO change index of to something re-usable
  
  if(~req.url.indexOf('/login')) {
    col.get(req.data).first(function (err, user) {
      if(user) {
        // login successful - create session
        delete user.password;
        sessions.post({user: user}, function (e, session) {
          res.data = session;
          res.cookie('sid', session._id);
          next(e || err);
        })
      }
    })
  } else if(~req.url.indexOf('/logout')) {
    if(req.session) {
      res.clearCookie('sid');
      sessions.del({_id: req.session._id}, function (err) {
        next(err);
      })
    } else {
      next({message: 'Session not found.'});
    }
  } else if(~req.url.indexOf('/me')) {
    if(req.session) {
      res.data = req.session;
      next();
    } else {
      next({message: 'Session not found.'});
    }
  } else {
    // always remove password
    req.fields = {password: 0};
    
    // prevent GET, PUT, DELETE without _id (unless root)
    if(req.method != 'POST' && !req.query._id && !req.isRoot) {
      return next({message: 'Must include an _id when querying or updating a user'});
    } else {
      col.exec(req, function (err, docs) {
        res.data = docs;

        if(res.data && res.data.password) delete res.data.password;

        next(err);
      });
    }
  }
};