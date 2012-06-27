# Collection Events Reference

Events allow you to add custom logic to your Collection using JavaScript. Deployd is compatible with ECMAScript 5, so you can use functional-style programming, such as `forEach()`, `map()`, and `filter()`.

# APIs

`this`

The current object is represented as `this`. You can always read its properties. Modifying its properties in an `On Get` request will change the result that the client recieves, while modifying its properties in an `On Post`, `On Put`, or `On Validate` will change the value in the database.

    // Example: On Validate
    // If a property is too long, truncate it
    if (this.message.length > 140) {
      this.message = this.message.substring(0, 137) + '...';
    }

*Note*: In some cases, the meaning of `this` will change to something less useful. If you are using functional programming (i.e. `Array.forEach()`), you may need to bind another variable to `this`:

    // Example: On Validate
    // Tally a score
    var self = this;

    self.sum = 0;
    self.targets.forEach(function(t) {
      self.sum += t.points;
    });

`me`

The currently logged in User from a User Collection. `undefined` if no user is logged in.

    // Example: On Post
    // Save the creator's information
    this.creatorId = me.id;
    this.creatorName = me.name;

`query`

The query string object. Includes `id` on a specific query.

    // Example: On Get
    // Don't show the body of a post in a general query
    if (!query.id) {
      hide(this.body);
    }

`cancel(message, [statusCode])`

Stops the current request with the provided error message and statusCode. Commonly used for security and authorization.

    // Example: On Post
    // Don't allow non-admins to create items
    if (!me.admin) {
      cancel("You are not authorized to do that", 401);
    }

`error(key, message)`

Adds an error message to an `errors` object in the response. Cancels the request, but continues running the event so as to collect multiple errors to display to the user. Commonly used for validation.

    // Example: On Validate
    // Don't allow certain words
    // Returns response {"errors": {"name": "Contains forbidden words"}}
    if (!this.name.match(/(foo|bar)/)) {
      error('name', "Contains forbidden words");
    }


`hide(property)`

Hides a property from the response.

    // Example: On Get
    // Don't show private information
    if (!me || me.id !== this.creatorId) {
      hide('secret');
    }

`protect(property)`

Prevents a property from being updated.

    // Example: On Put
    // Protect a property
    protect('createdDate');

`emit([userCollection, query], event, [data])`

Emits a realtime event to the client - see [Dpd.js Reference] for how to listen for events.
You can use `userCollection` and `query` to limit the event broadcast to specific users.

    // Example: On Put
    // Alert the owner that their post has been modified
    if (me.id !== this.creatorId) {
      emit(dpd.users, {id: this.creatorId}, 'postModified', this); 
    } 

`dpd`

The entire `dpd.js` library, except for `dpd.on()`, is available from events. It will also properly bind `this` in callbacks.

    // Example: On Get
    // If specific query, get comments
    dpd.comments.get({postId: this.id}, function(results) {
      this.comments = results;
    });

    // Example: On Delete
    // Log item elsewhere
    dpd.archived.post(this); 
    
`console.log([arguments]...)`

Logs the values provided to the command line. Useful for debugging.