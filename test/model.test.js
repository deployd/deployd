// deps
require('spawn');

var Model = require('model')
  , TestModel = Model.spawn({
      collection: 'tests',
    })
  , data = {id: 1234, foo: 'bar', bat: 'baz'}
;


module.exports = {
  
  'creating a new model': function(done, assert) {
    TestModel
      .spawn(data)
      .notify(function(json) {
        assert.eql(json, data);
      })
      .save()
    ;
  },
  
  'find and update': function(done, assert) {
    TestModel
      .spawn(data)
      .notify(function(json) {
          assert.eql(json, data);
      })
      .fetch()
    ;
  },
  
  'remove': function(done, assert) {
    TestModel
      .spawn(data)
      .notify(function(json) {
        assert.ok(json.removed);
      })
    ;
  }
  
}
