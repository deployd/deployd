var util = require('util')
  , Collection = require('./collection')
  , uuid = require('../util/uuid')
  , crypto = require('crypto')
  , _ = require('underscore')
  , debug = require('debug')('user-collection');

/**
 * A `UserCollection` adds user authentication to the Collection resource.
 *
 * Options:
 *
 *   - `path`                the base path a resource should handle
 *   - `config.properties`   the properties of objects the collection should store
 *   - `db`                  the database a collection will use for persistence
 *
 * @param {string} name      The name of the resource
 * @param {Object} options   The options
 */

function UserCollection(name, options) {
  Collection.apply(this, arguments);

  if(!this.properties) {
    this.properties = {};
  }

  // username and password are required
  this.properties.username = this.properties.username || {type: 'string'};
  this.properties.username.required = true;
  this.properties.password = this.properties.password || {type: 'string'};
  this.properties.password.required = true;
}
util.inherits(UserCollection, Collection);

UserCollection.dashboard = Collection.dashboard;
UserCollection.events    = _.clone(Collection.events);
UserCollection.events.push('Login');

UserCollection.SALT_LEN = 256;

/**
 * Handle an incoming http request and execute.
 * the correct `Store` proxy function based on `ctx.req.method`.
 *
 * @param {Context} ctx The Context of the request.
 */

UserCollection.prototype.handle = function (ctx) {
  var uc = this;

  if (ctx.req.method == "GET" && (ctx.url === '/count' || ctx.url.indexOf('/index-of') === 0)) {
    return Collection.prototype.handle.apply(uc, arguments);
  }

  if(ctx.url === '/logout') {
    var logoutDomain = { event: "LOGOUT" };
    uc.addDomainAdditions(logoutDomain);
    uc.doBeforeRequestEvent(ctx, logoutDomain, function(err) {
      if (err) return ctx.done(err);
      if (ctx.res.cookies) ctx.res.cookies.set('sid', null, {overwrite: true});
      ctx.session.remove(ctx.done);
    });
    return;
  }

  // set id if one wasnt provided in the query
  ctx.query.id = ctx.query.id || this.parseId(ctx) || (ctx.body && ctx.body.id);

  // make sure password will never be included
  if(ctx.query.$fields) {
    var omit = true;
    for (var field in ctx.query.$fields) {
      if (ctx.query.$fields.hasOwnProperty(field) && ctx.query.$fields[field] > 0) {
        omit = false;
        if ('password' in ctx.query.$fields) delete ctx.query.$fields.password;
      }
      break;
    }
    if (omit || Object.keys(ctx.query.$fields).length === 0) ctx.query.$fields.password = 0;
  } else ctx.query.$fields = {password: 0};

  switch(ctx.req.method) {
    case 'GET':
      if(ctx.url === '/me') {
        debug('session %j', ctx.session.data);
        var noSuchUser = function () {
          // set no-cache headers
          ctx.res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
          ctx.res.setHeader("Pragma", "no-cache");
          ctx.res.setHeader("Expires", "0");
          ctx.res.statusCode = 204;
          return ctx.done();
        };

        if(!(ctx.session && ctx.session.data && ctx.session.data.uid)) {
          return noSuchUser();
        }

        ctx.query = ctx.query || {};
        ctx.query.id = ctx.session.data.uid;

        // raw store query, need unmodified username and password
        return uc.store.find({id: ctx.session.data.uid, $fields: {username: 1, password: 1}}, function(err, user) {
          if (err) {
            console.error("Internal Error: " + JSON.stringify(err));
            return ctx.done({statusCode: 500, message: "Error retrieving user for verification"});
          }

          var userHash = user ? uc.getUserAndPasswordHash(user) : null;

          // verify that the username and password haven't changed since this session was created
          if (ctx.session.data.userhash === userHash) {
            // hash verified, call find() now to ensure all event scripts are executed
            return uc.find(ctx, function(err, user){
              if (!user) return noSuchUser(); // if the request was cancelled by the event script
              delete user.password;
              ctx.done.apply(null, arguments);
            });
          } else {
            noSuchUser();
          }
        });
      }

      this.find(ctx, ctx.done);
    break;
    case 'POST':
      if(ctx.url === '/login') {
        var loginDomain = { event: "LOGIN" };
        uc.addDomainAdditions(loginDomain);
        uc.doBeforeRequestEvent(ctx, loginDomain, function(err) {
          if (err) return ctx.done(err);
          uc.handleLogin(ctx);
        });
        break;
      }
      /* falls through */
    case 'PUT':
      if (!ctx.body && typeof ctx.body !== "object") {
        return ctx.done("Missing request body");
      }
      this.setPassword(ctx.body);
      var isSelf = ctx.session.user && ctx.session.user.id === ctx.query.id || (ctx.body && ctx.body.id);
      if ((ctx.query.id || ctx.body.id) && ctx.body && !isSelf && !ctx.session.isRoot && !ctx.req.internal) {
        delete ctx.body.username;
        delete ctx.body.password;
      }

      function done(err, res) {
        if (res) delete res.password;
        ctx.done(err, res);
      }

      if(ctx.query.id || ctx.body.id) {
        this.save(ctx, done);
      } else {
        this.store.first({username: ctx.body.username}, function (err, u) {
          if(u) return ctx.done({errors: {username: 'is already in use'}});
          uc.save(ctx, done);
        });
      }
    break;
    case 'DELETE':
      debug('removing', ctx.query, ctx.done);
      this.remove(ctx, ctx.done);
    break;
  }
};

