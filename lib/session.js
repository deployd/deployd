function Session() {
  return require('./model').spawn({
    collection: 'sessions',
    setup: true
  }).unlock();
}

/**
 * One day in seconds.
 */

var oneDay = 86400;

/**
 * Return the `SessionStore` extending `connect`'s session Store.
 *
 * @param {object} connect
 * @return {Function}
 * @api public
 */

module.exports = function(connect){

  /**
   * Connect's Store.
   */

  var Store = connect.session.Store;

  /**
   * Initialize SessionStore with the given `options`.
   *
   * @param {Object} options
   * @api public
   */

  function SessionStore(options) {
    options = options || {};
    Store.call(this, options);
  };

  /**
   * Inherit from `Store`.
   */

  SessionStore.prototype.__proto__ = Store.prototype;

  /**
   * Attempt to fetch session by the given `sid`.
   *
   * @param {String} sid
   * @param {Function} fn
   * @api public
   */

  SessionStore.prototype.get = function(sid, fn){
    Session()
      .find({sid: sid})
      .notify(function(json) {
          if(json._id) {
            fn(null, JSON.parse(json.data));
          } else {
            fn();
          }
      })
      .fetch()
    ;
  };

  /**
   * Commit the given `sess` object associated with the given `sid`.
   *
   * @param {String} sid
   * @param {Session} sess
   * @param {Function} fn
   * @api public
   */

  SessionStore.prototype.set = function(sid, sess, fn){
      var maxAge = sess.cookie.maxAge
        , ttl = 'number' == typeof maxAge
          ? maxAge / 1000 | 0
          : oneDay
        , sess = {data: JSON.stringify(sess)}
      ;
      
      Session()
        .set(sess)
        .set({sid: sid})
        .find({sid: sid})
        .notify(function(json) {
          if(json.errors && !json._id) {
            fn && fn(new Error('Could not set session'));
          } else {
            fn && fn(null, json);
          }
        })
        .save()
      ;
  };

  /**
   * Destroy the session associated with the given `sid`.
   *
   * @param {String} sid
   * @api public
   */

  SessionStore.prototype.destroy = function(sid, fn){
    
    Session()
      .find({sid: sid})
      .notify(function(json) {
        if(json.errors) {
          fn && fn(new Error('Could not destroy session'));
        } else {
          fn && fn();
        }
      })
      .remove()
    ;
  };

  return SessionStore;
};