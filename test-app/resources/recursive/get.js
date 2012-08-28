if (query.rand) this.randQuery = query.rand;
this.rand = Math.random();
if (query.mode === "self") {
    dpd.recursive.get({id: this.id, rand: this.rand}, function(result) {
        this.self = result;
    });
} else { 
    dpd.recursive.get(function(result, err) {
        this.more = result;
    });
}

