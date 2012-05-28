/**
 * Initialize a connection with a client (or user) that can be established
 * and torn down at a later time. An established communication session may
 * involve more than one message in each direction. This is implemented in
 * both HTTP and WebSockets. Each WebSocket connection is bound to a session.
 *
 * Example:
 *    
 *     var session = new Session(connection);
 *    
 *     session.on('connected', function () {
 *       session.emit('hello world');
 *     });
 *    
 */

function Session(connection, sid, store) {

}

Session.prototype.remove = function (fn) {
  
}

Session.prototype.save = function (fn) {
  
}