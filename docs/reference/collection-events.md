# Collection Events Reference

Events allow you to add custom logic to your Collection using JavaScript. Deployd is compatible with ECMAScript 5, so you can use functional-style programming, such as `forEach()`, `map()`, and `filter()`.

### this

The current object is represented as `this`. You can always read its properties. Modifying its properties in an `On Get` request will change the result that the client recieves, while modifying its properties in an `On Post`, `On Put`, or `On Validate` will change the value in the database.

    // Example: On Validate
    // If a property is too long, truncate it
    if (this.message.length > 140) {
      this.message = this.message.substring(0, 137) + '...';
    }

*Note*: In some cases, the meaning of `this` will change to something less useful inside of a function. If you are using functional programming (i.e. `Array.forEach()`), you may need to bind another variable to `this`:

    // Won't work - sum gets set to 0
    this.sum = 0;
    this.targets.forEach(function(t) {
      this.sum += t.points;
    });
    
<!--seperate-->

    //Works as expected
    var self = this;

    this.sum = 0;
    this.targets.forEach(function(t) {
      self.sum += t.points;
    });

### me

The currently logged in User from a User Collection. `undefined` if no user is logged in.

    // Example: On Post
    // Save the creator's information
    if (me) {
        this.creatorId = me.id;
        this.creatorName = me.name;
    }
### query

The query string object. On a specific query (i.e. `/posts/a59551a90be9abd8`), this includes an `id` property.

    // Example: On Get
    // Don't show the body of a post in a general query
    if (!query.id) {
      hide(this.body);
    }

### cancel()

    cancel(message, [statusCode])

Stops the current request with the provided error message and HTTP status code. Status code defaults to `400`. Commonly used for security and authorization.

    // Example: On Post
    // Don't allow non-admins to create items
    if (!me.admin) {
      cancel("You are not authorized to do that", 401);
    }

### error()

    error(key, message)

Adds an error message to an `errors` object in the response. Cancels the request, but continues running the event so it can to collect multiple errors to display to the user. Commonly used for validation.

    // Example: On Validate
    // Don't allow certain words
    // Returns response {"errors": {"name": "Contains forbidden words"}}
    if (!this.name.match(/(foo|bar)/)) {
      error('name', "Contains forbidden words");
    }

### hide()

    hide(property)

Hides a property from the response.

    // Example: On Get
    // Don't show private information
    if (!me || me.id !== this.creatorId) {
      hide('secret');
    }

### protect()

    protect(property)

Prevents a property from being updated.

    // Example: On Put
    // Protect a property
    protect('createdDate');
    

### changed()

    changed(property)

Returns whether a property has been updated.

    // Example: On Put
    // Validate the title when it changes
    if(changed('title') && this.title.length < 5) {
      error('title', 'must be over 5 characters');
    }
    
### previous

An `Object` containing the previous values of the item to be updated.

    // Example: On Put
    if(this.votes < previous.votes) {
      emit('votes have decreased');
    }

### emit()

    emit([userCollection, query], event, [data])

Emits a realtime event to the client
You can use `userCollection` and `query` parameters to limit the event broadcast to specific users.

    // Example: On Put
    // Alert the owner that their post has been modified
    if (me.id !== this.creatorId) {
      emit(dpd.users, {id: this.creatorId}, 'postModified', this); 
    } 

<!--seperate-->

    // Example: On Post
    // Alert clients that a new post has been created
    emit('postCreated', this);

In the front end:

    // Listen for new posts
    dpd.on('postCreated', function(post) {
        //do something...
    });

See the [Dpd.js Reference](/docs/reference/dpdjs.html#docs-realtime) for details on how to listen for events.

### dpd

The entire [dpd.js](/docs/reference/dpdjs.html) library, except for `dpd.on()`, is available from events. It will also properly bind `this` in callbacks.

    // Example: On Get
    // If specific query, get comments
    dpd.comments.get({postId: this.id}, function(results) {
      this.comments = results;
    });

<!--seperate-->

    // Example: On Delete
    // Log item elsewhere
    dpd.archived.post(this);

Dpd.js will prevent recursive queries. This works by returning `null` from a `dpd` function call that has already been called further up in the stack.

    // Example: On Get /recursive
    // Call self
    dpd.recursive.get(function(results) {
        if (results) this.recursive = results;
    });

<!--seperate-->

    // GET /recursive
    {
        "id": "a59551a90be9abd8",
        "recursive": [
            {
                "id": "a59551a90be9abd8"    
            }
        ]
    }


### internal

Equal to true if this request has been sent by another script.

    // Example: On GET /posts
    // Posts with a parent are invisible, but are counted by their parent
    if (this.parentId && !internal) cancel();

    dpd.posts.get({parentId: this.id}, function(posts) {
        this.childPosts = posts.length;
    });

### isRoot

Equal to true if this request has been authenticated as root (has the `dpd-ssh-key` header with the appropriate key)

    // Example: On PUT /users
    // Protect reputation property - should only be calculated by a custom script.

    if (!isRoot) protect('reputation');


### console.log()

    console.log([arguments]...)

Logs the values provided to the command line. Useful for debugging.