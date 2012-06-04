/**
 * Dependencies
 */

var net = require('net')
	, util = require('util')
	, Socket = net.Socket;

/**
 * A `Client` implements a simple abstraction for creating remote socket connections to a running
 * deployd server.
 *
 *
 * Example:
 *
 *   Connect to a deployd server at `host` `'127.0.0.1'` and `port` `3000`.
 *
 *     var connection = Client.connect(3000, '127.0.0.1')
 *			 , client = new Client(connection)
 *       , client.createStore('Foo');
 *
 *     store.insert({foo: 'bar'}, fn);
 *
 * @param {Object} connection
 * @api private
 */

function Client(connection) {
	Socket.apply(this, arguments);
}
util.inherits(Client, Socket);


/**
 * A `ClientStore` is a remote connection to a deployd server `Store`.
 *
 *
 * @param {Object} connection
 * @api private
 */

function ClientStore(namespace, client) {
  this.namespace = namespace;
}

/**
 * Insert an object into the store.
 *
 * Example:
 *
 *     db
 *       .connect({host: 'localhost', port: 27015, name: 'test'})
 *       .createStore('testing-store')
 *       .insert({foo: 'bar'}, fn)
 *
 * @param {Object} object
 * @param {Function} callback(err, obj)
 */

ClientStore.prototype.insert = function (object, fn) {

};

/**
 * Find all objects in the store that match the given query.
 *
 * Example:
 *
 *     db
 *       .connect({host: 'localhost', port: 27015, name: 'test'})
 *       .createStore('testing-store')
 *       .find({foo: 'bar'}, fn)
 *
 * @param {Object} query
 * @param {Function} callback(err, obj)
 */

ClientStore.prototype.find = function (query, fn) {

};

/**
 * Find the first object in the store that match the given query.
 *
 * Example:
 *
 *     db
 *       .connect({host: 'localhost', port: 27015, name: 'test'})
 *       .createStore('testing-store')
 *       .first({foo: 'bar'}, fn)
 *
 * @param {Object} query
 * @param {Function} callback(err, obj)
 */

ClientStore.prototype.first = function (query, fn) {

};

/**
 * Update an object or objects in the store that match the given query.
 *
 * Example:
 *
 *     db
 *       .connect({host: 'localhost', port: 27015, name: 'test'})
 *       .createStore('testing-store')
 *       .update({id: '<an object id>'}, fn)
 *
 * @param {Object} query
 * @param {Object} object
 * @param {Function} callback(err, obj)
 */

ClientStore.prototype.update = function (query, object, fn) {

};

/**
 * Remove an object or objects in the store that match the given query.
 *
 * Example:
 *
 *     db
 *       .connect({host: 'localhost', port: 27015, name: 'test'})
 *       .createStore('testing-store')
 *       .remove({id: '<an object id>'}, fn)
 *
 * @param {Object} query
 * @param {Function} callback(err, obj)
 */

ClientStore.prototype.remove = function (query, fn) {

};

/**
 * Rename the store.
 *
 * Example:
 *
 *     db
 *       .connect({host: 'localhost', port: 27015, name: 'test'})
 *       .createStore('testing-store')
 *       .rename('renamed-store', fn)
 *
 * @param {String} namespace
 * @param {Function} callback(err, obj)
 */

ClientStore.prototype.rename = function (namespace, fn) {

};



exports.Client = Client;