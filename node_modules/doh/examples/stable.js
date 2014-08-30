/**
 * This example shows how you can combine `doh` with `forever-monitor` for
 * a very stable http server. Errors will be handled and returned as html
 * and the process will restart resetting any corrupt state.
 */
 
var monitor = new (require('forever-monitor').Monitor)('child.js');
monitor.start();

/**
 * see child.js for the rest of the example...
 */

