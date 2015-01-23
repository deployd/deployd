dpd.internalclientdetail.get({masterId: this.id}).then(function (data) {
    this.childrenPromise = data;
}.bind(this));


dpd.internalclientdetail.get({masterId: this.id}, function(data, err) {
    this.children = data;
}.bind(this));