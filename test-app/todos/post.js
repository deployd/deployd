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