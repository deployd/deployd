describe('Static', function(){
  describe('POST /avatars/eg.jpg', function(){
    it('should upload the file at the url', function(done) {
      var file = require('fs').createReadStream(__dirname + '/support/eg.jpg');
      
      client.use('/avatars/eg.jpg').post(file, function (err, body, req, res) {
        client.use('/avatars/eg.jpg').get(function (err, body, req, res) {
          expect(body).to.exist;
          done(err)
        })
      })
    })
  })
  
  describe('GET /avatars/eg.jpg', function(){
    it('should return the newly uploaded file', function(done) {
      var file = require('fs').createReadStream(__dirname + '/support/eg.jpg');
      
      client.use('/avatars/eg.jpg').post(file, function (err, body, req, res) {
        client.use('/avatars/eg.jpg').get(function (err, body, req, res) {
          expect(res.headers['transfer-encoding']).to.equal('chunked');
          expect(body).to.exist;
          done(err)
        })
      })
    })
  })
  
  describe('PUT /avatars/eg.jpg', function(){
    it('should replace the file', function(done) {
      var file = require('fs').createReadStream(__dirname + '/support/eg.jpg');
      
      client.use('/avatars/eg.jpg').put(file, function (err, body, req, res) {
        client.use('/avatars/eg.jpg').get(function (err, body, req, res) {
          expect(body).to.exist;
          done(err)
        })
      })
    })
  })
  
  describe('DELETE /avatars/eg.jpg', function(){
    it('should remove the file', function(done) {
      client.use('/avatars/eg.jpg').del(function (err, body, req, res) {
        client.use('/avatars/eg.jpg').get(function (err, body, req, res) {
          expect(body).to.not.exist;
          done(err);
        })
      })
    })
  })
})