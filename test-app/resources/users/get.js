dpd.users.get({id: {$in: this.friends}}, function(friends) {
    if (friends) this.friends = friends;
});

if(session && session.uid) {
    session.count = session.count || 0;
    session.count++;
    console.log('Session Test:', session);
}
