var Resource = require('../resource')
  , util = require('util')
  , path = require('path')
  , fs = require('fs');

function ClientLib(settings) {
  Resource.apply(this, arguments);
}
util.inherits(ClientLib, Resource);

ClientLib.prototype.handle = function (ctx, next) {
  var resource = this;

  if (ctx.url === '/') {
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

  res.write('\n\n //Automatically generated code\n\n');
  this.settings.resources.forEach(function(r) {
    clientLib.generateResource(r, res);
  });
  fn();
};

ClientLib.prototype.generateResource = function(r, res) {
  var jsName = r.settings.path.replace(/[^A-Za-z0-9]/g, '');

  if (r.clientGeneration && jsName) {
    res.write('dpd.' + jsName + ' = dpd("' + r.settings.path + '");\n')  
    if (r.clientGenerationDo) {
      for (var i = 0; i < r.clientGenerationDo.length; i++) {
        res.write('dpd.' + jsName + '.' + r.clientGenerationDo[i] + ' = function(path, body, fn) {\n');
        res.write('  return dpd.' + jsName + '.do("' + r.clientGenerationDo[i] + '", path, body, fn);\n');
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

  }

  res.write('\n');
  
};

module.exports = ClientLib;