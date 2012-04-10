describe('Internal Collections', function(){
  describe('* /keys', function(){
    it('should not be available over http without a dpd key', function(done) {
      var ex = {key: 'foo', secret: 'bar'}
        , unauthed = require('../lib/client').use(client.url)
        , keys = unauthed.use('/keys')
      ;

      keys.post(ex, function (e, r) {
        keys.put(ex, function (err, res) {
          keys.del(function (error, resp) {
            keys.get(function (gerror, gresp) {
              expect(e && err && error && gerror).to.exist;
              expect(r || res || resp || gresp).to.not.exist;
              done();
            })
          })
        })
      })
    })
  })
  
  describe('* /resources', function(){
    it('should not be available over http without a dpd key', function(done) {
      var ex = {key: 'foo', secret: 'bar'}
        , unauthed = require('../lib/client').use(client.url);

      unauthed.use('/resources').post(ex, function (e, r) {
        unauthed.use('/resources').put(ex, function (err, res) {
          unauthed.use('/resources').del(function (error, resp) {
            unauthed.use('/resources').get(function (gerror, gresp) {
              expect(e && err && error && gerror).to.exist;
              expect(r || res || resp || gresp).to.not.exist;
              done();
            })
          })
        })
      })
    })
  })
  describe('* /types', function(){
    it('should not be available over http without a dpd key', function(done) {
      var ex = {key: 'foo', secret: 'bar'}
        , unauthed = require('../lib/client').use(client.url);

      unauthed.use('/types').post(ex, function (e, r) {
        unauthed.use('/types').put(ex, function (err, res) {
          unauthed.use('/types').del(function (error, resp) {
            unauthed.use('/types').get(function (gerror, gresp) {
              expect(e && err && error && gerror).to.exist;
              expect(r || res || resp || gresp).to.not.exist;
              done();
            })
          })
        })
      })
    })
  })
  describe('* /sessions', function(){
    it('should not be available over http without a dpd key', function(done) {
      var ex = {key: 'foo', secret: 'bar'}
        , unauthed = require('../lib/client').use(client.url);

      unauthed.use('/sessions').post(ex, function (e, r) {
        unauthed.use('/sessions').put(ex, function (err, res) {
          unauthed.use('/sessions').del(function (error, resp) {
            unauthed.use('/sessions').get(function (gerror, gresp) {
              expect(e && err && error && gerror).to.exist;
              expect(r || res || resp || gresp).to.not.exist;
              done();
            })
          })
        })
      })
    })
  })
})