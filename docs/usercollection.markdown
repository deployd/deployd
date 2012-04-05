# User Collection Resource

A User Collection resource behaves much like the standard Collection resource, but adds the ability to authenticate with a username and password.

## Special properties

The User Collection contains two special properties:

  * **email** - For security, hidden by default on all users except the current user.
  * **password** - Never readable under any circumstances. Can only be set when the user is logged in, when creating a new user, or from the Dashboard.

## Registering a user

First create a user by POSTing it to the root of the collection.
For this example our collection will be called `/users`.

    POST /users/login
    Content-Type: application/json
    {
      "email": "foo@bar.com",
      "password": "barfoo"
    }

## Authenticating a user

To login a user, send a POST request to `/<collection name>/login`:

    POST /users/login
    Content-Type: application/json
    {
      "email": "foo@bar.com",
      "password": "barfoo"
    }
    
The server will respond with the user, without the password.

    200 OK
    {
      "_id": "4f71fc7c2ba744786f000001",
      "email": "foo@bar.com"
    }

## Current user

The currently logged in user is available by sending a GET request to `/users/me`.

    200 OK
    {
      "_id": "4f71fc7c2ba744786f000001",
      "email": "foo@bar.com"
    }
    
## Logging out

To logout a user send a POST request to `/<collection name>/logout`:

    204 No Content



