dpd.users.get({id: {$in: this.friends}}, function(friends) {
    if (friends) this.friends = friends;
});

// keep here to verify issue:
// https://github.com/deployd/deployd/issues/565
if (!query.showUsername)
  hide('username');
