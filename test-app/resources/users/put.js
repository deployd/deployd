if (changed('displayName') && this.displayName == "$CHANGEPASSWORD") {
    dpd.users.put(this.id, {password: 'changed'}, function() {});
}

this.isMe = isMe(this.id);