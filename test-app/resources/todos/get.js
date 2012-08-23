if (query.title === "$FAIL2") {
    var x = null;
    x.fail();
}

if (this.title === "$GET_CANCEL") {
  cancel("Cancelled");
}

if (query.title === "$TESTFAIL2") {
    dpd.todos.get({title: "$FAIL2"}, function(todo, err) {
        this.todo = todo;
        this.err = err;
    });
}

this.custom = 'custom';

if (query.arbitrary) {
    this.custom = 'arbitrary';
}