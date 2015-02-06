emit('users:test_event', { 'this' : this });


if (ctx.body.authtoken == "$BAD_AUTH") cancel('bad auth');

if (this && this.banned) cancel('banned');

if (success) {
  this.loginFailures = 0;
  this.lastLoginTime = Date.now();
  this.banned = false;
} else if (this && this.id) {
  // a user was found but the login failed
  this.loginFailures = this.loginFailures || 0;
  this.loginFailures++;
  if (this.loginFailures >= 3) {
    this.banned = true; // ban this user
  }
} else {
  // login failed and user was not found
  cancel('no such user'); // not recommended in production
}

if (this.username === "$SKIP_EVENTS_TEST") this.$NOCASCADE = true;