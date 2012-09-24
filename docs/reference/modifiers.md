# Update Modifiers

When updating an object in a [Collection](/docs/resources/collection.html), you can use special modifier commands to more granularly change property values. 

## $inc

The `$inc` command increments the value of a given Number property.

	// Give a player 5 points
	{
		score: {$inc: 5}
	}

## $push

The `$push` command adds a value to an Array property.

	// Add a follower to a user by storing their id.
	{
		followers: {$push: 'a59551a90be9abd8'}
	}

*Note: This will work even on an undefined property*

## $pushAll

The `$pushAll` command adds multiple values to an Array property.

	// Add mentions of users
	{
		mentions: {
			$pushAll: ['a59551a90be9abd8', 'd0be45d1445d3809']
		}
	}

*Note: This will work even on an undefined property*

## $pull

The `$pull` command removes a value from an Array property.

	// Remove a user from followers
	{
		followers: {$pull: 'a59551a90be9abd8'}
	}

*Note: If there is more than one matching value in the Array, this will remove all of them*

## $pullAll

The `$pullAll` command removes multiple values from an Array property.

	// Remove multiple users
	{
		followers: {$pullAll: ['a59551a90be9abd8', 'd0be45d1445d3809']}
	}

*Note: This will remove all of matching values from the Array*