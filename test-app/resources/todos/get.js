if (query.title === "$FAIL2") {
    var x = null;
    x.fail();
}

if (this.title === "$GET_CANCEL" && !query.clean) {
  cancel("Cancelled");
}

if (query.title === "$TESTFAIL2") {
    dpd.todos.get({title: "$FAIL2"}, function(todo, err) {
        this.todo = todo;
        this.err = err;
    });
}

this.custom = 'custom';

if (query.numberGet) {
    dpd.todos.get(27, function(res) {
        this.numberGet = res ? "response" : "noResponse";
    });
}

if (query.arbitrary) {
    this.custom = 'arbitrary';
}