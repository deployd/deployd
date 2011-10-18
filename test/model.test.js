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
    var m = TestModel
      .spawn()
      .set(data)
      .notify(function(json) {
        console.log('json', json);
        assert.eql(json, data);
      })
      .save()
    ;
    console.log(m);
  },
  
  // 'find and update': function(done, assert) {
  //   TestModel
  //     .spawn()
  //     .set(data)
  //     .notify(function(json) {
  //         assert.eql(json, data);
  //     })
  //     .fetch()
  //   ;
  // },
  // 
  // 'remove': function(done, assert) {
  //   TestModel
  //     .spawn()
  //     .set(data)
  //     .notify(function(json) {
  //       assert.ok(json.removed);
  //     })
  //   ;
  // }
  
}
