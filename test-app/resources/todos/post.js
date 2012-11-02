if (this.title == "$REQUIRE_AUTH") {
    if (!me) cancel("You are not authorized", 401);
}

if (this.title === "$POSTERROR") {
    error('title', "POST error");
}

if (this.title === "$FAIL") {
    var x = null;
    x.fail();
}

if (this.title === "$TESTFAIL") {
    dpd.todos.post({title: "$FAIL"}, function(results, err) {
        this.results = results;
        this.err = err;
    });
}

if (this.title === "$REALTIME") {
    emit('createTodo', this);    
}

if (this.title === "$REALTIME2") {
    emit('createTodo2');    
}

if (this.title === "$CANCEL_TEST") {
  dpd.todos.post({title: "$INTERNAL_CANCEL_TEST"}, function (results, err) {
    this.err = err;
    this.results = results;
  });
}

if (this.title === "$INTERNAL_CANCEL_TEST") {
  if (!internal) cancel('internal cancel');
}

if (isRoot) {
    this.isRoot = true;
}