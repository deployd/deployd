/**
 * Extend a basic mdoq object
 */

var dpd = require('mdoq')

/**
 * Export a method to change the storage resource.
 */

dpd.storage = require('./storage').storage

/**
 * Export the dpd mdoq object as the public interface.
 */

module.exports = dpd

/**
 * Provide optional network access via an http server.
 */

.use(require('./server'))

/**
 * Every request will try to establish a session.
 */
 
.use(require('./session'))

/**
 * If a session was established, continue to the router.
 */
 
.use(require('./router'))

/**
 * If the router finds a resource, continue to validation.
 */
 
.use(require('./validation'))

/**
 * If the request passes validation, continue to the requested resource.
 */
 
.use(require('./resource'))