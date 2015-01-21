dpd.internalclientdetail.get({masterId: this.id}).then(function (data) {
    this.childrenPromise = data;
});


dpd.internalclientdetail.get({masterId: this.id}, function(data, err) {
    this.children = data;
});
