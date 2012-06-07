var validation = require('validation')
  , util = require('util')
  , Collection = require('./collection')
  , db = require('../db')
  , EventEmitter = require('events').EventEmitter
  , asyncEval = require('async-eval')
  , uuid = require('../util/uuid')
  , crypto = require('crypto')
  , SALT_LEN = 256
  , debug = require('debug')('user-collection');

/**
 * A `UserCollection` adds user authentication to the Collection resource.
 *
 * Settings:
 *
 *   - `path`         the base path a resource should handle
 *   - `properties`   the properties of objects the collection should store 
 *   - `db`           the database a collection will use for persistence
 *   - `onGet`        a function to execute after a collection gets an object
 *   - `onPost`       a function to execute before a collection creates an object
 *   - `onPut`        a function to execute before a collection updates an object
 *   - `onDelete`     a function to execute before a collection deletes an object
 *   - `onValidate`   a function to execute before a collection creates or updates an object
 *
 * Example:
 *
 *     var properties = {name: {type: 'string'}}
 *       , users = new UserCollection({properties: properties});
 *
 * @param {Object} settings
 * @api private
 */

function UserCollection(settings) {
  if(!settings.properties) {
    settings.properties = {};
  }

  // email and password are required
  settings.properties.email = settings.properties.email || {type: 'string'};
  settings.properties.email.required = true;
  settings.properties.password = settings.properties.password || {type: 'string'};
  settings.properties.password.required = true;

  Collection.apply(this, arguments);
}
util.inherits(UserCollection, Collection);

/**
 * Handle an incoming http `req` and `res` and execute
 * the correct `Store` proxy function based on `req.method`.
 *
 *
 * @param {ServerRequest} req
 * @param {ServerResponse} res
 */

UserCollection.prototype.handle = function (ctx) {
  if(ctx.url === '/logout') {
    ctx.session.remove(ctx.done);
    return;
  }

  // set id one wasnt provided in the query
  ctx.query.id = ctx.query.id || this.parseId(ctx);

  switch(ctx.req.method) {
    case 'GET':
      if(ctx.url === '/me') {
        debug('session %j', ctx.session.data);
        if(!(ctx.session && ctx.session.data && ctx.session.data.uid)) {
          ctx.res.statusCode = 401;
          return ctx.done(new Error('Not logged in'));
        }

        return this.find(ctx.session, {id: ctx.session.data.uid}, ctx.done);
      }

      this.find(ctx.session, ctx.query, ctx.done);
    break;
    case 'POST':
      if(ctx.url === '/login') {
        var path = this.settings.path
          , credentials = ctx.req.body
          , uc = this;

        this.store.first({email: credentials.email}, function(err, user) {
          if(err) return ctx.done(err);

          if(user) {
            var salt = user.password.substr(0, SALT_LEN)
              , hash = user.password.substr(SALT_LEN);

            if(hash === uc.hash(credentials.password, salt)) {
              debug('logged in as %s', credentials.email);
              ctx.session.set({path: path, uid: user.id}).save(ctx.done);
              return;
            }
          }

          ctx.res.statusCode = 401;
          ctx.done(null, 'bad credentials');
        });
        break;
      }
    case 'PUT':
      if(ctx.body && ctx.body.password) {
        var salt = uuid.create(SALT_LEN);
        ctx.body.password = salt + this.hash(ctx.body.password, salt);
      }
      this.save(ctx.session, ctx.body, ctx.query, ctx.done);
    break;
    case 'DELETE':
      this.remove(ctx.session, ctx.query, ctx.done);
    break;
  }
}

UserCollection.prototype.handleSession = function (ctx, fn) {
  // called when any session has been created
  var session = ctx.session
    , path = this.settings.path;
    
  if(session && session.data.path == path && session.data.uid) {
    this.store.find({id: session.data.uid}, function(err, user) {
      session.user = user;
      fn(err);
    });
  }
}

UserCollection.prototype.hash = function (password, salt) {
  return crypto.createHmac('sha256', salt).update(password).digest('hex');
}

UserCollection.label = 'Users Collection';
UserCollection.defaultPath = '/users';

UserCollection.prototype.clientGenerationGet = ['me'];
UserCollection.prototype.clientGenerationDo = ['login', 'logout'];

module.exports = UserCollection;