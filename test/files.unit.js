// var Files = require('../lib/resources/files');

// describe('Files', function() {
//  describe('.handle(ctx, next)', function() {
//    it('should handle /', function() {
//      var resource = new Files({path: '/', public: __dirname + '/support/public'});
//      fauxContext(resource, 'index.html');
//    });

//    it('should call next when a file does not exist', function(done) {
//      var resource = new Files({path: '/', public: __dirname + '/support/public'});
//      fauxContext(resource, 'this-file-doesnt-exist.jpg', null, null, {
//        done: done,
//        next: true
//      });
//    });
//  });
// });