describe('Application Resrouce Types', function(){
  describe('GET /resources', function(){
    it('should return a list of resources', function(done) {
      resources.get(function(err, res) {
        data.resources.todos._id = res[0]._id;
        expect(res[0]).to.eql(data.resources.todos);
        done(err);
      })
    })
  })
  
  describe('GET /resources?path=', function(){
    it('should return a single result', function(done) {
      resources.get({path: '/users'}, function (err, res) {
        expect(res).to.have.length(1);
        done(err);
      })
    })
  })
  
  describe('POST /resources', function(){
    it('should add a new resource', function(done) {
      clear(function (e) {        
        resources.post(data.resources.todos, function (err, res) {
          resources.get({path: data.resources.todos.path}, function (error, r) {
            expect(r[0]).to.eql(res);
            done(error || err);
          })
        })
      })
    })
  })
  
  describe('PUT /resources', function(){
    it('should updated the resources that match the query', function(done) {
      resources.get({path: data.resources.todos.path}).put({$set: {path: '/foo'}}, function (err) {
        resources.get({path: '/foo'}, function (error, res) {
          expect(res).to.have.length(1);
          done(error || err);
        })
      })
    })
  })
  
  describe('PUT /resources/<ObjectID>', function(){
    it('should updated the resources by id', function(done) {
      resources.get(function (e, all) {
        var res = all[0];
        res.order = 777;
        res.properties.foo = {
          type: 'string'
        };
        
        resources.use('/' + res._id).put(res, function (err, upd) {
          // FIXES NESTED MDOQ-HTTP BUG :(
          resources.req = {};
          resources.get(function (error, chgd) {            
            var i;
            
            // REMOVE ONCE MDOQ-HTTP IS PATCHED!
            while(i = chgd.shift()) {
              if(i._id == res._id) break;
              else i.properties && expect(i.properties.foo).to.not.exist;
            }
            
            expect(i.order).to.equal(777);
            done(err);
          })
        })
      })
    })
  })
  
  describe('PUT /resources/<ObjectID>', function(){
    it('should rename change properties on any existing data', function(done) {
      var exTodo = {title: 'feed fido', completed: true};
      todos.post(exTodo, function (err, res) {
        expect(err).to.not.exist;
        expect(res._id).to.exist;
        resources.get({path: '/todos'}, function (e, all) {
          var res = all[0]
            , titleProp = res.properties.title;
            
          titleProp.$renameFrom = 'title';
          res.properties.task = titleProp;
          // remove title prop
          delete res.properties.title;

          resources.use('/' + res._id).put(res, function (err, upd) {
            expect(err).to.not.exist;
            expect(upd.properties.task).to.eql(res.properties.task);
            todos.get(function (error, all) {
              all.forEach(function (todo) {
                expect(todo.title).to.not.exist;
                expect(todo.task).to.exist;
              })
              done(error || err);
            })
          });
        })
      })
    })
  })
  
  describe('DELETE /resources', function(){
    it('should remove all resources or those that match the query', function(done) {
      resources.del(function (err) {
        resources.get(function (error, all) {
          expect(all).to.not.exist;
          done(error || err);
        })
      })
    })
  })
})