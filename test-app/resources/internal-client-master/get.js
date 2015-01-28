dpd.internalclientdetail.get({masterId: this.id}).then(function (data) {
    this.childrenPromise = data;
}).finally(function (data) {
    this.seenFinally = true;
});


dpd.internalclientdetail.get({masterId: this.id}, function(data, err) {
    this.children = data;
});