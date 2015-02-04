if (ctx.query.testUncaughtError) {
  if (ctx.query.promise) {
    dpd.internalclientdetail.get({ masterId: this.id }).then(function (data) {
      throw "fail";
    });
  } else if (ctx.query.callback) {
    dpd.internalclientdetail.get({ masterId: this.id }, function (data, err) {
      throw "fail";
    });
  }
} else {
  if (ctx.query.promise) {
    dpd.internalclientdetail.get({ masterId: this.id }).then(function (data) {
      this.childrenPromise = data;
    }).catch(function () {
      this.shouldNotBeSet = true;
    }).catch(function () {
      this.shouldNotBeSet2 = true;
    }).then(function () {
      throw "test";
    }).catch(function (err) {
      this.seenError = err;
    }).finally(function (data) {
      this.seenFinally = true;
    });
  }
  
  if (ctx.query.callback) {
    dpd.internalclientdetail.get({ masterId: this.id }, function (data, err) {
      this.children = data;
    });
  }
}
