# Collection

The Collection resource allows clients to save, update, delete, and query data of a given type. 

## Properties

![Properties editor](/img/docs/collection-properties.png)

Properties in a Collection describe the objects that it can store. 
Every Collection has an `id` property that cannot be removed. This property is automatically generated when you create an object and serves as a unique identifier.

You can add these types of properties to a Collection:

- `String` - Acts like a JavaScript string
- `Number` - Stores numeric values, including floating points.
- `Boolean` - Either true or false. (To avoid confusion, Deployd will consider null or undefined to be false)
- `Object` - Stores any JSON object. Used for storing arbitrary data on an object without needing to validate schema.
- `Array` - Stores an array of any type. 

*Deprecated* Any property can be marked as "Required". This will cause an error message if the property is null or undefined when an object is created. 

## Events

Events allow you to add custom logic to your Collection. Events are written in JavaScript, see the [Collection Events Reference](/docs/reference/collection-events.html) for details on the API.

These events are available for scripting:

### On Get

Called whenever an object is loaded from the server. Commonly used to hide properties, restrict access to private objects, and calculate dynamic values.

	// Example On Get: Hide Secret Properties
	if (!me || me.id !== this.creatorId) {
		hide('secret');
	}

<!--seperate-->

	// Example On Get: Load A Post's Comments
	dpd.comments.get({postId: this.id}, function(comments) {
		this.comments = comments;
	});

*Note: When a list of objects is loaded, `On Get` will run once for each object in the list. Calling `cancel()` in this case will remove the object from the list, rather than cancelling the entire request.*


### On Validate 

Called whenever an object's values change, including when it is first created. Commonly used to validate property values and calculate certain dynamic values (i.e. last modified time). 

	// Example On Validate: Enforce a max length
	if (this.body.length > 100) {
		error('body', "Cannot be more than 100 characters");
	}

<!--seperate-->

	// Example On Validate: Normalize an @handle
	if (this.handle.indexOf('@') !== 0) {
		this.handle = '@' + this.handle;
	}

*Note: `On Post` or `On Put` will execute after `On Validate`, unless `cancel()` or `error()` is called*


### On Post

Called when an object is created. Commonly used to prevent unauthorized creation and save data relevant to the creation of an object, such as its creator.

	// Example On Post: Save the date created
	this.createdDate = new Date();

<!--seperate-->

	// Example On Post: Prevent unauthorized users from posting
	if (!me) {
		cancel("You must be logged in", 401);
	}


### On Put

Called when an object is updated. Commonly used to restrict editing access to certain roles, or to protect certain properties from editing.

	// Example On Put: Protect readonly/automatic properties
	protect('createdDate');
	protect('creatorId')

### On Delete 

Called when an object is deleted. Commonly used to prevent unauthorized deletion.

	// Example On Delete: Prevent non-admins from deleting
	if (!me || me.role !== 'admin') {
		cancel("You must be an admin to delete this", 401);
	}

## API

A Collection allows clients to interact with it over a REST interface, as well as with the `dpd.js` library. 

### Listing Data

**REST Example**

	GET /todos

**dpd.js Example**
	
	// Get all todos
	dpd.todos.get(function(results, error) {
		//Do something
	});

### Querying Data

Filters results by the property values specified.

**REST Example**

	GET /todos?category=red

**dpd.js Example**

	// Get all todos that are in the red category
	dpd.todos.get({category: 'red'}, function(results, error) {
		//Do something
	});

*Note: for Array properties, this acts as a "contains" operation. For example, the above query would also match `category` value of `["blue", "red", "orange"]`.*

Use the [Advanced Query commands](/docs/reference/advanced-queries.html) for more control over the results.

### Creating an Object

**REST Example**

	POST /todos
	{"title": "Walk the dog", "category": "red"}

**dpd.js Example**

	dpd.todos.post({title: 'Walk the dog'}, function(result, error) {
		//Do something
	});

### Getting a Single Object

**REST Example**

	GET /todos/add1ad66465e6890

**dpd.js Example**

	dpd.todos.get('add1ad66465e6890', function(result, error)) {
		//Do something
	});

### Updating an Object

You do not need to provide all properties for an object. Deployd will only update the properties you provide.
You can use [Update Modifiers](/docs/reference/modifiers.html) for atomic updates such as incrementing Number properties and adding to Array properties.

**REST Example**

	PUT /todos/add1ad66465e6890
	{"title": "Bathe the cat"}

**dpd.js Example**

	dpd.todos.put('add1ad66465e6890', {title: "Bathe the cat"}, function(result, error)) {
		//Do something
	});

### Deleting an Object

**REST Example**

	DELETE /todos/add1ad66465e6890

**dpd.js Example**

	dpd.todos.del('add1ad66465e6890', function(result, error)) {
		//Do something
	});