var validation = require('validation')
  , util = require('util')
  , Collection = require('./collection')
  , db = require('../db')
  , EventEmitter = require('events').EventEmitter
  , asyncEval = require('async-eval');

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

  switch(ctx.req.method) {
    case 'GET':
      this.find(ctx.session, ctx.query, ctx.done);
    break;
    case 'POST':
      if(ctx.url === '/login') {
        var path = this.settings.path;
        this.store.find(ctx.req.body, function(err, user) {
          if(err) return ctx.done(err);
          ctx.session.set({path: path, uid: user.id}).save(ctx.done);
        })
        break;
      }
    case 'PUT':
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

UserCollection.label = 'Users Collection';
UserCollection.defaultPath = '/users';

UserCollection.prototype.clientGenerationGet = ['me'];
UserCollection.prototype.clientGenerationDo = ['login', 'logout'];

module.exports = UserCollection;