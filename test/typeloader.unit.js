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
    var createPackageJson = function(opts) {
      if (fs.existsSync(basepath)) {
        sh.rm('-rf', basepath);
      }
      sh.mkdir('-p', basepath);
      sh.cp('./lib/resource.js', basepath + '/resource.js');
      sh.cp('./lib/script.js', basepath + '/script.js');
      var pack = {dependencies:
        {'dpd-fileupload':'^0.0.10', 'dpd-count': '0.0.1'}
      };

      if(opts.ignore){
        pack.dpdIgnore = ["dpd-count"];
      }

      if(opts.include){
        pack.dpdInclude = ["dpd-count"];
      }

      JSON.stringify(pack).to(path.join(basepath, 'package.json'));
      sh.mkdir('-p', path.join(basepath, 'node_modules/dpd-fileupload'));
      var dpdFileuploadIndexJs = "var Resource   = require('../../resource');\n";
          dpdFileuploadIndexJs += "util = require('util');\n";
          dpdFileuploadIndexJs += "function Fileupload() { console.log('type-loader');}\n";
          dpdFileuploadIndexJs += "util.inherits(Fileupload, Resource);\n";
          dpdFileuploadIndexJs += "module.exports = Fileupload;\n";
      dpdFileuploadIndexJs.to(path.join(basepath + '/node_modules/dpd-fileupload', 'index.js'));
      sh.mkdir('-p', path.join(basepath, 'node_modules/dpd-event'));

      sh.mkdir('-p', path.join(basepath, 'node_modules/dpd-count'));
      var dpdCountIndexJs = "var Resource   = require('../../resource');\n";
          dpdCountIndexJs += "util = require('util');\n";
          dpdCountIndexJs += "function Count() { console.log('type-loader');}\n";
          dpdCountIndexJs += "util.inherits(Count, Resource);\n";
          dpdCountIndexJs += "module.exports = Count;\n";
      dpdCountIndexJs.to(path.join(basepath + '/node_modules/dpd-count', 'index.js'));
      sh.mkdir('-p', path.join(basepath, 'node_modules/dpd-count'));

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


    it('should load the default resources and the customResources based on package.json (w dpdIgnore)', function(done) {
      createPackageJson({ignore: true});
      TypeLoader(basepath, function(resources, customResources) {
        expect(customResources).to.not.be.empty;
        expect(customResources).to.include.keys('Fileupload');
        expect(customResources).to.not.include.keys('Count');
        done();
      });
    });

    it('should load the default resources and the customResources based on package.json (w dpdInclude)', function(done) {
      createPackageJson({include: true});
      TypeLoader(basepath, function(resources, customResources) {
        expect(customResources).to.not.be.empty;
        expect(customResources).to.not.include.keys('Fileupload');
        expect(customResources).to.include.keys('Count');
        done();
      });
    });


  });
});
