emit('users:test_event', { 'this' : this });

if (ctx.body.authtoken == "$BAD_AUTH")
  cancel('bad auth');

if (this.banned)
  cancel('banned');

if (success) {
  this.loginFailures = 0;
  this.lastLoginTime = Date.now();
  this.banned = false;
} else {
  this.loginFailures = this.loginFailures || 0;
  this.loginFailures++;
  if (this.loginFailures >= 3) {
    this.banned = true; // ban this user
  }
}
