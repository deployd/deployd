describe('POST /keys', function(){
  it('should not be available over http without a root key', function(done) {
    var ex = {key: 'foo', secret: 'bar'}
      , unauthed = require('../lib/client').use(client.url);
    
    unauthed.use('/keys').post(ex, function (e, r) {
      unauthed.use('/keys').put(ex, function (err, res) {
        unauthed.use('/keys').del(function (error, resp) {
          unauthed.use('/keys').get(function (gerror, gresp) {
            expect(e && err && error && gerror).to.exist;
            expect(r || res || resp || gresp).to.not.exist;
            done();
          })
        })
      })
    })
  })
})

describe('Internal Resources', function(){
  it('should not be available without root credentials', function(done) {
    var unauthed = require('mdoq').use(function (req, res, next) {
      req.headers['x-dssh-key'] = 'wrong';
      next();
    }).use(require('../lib/client')).use(client.url);
    
    unauthed.use('/resources').get(function (err, res) {
      expect(err).to.exist;
      done();
    })
  })
})