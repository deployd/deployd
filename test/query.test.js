describe('Queries', function(){
  describe('GET /todos?title=testing title', function(){
    it('should return the documents that match the query', function(done) {
      todos.post({title: 'testing title'}, function (err) {
        todos.use('?title=testing%20title').get(function (err, todos) {
          expect(todos).to.exist;
          expect(todos).to.have.length(1);
          done(err);
        })
      })
    })
  })
  
  describe('GET /todos?q={"title": "testing title"}', function(){
    it('should parse the JSON and return the documents that match the query', function(done) {
      todos.post({title: 'testing title'}, function (err) {
        todos.use('?q=' + encodeURI(JSON.stringify({title: 'testing title'}))).get(function (err, todos) {
          expect(todos).to.exist;
          expect(todos).to.have.length(1);
          done(err);
        })
      })
    })
  })
})

describe('Advanced Queries', function(){
  describe('GET /todos?q={"title": {$regex: "^title"}', function(){
    it('should parse the JSON and return the documents that match the query', function(done) {
      todos.post({title: 'title one'}, function (err) {
        todos.post({title: 'title two'}, function (err) {
          todos.post({title: 'another title'}, function (err) {
            todos.use('?q=' + encodeURI(JSON.stringify({title: {$regex: "^title"}}))).get(function (err, todos) {
              expect(todos).to.exist;
              expect(todos).to.have.length(2);
              done(err);
            })
          })
        })
      })
    })
  })
})