/**
 * Retrieves the user for the current request.
 * @param {Context}  ctx The Context of the request.
 * @param {Function} fn  Callback that will receive the returned user.
 */
UserCollection.prototype.loginFindUser = function (ctx, fn) {
  var credentials = ctx.req.body || { };
  return this.store.first({ username: credentials.username }, fn);
};

/**
 * Sets the session token on the client.
 * @param {Context} ctx       The Context of the request.
 * @param {string} sessionId  The Session identifier.
 */
UserCollection.prototype.setSessionId = function (ctx, sessionId) {
  // dpd internal client does not have res.cookies
  if (ctx.res.cookies) ctx.res.cookies.set('sid', sessionId, { overwrite: true });
  if (ctx.res.setHeader) ctx.res.setHeader('X-Session-Token', sessionId);
};

/**
 * Process the login for the current `ctx`.
 * @param {Context} ctx The Context of the request.
 */
UserCollection.prototype.handleLogin = function (ctx) {
  var uc = this
    , path = uc.path
    , credentials = ctx.req.body || {};

  debug('trying to login as %s', credentials.username);
  /* jshint eqnull:true */
  // disable the jshint warning about needing === below
  // this checks whether the values are either null or undefined
  if (credentials.username == null || typeof credentials.username !== 'string' || credentials.password == null || typeof credentials.password !== 'string') {
    ctx.res.statusCode = 400;
    ctx.done('username or password not specified');
    return;
  }

  this.loginFindUser(ctx, function (err, user) {
    if (err) return ctx.done(err);
    // keep a clone of the user so we can compare it later to see if any changes were made in the login event
    var userClone = user ? _.clone(user) : null
      , domain = { 'me': userClone, 'data': userClone, 'success': false };
    var usernameAndPasswordHash = user ? uc.getUserAndPasswordHash(user) : null;

    // checks if the user was changed in the login event and saves it if it was
    function checkAndSaveUser(fn) {
      if (user && !_.isEqual(userClone, user)) {
        // something was changed, need to update the user
        debug('detected that user %s was updated from login event, saving...', credentials.username);
        // create a new context and set the body to our user so that we can call save on the collection
        var newCtx = _.clone(ctx);
        newCtx.body = userClone;
        // skip events when calling uc.save, so that validate and put is not called from this
        // internal call
        newCtx._internalSkipEvents = true;
        newCtx.query = { id: user.id };
        // disable changing the username from this event
        if (newCtx.body.username) delete newCtx.body.username;
        if (newCtx.body.id) delete newCtx.body.id; // remove id from body

        uc.save(newCtx, fn);
      } else {
        fn();
      }
    }

    function loginDone(err) {
      if (err) return ctx.done(err);
      checkAndSaveUser(function (err) {
        if (err) return ctx.done(err);
        debug('logged in as %s', credentials.username);
        ctx.session.set({ path: path, uid: user.id, userhash: usernameAndPasswordHash }).save(function (err, session) {
          if (err) return ctx.done("Internal error");
          uc.setSessionId(ctx, session.id);
          ctx.done(err, { path: session.path, id: session.id, uid: session.uid });
        });
      });
    }

    function loginFail(err) {
      checkAndSaveUser(function () {
        if (err) return ctx.done(err); // allow overriding of error message from event
        ctx.res.statusCode = 401;
        ctx.done('bad credentials');
      });
    }

    if (user) {
      // a user with this username exists
      delete userClone.password;
      if (uc.checkHash(uc, user, credentials) === true) {
        domain.success = true;
        delete user.password; // make sure the password is not included in any sort of response

        if (uc.events.Login) {
          uc.events.Login.run(ctx, domain, loginDone);
        } else {
          loginDone();
        }
        return;
      }
    }

    if (uc.events.Login) {
      uc.events.Login.run(ctx, domain, loginFail);
    } else {
      loginFail();
    }
  });
};

