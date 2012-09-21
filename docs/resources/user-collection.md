# User Collection

A User Collection extends a [Collection](/docs/resources/collection.html), adding the functionality needed to authenticate users with your app.

## Properties

User Collections can have the same properties as a Collection, with two additional non-removable properties:

- `username` - The user's identifier; must be unique.
- `password` - A write-only, encrypted password

## API

User Collections add three new methods to the standard Collection API:

### Logging in

Log in a user with their username and password. If successful, the browser will save a secure cookie for their session. This request responds with the session details:

	{
		"id": "s0446b993caaad577a..." //Session id - usually not needed
		"path": "/users" // The path of the User Collection - useful if you have different types of users.
		"uid": "ec54ad870eaca95f" //The id of the user
	}

**REST Example**

	POST /users/login 
	{"username": "test@test.com", "password": "1234"}

**dpd.js Example**

	dpd.users.login({'username': 'test@test.com', 'password': '1234'}, function(result, error) {
		//Do something
	});

### Logging out

Logging out will remove the session cookie on the browser and destroy the current session. It does not return a result.

**REST Example**

	POST /users/logout 

**dpd.js Example**

	dpd.users.logout(function(result, error) {
		//Do something
	});

### Getting the current user

Returns the user that is logged in.

**REST Example**

	GET /users/me

**dpd.js Example**

	dpd.users.me(function(result, errors) {
		//Do something
	});