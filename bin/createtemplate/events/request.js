/**
 * Use the request event to define global business logic.
 * This will execute whenever a resource is requested.
 */
 
/**
 * Use prevent() and allow() to change your default permissions.
 * The following disables any unauthorized access to your app.
 */

// only allow logged in users any permissions
// if(!me) {
//   prevent('*');
// }

// with the logging in being the only exception
// allow('login');