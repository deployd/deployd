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
    if(req.method != 'POST') {
      return next({status: 404});
    }
    
    col.get(req.data).first(function (err, user) {
      if(user) delete user.password;
      
      if(err) return next(err);
      if(user) {
        // login successful - create session
        sessions.post({user: user}, function (e, session) {
          res.data = session;
          res.cookie('sid', session._id);
          next(e || err);
        })
      } else {
        next({status: 400, message: 'invalid credentials'})
      }
    })
  } else if(~req.url.indexOf('/logout')) {    
    if(req.method != 'POST') {
      return next({status: 404});
    }
    if(req.session) {
      res.clearCookie('sid');
      sessions.del({_id: req.session._id}, function (err) {
        next(err);
      });
    } else {
      next({message: 'Session not found.'});
    }
  } else if(~req.url.indexOf('/me')) {
    if(req.session && req.session.user && req.session.user._id) {
      col.get({_id: req.session.user._id}).first(function (err, me) {
        if(me) delete me.password;
        res.data = me;
        next(err);
      });
    } else {
      next({message: 'Current user not found.'});
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