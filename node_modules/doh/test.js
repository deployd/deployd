var sh = require('shelljs');
var tests = [];
expect = require('chai').expect;

test = function (title, fn) {
  tests.push({title: title, fn: fn});
}

fail = function (msg) {
  console.log('\t\t✖ ' + msg);
  process.exit();
}

sh.ls('test/*.js').forEach(function (test) {
  require('./' + test);
});

function run(t) {
  if(t && t.fn) {
    console.log('\t' + t.title);
    t.fn(function (err) {
      if(err) return fail(err);
      console.log('\t\t' + '✔ ok');
      run(tests.shift());
    });
  } else {
    console.log('[all passed...]');
    process.exit();
  }
}

console.log('[running tests]');

run(tests.shift());