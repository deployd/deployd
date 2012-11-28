var util = require('util')
  , Resource = require('../resource')
  , fs = require('fs')
  , path = require('path')
  , q = require('q')
  , qutil = require('../util/qutil')
  , Deployment = require('../client/deploy').Deployment;

function InternalDeployments() {
  Resource.apply(this, arguments);
  this.deploymentsFile = this.config.deploymentsFile || './.dpd/deployments.json';
}
util.inherits(InternalDeployments, Resource);
module.exports = InternalDeployments;

InternalDeployments.prototype.handle = function(ctx, next) {
  if (!ctx.req.isRoot) {
    ctx.done({statusCode: 401, message: "Not Allowed"});
    return;
  }

  if (ctx.method === "GET" && ctx.url === "/") {
    this.getList(ctx, next);
  } else if (ctx.method === "POST" && ctx.url === "/authenticate") {
    this.authenticate(ctx, next); 
  } else if (ctx.method === "GET" && ctx.url === '/online') {
    this.getOnline(ctx, next);
  } else {
    next();
  }
};

InternalDeployments.prototype.getList = function(ctx, next) {
  var self = this;
  var fileQ = q.ninvoke(fs, 'readFile', self.deploymentsFile, 'utf-8');

  var listQ = fileQ.then(function(file) {
    var deploymentsJson = JSON.parse(file);
    var list = [];
    Object.keys(deploymentsJson).forEach(function(k) {
      if (k !== 'sid' && k !== 'user') {
        deploymentsJson[k].id = k;
        list.push(deploymentsJson[k]);
      }
    });

    list.sort(function(a, b) {
      return a.id.localeCompare(b.id);
    });

    return list;
  }, function(err) {
    if (err.code === "ENOENT") {
      return [];
    } else {
      throw err;
    }
  });

  listQ.then(function(list) {
    ctx.done(null, list);
  }, function(err) {
    ctx.done(err);
  });

};

InternalDeployments.prototype.getOnline = function(ctx, next) {
  var d = new Deployment('.', null, '');

  d.getOnlineDeployments(function(err, deployments) {
    console.log(err, deployments);
    ctx.done(err, deployments);
  });
};

InternalDeployments.prototype.authenticate = function(ctx, next) {
  var d = new Deployment('.', null, '');


  if (ctx.body && ctx.body.username) {
    d.authenticate(ctx.body, callback);  
  } else {
    d.authenticate(callback);
  }

  function callback(ok) {
    if (ok) {
      ctx.done(null, {success: true});
    } else {
      ctx.done({error: "Not authenticated"});
    }
  }
  
};