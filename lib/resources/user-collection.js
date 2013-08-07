var validation = require('validation')
  , util = require('util')
  , Collection = require('./collection')
  , db = require('../db')
  , EventEmitter = require('events').EventEmitter
  , uuid = require('../util/uuid')
  , crypto = require('crypto')
  , SALT_LEN = 256
  , debug = require('debug')('user-collection');

/**
 * A `UserCollection` adds user authentication to the Collection resource.
 *
 * Settings:
 *
 *   - `path`                the base path a resource should handle
 *   - `config.properties`   the properties of objects the collection should store 
 *   - `db`                  the database a collection will use for persistence
 *
 * @param {Object} options
 */

function UserCollection(name, options) {
  Collection.apply(this, arguments);

  var config = this.config;

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
UserCollection.events    = Collection.events;

/**
 * Handle an incoming http `req` and `res` and execute
 * the correct `Store` proxy function based on `req.method`.
 *
 *
 * @param {ServerRequest} req
 * @param {ServerResponse} res
 */

UserCollection.prototype.handle = function (ctx) {
  var uc = this;

  if (ctx.req.method == "GET" && (ctx.url === '/count' || ctx.url.indexOf('/index-of') === 0)) {
    return Collection.prototype.handle.apply(uc, arguments);
  }

  if(ctx.url === '/logout') {
    if (ctx.res.cookies) ctx.res.cookies.set('sid', null);
    ctx.session.remove(ctx.done);
    return;
  }

  // set id one wasnt provided in the query
  ctx.query.id = ctx.query.id || this.parseId(ctx) || (ctx.body && ctx.body.id);

  // make sure password will never be included
  if(ctx.query.$fields) {
    var omit = true;
    for (var field in ctx.query.$fields) {
      if (ctx.query.$fields.hasOwnProperty(field) && ctx.query.$fields[field] > 0) {
        omit = false;
        if ('password' in ctx.query.$fields) delete ctx.query.$fields['password'];
      }
      break;
    }
    if (omit || Object.keys(ctx.query.$fields).length === 0) ctx.query.$fields.password = 0;
  } else ctx.query.$fields = {password: 0};

  switch(ctx.req.method) {
    case 'GET':
      if(ctx.url === '/me') {
        debug('session %j', ctx.session.data);
        if(!(ctx.session && ctx.session.data && ctx.session.data.uid)) {
          ctx.res.statusCode = 204;
          return ctx.done();
        }
        
        ctx.query = {id: ctx.session.data.uid, $fields: {password: 0}};
        
        return this.find(ctx, ctx.done);
      }

      this.find(ctx, ctx.done);
    break;
    case 'POST':
      if(ctx.url === '/login') {
        var path = this.path
          , credentials = ctx.req.body || {};

        debug('trying to login as %s', credentials.username);

        this.store.first({username: credentials.username}, function(err, user) {
          if(err) return ctx.done(err);

          if(user) {
            var salt = user.password.substr(0, SALT_LEN)
              , hash = user.password.substr(SALT_LEN);

            if(hash === uc.hash(credentials.password, salt)) {
              debug('logged in as %s', credentials.username);
              ctx.session.set({path: path, uid: user.id}).save(ctx.done);
              return;
            }
          }

          ctx.res.statusCode = 401;
          ctx.done('bad credentials');
        });
        break;
      }
      /* falls through */
    case 'PUT':
      if(ctx.body && ctx.body.password) {
        var salt = uuid.create(SALT_LEN);
        ctx.body.password = salt + this.hash(ctx.body.password, salt);
      }
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

UserCollection.prototype.handleSession = function (ctx, fn) {
  // called when any session has been created
  var session = ctx.session
    , path = this.path;
    
  if(session && session.data && session.data.path == path && session.data.uid) {
    this.store.find({id: session.data.uid, $fields: {password: 0}}, function(err, user) {
      session.user = user;
      fn(err);
    });
  } else {
    fn();
  }
};

UserCollection.prototype.hash = function (password, salt) {
  return crypto.createHmac('sha256', salt).update(password).digest('hex');
};

UserCollection.label = 'Users Collection';
UserCollection.defaultPath = '/users';

UserCollection.prototype.clientGenerationGet = ['me'];
UserCollection.prototype.clientGenerationExec = ['login', 'logout'];

module.exports = UserCollection;