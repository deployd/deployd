# Collection

Collections provide a proxy between http and a `Store`. They validate incoming requests, execute event scripts for `get`, `post`, `put`, `delete`, and `validate`. If all event scripts execute without error (or `cancel()`ing) the request is proxied to the collection's `Store`.

## Class: Collection

A `Collection` inherits from `Resource`. Any constructor that inherits from `Collection` must include its own `Collection.external` prototype object.

Example inheriting from `Collection`:

    var Collection = require('deployd/lib/resources/collection');
    var util = require('util');

    function MyCollection(name, options) {
      Collection.apply(this, arguments);
    }
    MyCollection.external = Collection.external;

    util.inherits(MyCollection, Collection);

## collection.store

* {Store}

The backing persistence abstraction layer. Supports saving and reading data from a database. See `Store` for more info (/lib/db.js).

## collection.validate(body, create)

Validate the request `body` against the `Collection` `properties` 
and return an object containing any `errors`.

* body {Object}

The object to validate

* create {Boolean}

Should validate a new object being created

* return errors {Object}

## collection.sanitize(body)

Sanitize the request `body` against the `collection.properties` 
and return an object containing only properties that exist in the
`collection.config.properties` object.

* body {Object}
* return sanitized {Object}

## collection.sanitizeQuery(query)

Sanitize the request `query` against the `collection.properties` 
and return an object containing only properties that exist in the
`collection.properties` object.

* query {Object}
* return sanitizedQuery {Object}

## collection.parseId(ctx)

Parse the `ctx.url` for an id. Override this change how an object's id is parsed out of a url.

* ctx {Context}

## collection.find(ctx, fn)

Find all the objects in a collection that match the given `ctx.query`. Then execute a `get` event script, if one exists, using each object found. Finally call `fn(err)` passing an `error` if one occurred.

* ctx {Context}
* fn(err)

## collection.remove(ctx, fn)

Execute a `delete` event script, if one exists, using each object found. Then remove a single object that matches the `ctx.query.id`. Finally call `fn(err)` passing an `error` if one occurred.

* ctx {Context}
* fn(err)

## collection.save(ctx, fn)

First execute a `validate` event script if one exists. If the event does not error, try to save the `ctx.body` into the store. If `ctx.body.id` exists, perform an `update` and execute the `put` event script. Otherwise perform an `insert` and execute the `post` event script. Finally call `fn(err)` passing an `error` if one occurred.

* ctx {Context}
* fn(err)




