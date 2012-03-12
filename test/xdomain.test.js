describe('Cross Domain Support', function(){
  describe('OPTIONS /todo', function(){
    it('should include Access-Control-Allow-Headers', function(done) {
      var hdrs = 'GET, POST, PUT, DELETE'
        , req = {method: 'OPTIONS', url: todos.url, headers: {'Access-Control-Request-Headers': hdrs}}
      ;
      todos.exec(req, function (err, body, req, res) {
        expect(res.headers['Access-Control-Allow-Headers'.toLowerCase()]).to.equal('*');
        done(err);
      })
    })
  })
  describe('* /todos', function(){
    it('should include Access-Control-Allow-* headers', function(done) {
      todos.get(function (err, body, req, res) {
        expect(res.headers['Access-Control-Allow-Origin'.toLowerCase()]).to.equal('*');
        expect(res.headers['Access-Control-Allow-Methods'.toLowerCase()]).to.equal('GET, POST, PUT, DELETE, OPTIONS');
        expect(res.headers['Access-Control-Allow-Credentials'.toLowerCase()]).to.equal('true');
        done(err);
      })
    })
  })
})