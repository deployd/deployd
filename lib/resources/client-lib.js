var Resource = require('../resource')
  , util = require('util')
  , path = require('path')
  , fs = require('fs');

function ClientLib(name, options) {
  Resource.apply(this, arguments);
}
util.inherits(ClientLib, Resource);

ClientLib.prototype.handle = function (ctx, next) {
  var resource = this;

  if (ctx.url === '/') {
    ctx.res.setHeader('Content-Type', 'text/javascript');
    var f = fs.createReadStream(path.join(__dirname, '../../clib/dpd.js'));
    f.on('data', function(d) {
      ctx.res.write(d);
    });
    f.on('end', function() {
      resource.generate(ctx.res, function() {
        ctx.res.end();
      });
    });
    f.on('error', function(err) {
      ctx.done(err);
    });
  } else {
    next();
  }
}

ClientLib.prototype.generate = function(res, fn) {
  var clientLib = this;

  res.write('\n\n// automatically generated code\n\n');
  this.config.resources.forEach(function(r) {
    clientLib.generateResource(r, res);
  });
  fn();
};

ClientLib.prototype.generateResource = function(r, res) {
  var jsName = r.path.replace(/[^A-Za-z0-9]/g, '');

  if (r.clientGeneration && jsName) {
    res.write('dpd.' + jsName + ' = dpd("' + r.path + '");\n')  
    if (r.clientGenerationExec) {
      for (var i = 0; i < r.clientGenerationExec.length; i++) {
        res.write('dpd.' + jsName + '.' + r.clientGenerationExec[i] + ' = function(path, body, fn) {\n');
        res.write('  return dpd.' + jsName + '.exec("' + r.clientGenerationExec[i] + '", path, body, fn);\n');
        res.write('}\n');
      }
    }
    if (r.clientGenerationGet) {
      for (var i = 0; i < r.clientGenerationGet.length; i++) {
        res.write('dpd.' + jsName + '.' + r.clientGenerationGet[i] + ' = function(path, query, fn) {\n');
        res.write('  return dpd.' + jsName + '.get("' + r.clientGenerationGet[i] + '", path, query, fn);\n');
        res.write('}\n');
      }
    }
    // resource event namespacing sugar
    res.write('dpd.' + jsName + '.on = function(ev, fn) {\n');
    res.write('  return dpd.on("' + r.path.replace('/', '') + '" + ":" + ev, fn);\n');
    res.write('}\n');
  }

  if(r.external) {
    Object.keys(r.external).forEach(function (name) {
      res.write('dpd.' + jsName + '.' + name + ' = function (path, body, fn) {\n');
      res.write('  dpd.exec("' + name + '", path, body, fn);\n');
      res.write('}\n');
    })
  }
  
  res.write('\n');
};

module.exports = ClientLib;