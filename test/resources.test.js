var resources = require('../')
  , expect = require('chai').expect
  , resources = require('../lib/resources')
;

var description = {
  type: 'Data',
  properties: {
    title: {
      description: 'the title of the todo',
      type: 'string',
      required: true
    },
    completed: {
      description: 'the state of the todo',
      type: 'boolean',
      default: false
    }
  }
};

function clean() {
  describe('resources clean', function(){
    it('should remove all resources', function(done) {
      resources.del(function (err, res) {
        resources.get(function (err, res) {
          expect(res).to.not.exist;
          done(err);
        })
      })
    })
  })
}

describe('Resource Actions', function(){
      
  clean();
  
  describe('Adding', function(){
    it('should add a new resource', function(done) {
      resources.post(description, function (err, r) {
        description._id = r._id;
        expect(r._id).to.exist;
        resources.get({_id: r._id}, function (err, r) {
          expect(r).to.exist;
          done(err);
        })
      })
    })
  })
  
  describe('resources.put()', function(){
    it('should update the resource', function(done) {
      resources
        .get({_id: description._id})
        // change title to task
        .put({$set: {'properties.title': null, 'properties.task': description.properties.title}}, function (err, r) {
          resources.get({_id: description._id}, function (err, r) {
            expect(r.properties.task).to.eql(description.properties.title);
            done(err);
          })
        })
    })
  })
  
  describe('resources.get()', function(){
    it('should get the resource', function(done) {
      resources.get({_id: description._id}, function (err, r) {
        expect(r).to.exist;
        done(err);
      })
    })
  })

  describe('resources.del()', function(){
    it('should delete the resource', function(done) {
      resources.del({_id: description._id}, function (err, r) {
        resources.get({_id: description._id}, function (err, r) {
          expect(r).to.not.exist;
          done(err);
        })
      })
    })
  })

  clean();
  
})

