dpd.users.get({id: {$in: this.friends}}, function(friends) {
    if (friends) this.friends = friends;
});