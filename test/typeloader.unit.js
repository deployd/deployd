var TypeLoader = require('../lib/type-loader')
  , path = require('path')
  , fs = require('fs')
  , Server = require('../lib/server')
  , basepath = __dirname + '/support/proj';


describe('type-loader', function(){

  afterEach(function() {
    if (fs.existsSync(basepath)) {
        sh.rm('-rf', basepath);
      }
  });

  describe('.loadTypes(basepath, fn)', function() {
    var createPackageJson = function() {
      if (fs.existsSync(basepath)) {
        sh.rm('-rf', basepath);
      }
      sh.mkdir('-p', basepath);
      sh.cp('./lib/resource.js', basepath + '/resource.js');
      sh.cp('./lib/script.js', basepath + '/script.js');
      JSON.stringify({dependencies: {'dpd-fileupload':'^0.0.10'}}).to(path.join(basepath, 'package.json'));
      sh.mkdir('-p', path.join(basepath, 'node_modules/dpd-fileupload'));
      var dpdFileuploadIndexJs = "var Resource   = require('../../resource');\n";
          dpdFileuploadIndexJs += "util = require('util');\n";
          dpdFileuploadIndexJs += "function Fileupload() { console.log('type-loader');}\n";
          dpdFileuploadIndexJs += "util.inherits(Fileupload, Resource);\n";
          dpdFileuploadIndexJs += "module.exports = Fileupload;\n";
      dpdFileuploadIndexJs.to(path.join(basepath + '/node_modules/dpd-fileupload', 'index.js'));
      this.server = new Server();
    };


    it('should load the default resources', function(done) {
      TypeLoader(basepath, function(resources, customResources) {

        expect(resources).to.not.be.empty;
        expect(resources).to.include.keys('ClientLib');
        expect(resources).to.include.keys('Collection');
        expect(resources).to.include.keys('Dashboard');
        expect(resources).to.include.keys('Files');
        expect(resources).to.include.keys('InternalResources');
        expect(resources).to.include.keys('UserCollection');

        expect(customResources).to.be.empty;
        done();
      });
    });


    it('should load the default resources and the customResources based on package.json', function(done) {
      createPackageJson();
      TypeLoader(basepath, function(resources, customResources) {

        expect(customResources).to.not.be.empty;
        expect(customResources).to.include.keys('Fileupload');
        done();
      });
    });


  });
});
