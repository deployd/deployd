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
  
  if(~req.url.indexOf('/login')) {
    if(req.method != 'POST') {
      // refuse login request from other methods
      return next({status: 404});
    }

    if (req.data && req.data.email && req.data.password) {
      col.get(req.data).first(function (err, user) {
        if(user) delete user.password;
        
        if(err) return next(err);
        if(user) {
          // login successful - create session
          sessions.post({user: user, type: req.resource.path.replace('/', '')}, function (e, session) {
            // store resource path
            res.data = session;
            res.cookie('sid', session._id, {path: '/'});
            next(e || err);
          })
        } else {
          next({status: 400, message: 'invalid credentials'})
        }
      })
    } else {
      return next({status: 400, message: "must provide email and password"})
    }
    
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
    var _id = (req.query && req.query._id && req.query._id.toString()) || undefined;
    var isRootOrCurrentUser = req.isRoot || (req.query && req.session && req.session.user && req.session.user._id.toString() === _id);
    
    // always remove password
    req.fields = {password: 0};

    if(req.method === 'GET' && !isRootOrCurrentUser) {
      req.fields.email = 0;
    }
    
    // only allow put / delete by current user
    if((req.method === 'PUT' || req.method === 'DELETE') && !isRootOrCurrentUser) {
      return next({status: 401});
    }
    
    // update should only set properties (not overwrite the entire object)
    if(req.method === 'PUT') {
      var data = req.data || req.body;
      delete data._id;
      req.body = req.data = {
        $set: data
      };
    }
    
    function save(er) {
      col.exec(req, function (err, docs) {
        res.data = docs;

        if(res.data && res.data.password) delete res.data.password;

        next(err || er);
      });
    }
    
    if(req.method === 'POST') {
      col.get({email: req.body.email}, function (err, u) {
        if(u) return next({status: 400, message: 'email already exists'});
        save(err);
      })
    } else {
      save();
    }
  }
};