var Monitor = require('../lib/monitor');

describe('Monitor', function(){
  describe('Dynamic Commands', function(){
    it('should execute a command on the child process', function(done) {
      var monitor = new Monitor(__dirname + '/support/sample-start.js', {silent: true});
      monitor.start(function (err, commands) {
        commands.test('hello world', function (err, msg) {
          expect(msg).to.equal('hello world');
          done();
        })
      })
    })
  })

  it('should restart processes after they crash', function(done) {
    this.timeout(10000);
    var monitor = new Monitor(__dirname + '/support/sample-start.js', {silent: true});
    monitor.start(function (err, commands, restarting) {
      if(restarting) {
        setTimeout(function () {
          commands.test('hello world', function (err, msg) {
            expect(msg).to.equal('hello world');
            done();
          });
        }, 100);
      } else {
        commands.crash();
      }
    })
  })
})