describe('Resource Actions', function(){
  describe('GET /todos', function(){
    it('should return the todos', function(done) {
      todos.post({title: 'foo todo'}, function (err) {
        todos.get(function (error, all) {
          expect(all).to.have.length(1);
          done(error || err);
        })
      })
    })
  })
  
  describe('POST /todos', function(){
    it('should return an error when provided invalid data', function(done) {
      todos.post({foo: 'bar', bat: 'baz'}, function (err, todo, req, res) {
        expect(err).to.exist;
        expect(err.valid).to.equal(false);
        expect(err.errors).to.have.length(1);
        expect(todo).to.not.exist;
        done();
      })
    })
    
    it('should save the todo when valid', function(done) {
      todos.post({title: 'feed the cat'}, function (err, todo) {
        expect(todo._id).to.exist;
        done(err);
      })
    })
  })
  
  describe('GET /todos/<ObjectID>', function(){
    it('should return a single item', function(done) {
      todos.post({title: 'a random todo'}, function (err, todo) {
        todos.use('/' + todo._id).get(function (e, t) {
          expect(t).to.exist;
          expect(t).to.be.a('object');
          expect(t._id).to.equal(todo._id);
          done(e);
        })
      })
    })
  })
  
  describe('PUT /todos/<ObjectID>', function(){
    it('should update a single item', function(done) {
      todos.post({title: 'a random todo'}, function (e, t) {
        t.title = 'foobar';
        todos.use('/' + t._id).put(t, function (error, todo) {
          todos.use('/' + todo._id).get(function (err) {
            expect(t.title).to.equal('foobar');
            done(err);
          })
        })
      })
    })
    
    it('should error when an id is not included', function(done) {
      unauthed.use('/todos').put({title: 'foo'}, function (err) {
        expect(err).to.exist;
        done();
      })
    })
  })
  
  describe('DELETE /todos/<ObjectID>', function(){
    it('should delete the todo', function(done) {
      todos.post({title: 'a random todo'}, function (e, t) {
        todos.use('/' + t._id).del(function (error) {
          todos.use('/' + t._id).get(function (err, todo) {
            expect(todo).to.not.exist;
            done(err);
          })
        })
      })
    })
    
    it('should error when an id is not included', function(done) {
      unauthed.use('/todos').del(function (err) {
        expect(err).to.exist;
        done();
      })
    })
  })
})