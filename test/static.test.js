describe('Static', function(){
  describe('POST /avatars/eg.jpg', function(){
    it('should upload the file at the url', function(done) {
      var file = require('fs').createReadStream(__dirname + '/support/eg.jpg');
      
      client
        .use('/avatars/eg.jpg')
        .post(file, function (err, body, req, res) {
          client.use('/avatars/eg.jpg').get(function (err, body, req, res) {
            expect(body).to.exist;
            done(err);
          })
        })
    })
    
    it('should only allow root user access', function(done) {
      var file = require('fs').createReadStream(__dirname + '/support/eg.jpg', {encoding: 'base64'});
      unauthed.use('/avatars/eg.jpg').post(file, function (err) {
        expect(err).to.exist;
        done();
      })
    })
    
  })
  
  describe('GET /avatars/eg.jpg', function(){
    it('should return the newly uploaded file', function(done) {
      var fs = require('fs')
        , file = require('fs').createReadStream(__dirname + '/support/eg.jpg')
        , out = fs.createWriteStream(__dirname + '/support/out-eg.jpg')
      ;
      
      client.use('/avatars/eg.jpg').post(file, function (err, body, req, res) {
        client.use('/avatars/eg.jpg').pipe(out).get(function (err) {
          var same = fs.readFileSync(__dirname + '/support/eg.jpg').toString('base64') === fs.readFileSync(__dirname + '/support/out-eg.jpg').toString('base64');
          expect(same).to.equal(true);
          done(err)
        })
      })
    })
  })
  
  describe('PUT /avatars/eg.jpg', function(){
    it('should replace the file', function(done) {
      var file = require('fs').readFileSync(__dirname + '/support/eg.jpg');
      
      client.use('/avatars/eg.jpg').put(file, function (err, body, req, res) {
        client.use('/avatars/eg.jpg').get(function (err, body, req, res) {
          expect(body).to.exist;
          done(err)
        })
      })
    })
    
    it('should only allow root user access', function(done) {
      var file = require('fs').readFileSync(__dirname + '/support/eg.jpg');
      unauthed.use('/avatars/eg.jpg').put(file, function (err) {
        expect(err).to.exist;
        done();
      })
    })
  })
  
  describe('GET /avatars', function(){
    it('should return a directory listing', function(done) {
      client.use('/avatars').get(function (err, body, req, res) {
        expect(body).to.exist;
        expect(body).to.have.length(1);
        done(err)
      })
    })
  })
  
  describe('DELETE /avatars/test.txt', function(){
    it('should remove the file', function(done) {
      client.use('/avatars/test.txt').del(function (err, body, req, res) {
        client.use('/avatars/test.txt').get(function (err, body, req, res) {
          expect(body).to.not.exist;
          done(err);
        })
      })
    })
    
    it('should only allow root user access', function(done) {
      unauthed.use('/avatars/eg.jpg').del(function (err) {
        expect(err).to.exist;
        done();
      })
    })
  })
})

describe('Static Index', function(){
  describe('POST /eg.jpg', function(){
    it('should upload the file at the url', function(done) {
      var file = require('fs').readFileSync(__dirname + '/support/eg.jpg');
      
      client.use('/eg.jpg').post(file, function (err, body, req, res) {
        client.use('/eg.jpg').get(function (err, body, req, res) {
          expect(body).to.exist;
          done(err)
        })
      })
    })
    
    it('should only allow root user access', function(done) {
      var file = require('fs').readFileSync(__dirname + '/support/eg.jpg');
      unauthed.use('/eg.jpg').post(file, function (err) {
        expect(err).to.exist;
        done();
      })
    })
  })
  
  describe('GET /eg.jpg', function(){
    it('should return the newly uploaded file', function(done) {
      var fs = require('fs')
        , file = fs.createReadStream(__dirname + '/support/eg.jpg')
        , out = fs.createWriteStream(__dirname + '/support/out-eg.jpg')
      ;
      
      client.use('/eg.jpg').post(file, function (err, body, req, res) { 
        client.use('/eg.jpg').pipe(out).get(function (err) {
          done(err)
        })
      })
    })
  })
  
  describe('PUT /eg.jpg', function(){
    it('should replace the file', function(done) {
      var file = require('fs').readFileSync(__dirname + '/support/eg.jpg');
      
      client.use('/eg.jpg').put(file, function (err, body, req, res) {
        client.use('/eg.jpg').get(function (err, body, req, res) {
          expect(body).to.exist;
          done(err)
        })
      })
    })
    
    it('should only allow root user access', function(done) {
      var file = require('fs').readFileSync(__dirname + '/support/eg.jpg');
      unauthed.use('/eg.jpg').put(file, function (err) {
        expect(err).to.exist;
        done();
      })
    })
  })
  
  describe('GET /', function(){
    it('should return a directory listing', function(done) {
      client.use('/').get(function (err, body, req, res) {
        expect(body).to.exist;
        expect(body).to.have.length(1);
        done(err)
      })
    })
  })
  
  describe('DELETE /eg.jpg', function(){
    it('should remove the file', function(done) {
      client.use('/eg.jpg').del(function (err, body, req, res) {
        client.use('/eg.jpg').get(function (err, body, req, res) {
          expect(body).to.not.exist;
          done(err);
        })
      })
    })
    
    it('should only allow root user access', function(done) {
      unauthed.use('/eg.jpg').del(function (err) {
        expect(err).to.exist;
        done();
      })
    })
  })
})