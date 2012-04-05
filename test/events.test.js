describe('Resource Events', function(){
  describe('POST /todos', function(){
    it('should execute the todos POST event handler', function(done) {
      todos.post({title: 'post event handler test'}, function (err, todo) {
        expect(todo._id).to.exist;
        expect(todo.isPost).to.equal(true);
        done(err);
      })
    })
  })
  describe('GET /todos', function(){
    it('should execute the todos GET event handler', function(done) {
      todos.post({title: 'feed the dog'}, function (err) {
        todos.get(function (err, all) {
          expect(all).to.exist;
          all.forEach(function (todo) {
            expect(todo.isGet).to.equal(true);
          })
          done(err);
        })
      })
    })
  })
  describe('PUT /todos', function(){
    it('should execute the todos PUT event handler', function(done) {
      todos.post({title: 'foo'}, function (e, t) {        
        todos.get(function (e, all) {        
          todos.get({_id: all[0]._id}).put({title: 'post event handler test'}, function (err, todo) {
            expect(todo.isPut).to.equal(true);
            done(err);
          })  
        })  
      })
    })
  })
  describe('DELETE /todos', function(){
    it('should execute the todos DELETE event handler', function(done) {
      todos.post({title: 'dont delete'}, function (e, r) {
        todos.use('/' + r._id).get(function (err, res) {
          todos.get({_id: res._id}).del(function (err) {
            expect(err).to.exist;
            expect(err.message).to.equal('dont delete');
            done();
          })
        })
      })
    });

    it('should execute the todos DELETE event handler and cancel', function(done) {
      todos.post({title: 'blank cancel'}, function (e, r) {
        todos.use('/' + r._id).del(function (err) {
          expect(err).to.exist;
          done();
        })
      })
    });

    it('should not cancel as root', function(done) {
      todos.post({title: 'dont delete'}, function(err, todo, req, res) {
        client.use('/todos/' + todo._id).del(function(err) {
          expect(err).to.not.exist;
          done(err);
        });
      })
    });
  })
})