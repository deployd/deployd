emit('delete:called');

if (ctx.query.fromTest && this.data === "$DONTDELETE") cancel("Can't delete this one");