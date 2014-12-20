emit('customLoginEvent');

if (ctx.body.authtoken == "notright")
  cancel('bad auth');