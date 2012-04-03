# Collection Resource

A Collection resource allows your app to save and load data in a simple schema.

## Setting up a collection

After creating a Collection resource in the dashboard, you can set up the schema by dragging properties into the database and naming them. 

The grid view below the property list allows you to edit the Collection manually.

## Property types

You can currently use the following property types:

  * **String** - Arbritrary text data
  * **Number** - Numeric value, supports floating points
  * **Boolean** - True or false
  * **Date** - A specific point in time

## Formats

You must format the request body as a JSON string and pass the header "Content-Type: application/json".

## Saving data

To save data, send a POST request to the root of the Collection:

    POST /people
    Content-Type: application/json
    {
      "age": 23,
      "firstName": "Joe",
      "lastName": "Smith"
    }

The server will respond with the object, which will have a new `_id` property. 

    200 OK
    {
      "_id": "4f71fc7c2ba744786f000001",
      "age": 23,
      "firstName": "Joe",
      "lastName": "Smith"
    }

This `_id` is used to find the object's URL (i.e. `/people/4f71fc7c2ba744786f000001`)

## Listing data

A GET request to the root of the Collection will return an array of objects in the collection:

    GET /people

    200 OK
    [
      {
        "_id": "4f71fc7c2ba744786f000001",
        "age": 23,
        "firstName": "Joe",
        "lastName": "Smith"
      },
      {
        "_id": "4f71fe8b2ba744786f000002",
        "age": 36,
        "firstName": "John",
        "lastName": "Doe"
      }
    ]

## Retrieving a specific object

A GET request at an object's URL will return the properties of that object:

    GET /people/4f71fc7c2ba744786f000001

    200 OK
    {
      "_id": "4f71fc7c2ba744786f000001",
      "age": 23,
      "firstName": "Joe",
      "lastName": "Smith"
    }


## Updating an object

A PUT request at an object's URL will update the object. You must include all properties except for `_id`.

    PUT /people/4f71fc7c2ba744786f000001
    Content-Type: application/json
    {
      "age": 24,
      "firstName": "Fred",
      "lastName": "Smith"
    }

The server will respond with the entire object:

    200 OK
    {
      "_id": "4f71fc7c2ba744786f000001",
      "age": 24,
      "firstName": "Fred",
      "lastName": "Smith"
    }

## Deleting an object


A DELETE request at an object's URL will permanently remove that object from the collection:

    DELETE /people/4f71fc7c2ba744786f000001

    204 No Content


## Filtering results

You can add querystring parameters to a GET request at the root to filter the results by properties specified:

    GET /people?firstName=Joe&lastName=Smith

**NOTE**: This currently only works for String properties.

## Advanced querying

If you need to query additional types of properties, pass a JSON object as the `q` parameter with the properties you wish to filter:

    GET /people?q={
      "age": 23
    }

The `q` parameter supports [MongoDB's query language](http://www.mongodb.org/display/DOCS/Advanced+Queries) for particularly advanced queries. Note that Collections do not currently support embedded documents or arrays.

    GET /people?q={
      "$orderby": { "age": 1 },
      "name": {
        "$regex": "^j"
        "$options": "i",
      }
    }


# Collection Event Handlers

You can attach micro-scripts to events to add logic and validation to your objects. Collections currently support the following events:

  * **On Get** - called when data is read
  * **On Post** - called when data is created
  * **On Put** - called when data is updated
  * **On Delete** - called when data is destroyed

## Reading and setting properties

In an event micro-script, the `this` object refers to the current object, and has all of the properties of the object.

You can set values on the `this` object during an On Post or On Put event. These changes will be saved to the database.

    // On Post:
    this.dateCreated = new Date();

    // On Put:
    this.totalScore = this.level1Points + this.level2Points;

## Accessing the current user

If the request is coming from a logged in User, you can use the "me" object to access their properties.

    // On Post:
    this.creator = me._id;


## Cancelling an event

You can stop any event by calling the `cancel(message, [code])` method.

    //On Delete:
    if (this.protected) {
      cancel('This post is protected and cannot be deleted');
    }

    DELETE /posts/123456

    400 Bad Request
    {
      "message": "This post is protected and cannot be deleted"
    }

You can pass an integer to the `cancel()` method as the second parameter to set the HTTP status code. For example, 401 means "Unauthorized".

    //On Put
    if (this.creator !== me._id) {
      cancel("You cannot view this post because it is not yours!", 401);
    }

    PUT /posts/13456
    Content-Type: application/json
    { ... }

    401 Unauthorized
    {
      "message": "You cannot view this post because it is not yours!"
    }


## Validation

Use the `error(name, message)` function to add a validation error.

    //On Post
    if (this.age < 18) {
      error('age', 'must be older than 18')
    }

    POST /people
    {
      "firstName": "Joe",
      "lastName": "Smith",
      "age": 12
    }

    400 Bad Request
    {
      errors: {
        "age": "must be older than 18"
      }
    }

## Hiding properties

If you wish to hide certain properties from a user, use the `hide(propertyName)` function.

    //On Get
    if (this.creator !== me._id) {
      hide('lastName');
      hide('age');
    }

## Protecting properties from modification

Use the `protect(propertyName)` function to protect specified properties during a POST or PUT.
  
    //On Put
    protect('createdDate');