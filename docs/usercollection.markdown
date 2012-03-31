User Collection Resource
========================

A User Collection resource behaves much like the standard Collection resource, but adds the ability to authenticate with a username and password.

Special properties
------------------

The User Collection contains two special properties:

  * **email** - For security, hidden by default on all users except the current user.
  * **password** - Never readable under any circumstances. Can only be set when the user is logged in, when creating a new user, or from the Dashboard.

Authenticating a user
---------------------