/**
 * Returns a hash created by concatenating the username and password.
 * @param  {Object} user An object containing `username` and `password` properties.
 * @return {string}      The hash.
 */
UserCollection.prototype.getUserAndPasswordHash = function(user) {
  return crypto.createHash('md5').update(user.username + user.password).digest('hex');
};

/**
 * Used to verify that a session is still valid. Sets `ctx.session` if successful.
 * @param {Context}  ctx The Context of the request.
 * @param {Function} fn  The callback that handles the response.
 */
UserCollection.prototype.handleSession = function (ctx, fn) {
  // called when any session has been created
  var session = ctx.session
    , path = this.path
    , uc = this;

  if(session && session.data && session.data.path == path && session.data.uid) {
    this.store.find({ id: session.data.uid }, function (err, user) {
      if (user) {
        var userHash = uc.getUserAndPasswordHash(user);
        delete user.password;
        // verify that the username and password haven't changed since this session was created
        if (session.data.userhash === userHash) {
          session.user = user;
        } else {
          ctx.res.setHeader('X-Session-Invalidated', 'true');
        }
      }
      fn(err);
    });
  } else {
    fn();
  }
};

/**
 * Takes a plain-text password and hashes it. Mutates `body.password`.
 * @param {Object} body The body of the request. Must contain `body.password`.
 */
UserCollection.prototype.setPassword = function (body) {
  // do not add salt to empty string
  if(!body || !body.password || typeof body.password !== 'string' || body.password.length < 1) {
      return;
  }
  var salt = uuid.create(UserCollection.SALT_LEN);
  body.password = salt + this.hash(body.password, salt);
};

/**
 * Hashes a password with the specified salt.
 * @param  {string} password The password.
 * @param  {string} salt     The salt.
 * @return {string}          The hash, as a hex digest.
 */
UserCollection.prototype.hash = function (password, salt) {
  if (password && !isNaN(password)){
    password = password.toString();
  }
  return crypto.createHmac('sha256', salt).update(password).digest('hex');
};

/**
 * Checks whether the given password matches the one persisted for the user.
 * @param  {UserCollection} uc  The UserCollection.
 * @param  {Object} user        The user object. Must have a property named `password`.
 * @param  {Object} credentials The credentials to be checked. Must have a property named `password`.
 * @return {boolean}            `true` if the credentials are valid.
 */
UserCollection.prototype.checkHash = function (uc, user, credentials) {
  // NOTE: there is no need for this to take uc as the first parameter
  var salt = user.password.substr(0, UserCollection.SALT_LEN)
    , hash = user.password.substr(UserCollection.SALT_LEN);

  return hash === uc.hash(credentials.password, salt);
};

UserCollection.label = 'Users Collection';
UserCollection.defaultPath = '/users';

UserCollection.prototype.clientGenerationGet = ['me'];
UserCollection.prototype.clientGenerationExec = ['login', 'logout'];

module.exports = UserCollection;
