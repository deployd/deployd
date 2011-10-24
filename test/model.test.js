// deps
require('spawn');

var Model = require('model')
  , TestModel = Model.spawn({
      collection: 'tests',
    })
  , random = Math.random().toString()
  , data = {random: random, foo: 'bar', bat: 'baz'}
  , updates = {random: random, foo: 'bat'}
  , i = 0
;

module.exports = {
  
  'creating a new model': function(beforeExit, assert) {
    var triedRemoving = false
      , m = TestModel
      .spawn()
      .set(data)
      .notify(function(json) {
        var id = json._id;
        TestModel.spawn().set({_id: id}).notify(function(json) {
          assert.ok(json.random === random);
          m
            .set({random: 'foo'})
            .notify(function(json) {
              json.random && assert.ok(json.random == 'foo');
              if(!triedRemoving) {
                triedRemoving = true;
                m.notify(function(json) {
                  assert.ok(json.removed);
                  m.notify(function(json) {
                    assert.ok(!json._id);
                  })
                  .fetch();
                })
                .remove();
              }
            })
            .save()
          ;
        }).fetch();
        delete json._id;
        assert.eql(json, data);

      })
      .save()
    ;
    
    assert.ok(m.status() === 'write', 'should be writing');
    
    beforeExit(function() {
      assert.ok(triedRemoving);
    });
    assert.ok(m.isNew());
  },
  
  'find and update': function(done, assert) {
    var m = TestModel
      .spawn()
      .set(updates)
      .notify(function(json) {
        assert.ok(++i < 2, 'should not call notify more than once!');
        assert.eql(json.foo, updates.foo);
        m.remove();
      })
      .save()
    ;
  },
  
  'look for something that isn\'t there': function(done, assert) {
    TestModel
      .spawn()
      .set({baz: 'baz!!!!!'})
      .notify({
        send: function(json) {
          assert.eql(json, [{"message":"Does not exist","type":"Not Found"}]);
        }
      })
      .fetch()
    ;
  }
  
}
