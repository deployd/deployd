var Resource = require('../resource')
  , util = require('util')
  , path = require('path')
  , fs = require('fs')
  , async = require('async');

function ClientLib(name, options) {
  Resource.apply(this, arguments);
}
util.inherits(ClientLib, Resource);

ClientLib.prototype.load = function(fn) {
  var resource = this;

  async.parallel({
    dpdJs: function(callback) {
      fs.readFile(path.join(__dirname, '../../clib/dpd.js'), 'utf-8', callback);
    },
    socketIo: function(callback) {
      fs.readFile(path.join(__dirname, '../../clib/socket.io.min.js'), 'utf-8', callback);
    },
    ajax: function(callback) {
      fs.readFile(path.join(__dirname, '../../clib/ajax.js'), 'utf-8', callback);
    }
  }, function(err, results) {
    if (err) return fn(err);
    var file = results.socketIo + "\n\n"
             + results.ajax + "\n\n"
             + results.dpdJs;
    resource.clientLib = file;
    fn();
  });
};

ClientLib.prototype.handle = function (ctx, next) {
  var resource = this;

  if (ctx.url === '/') {
    ctx.res.setHeader('Content-Type', 'text/javascript');
    var lib = resource.clientLib;

    var host = ctx.req.headers.host;
    if (lib) lib = lib.replace('var root = window.location.origin;', 'var root = "http://' + host + '";');

    ctx.res.write(lib);
    resource.generate(ctx.res, function() {
      ctx.res.end();
    });
  } else {
    next();
  }
};

ClientLib.prototype.generate = function(res, fn) {
  var clientLib = this;

  res.write('\n\n// automatically generated code\n\n');
  this.config.resources.forEach(function(r) {
    clientLib.generateResource(r, res);
  });
  fn();
};

ClientLib.prototype.generateResource = function(r, res) {
  var jsName = r.path.replace(/[^A-Za-z0-9]/g, '')
    , i;

  if (r.clientGeneration && jsName) {
    res.write('dpd.' + jsName + ' = dpd("' + r.path + '");\n');  
    if (r.clientGenerationExec) {
      for (i = 0; i < r.clientGenerationExec.length; i++) {
        res.write('dpd.' + jsName + '.' + r.clientGenerationExec[i] + ' = function(path, body, fn) {\n');
        res.write('  return dpd.' + jsName + '.exec("' + r.clientGenerationExec[i] + '", path, body, fn);\n');
        res.write('}\n');
      }
    }
    if (r.clientGenerationGet) {
      for (i = 0; i < r.clientGenerationGet.length; i++) {
        res.write('dpd.' + jsName + '.' + r.clientGenerationGet[i] + ' = function(path, query, fn) {\n');
        res.write('  return dpd.' + jsName + '.get("' + r.clientGenerationGet[i] + '", path, query, fn);\n');
        res.write('}\n');
      }
    }
    // resource event namespacing sugar
    res.write('dpd.' + jsName + '.on = function(ev, fn) {\n');
    res.write('  return dpd.on("' + r.path.replace('/', '') + '" + ":" + ev, fn);\n');
    res.write('}\n');
    res.write('dpd.' + jsName + '.once = function(ev, fn) {\n');
    res.write('  return dpd.once("' + r.path.replace('/', '') + '" + ":" + ev, fn);\n');
    res.write('}\n');
    res.write('dpd.' + jsName + '.off = function(ev, fn) {\n');
    res.write('  return dpd.off("' + r.path.replace('/', '') + '" + ":" + ev, fn);\n');
    res.write('}\n');
  }

  if(r.external) {
    Object.keys(r.external).forEach(function (name) {
      res.write('dpd.' + jsName + '.' + name + ' = function (path, body, fn) {\n');
      res.write('  dpd.' + jsName + '.exec("' + name + '", path, body, fn);\n');
      res.write('}\n');
    });
  }
  
  res.write('\n');
};

module.exports = ClientLib;