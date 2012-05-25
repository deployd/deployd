var Resource = require('../lib/resource');

describe('resource', function(){
  describe('.match(url)', function(){
    function example(path, url, expected) {
      var r = new Resource({path: path})
        , result = r.match(url);
        
      if(result != expected) console.log('Match Error:', path, url, expected);
      expect(result).to.equal(expected);
    }
    
    it('should return true if the resource settings match the url', function() {
      // should pass
      example('/foo', '/foo', true);
      example('/foo', '/foo/index.html', true);
      example('/foo', '/foo/index.htm', true);
      example('/foo', '/foo?blah', true);
      example('/foo', '/foo?q={"foo":"bar"}', true);
      example('/foo', '/foo/', true);
      example('/foo', '/foo?', true);
      example('/foo', '/foo?q', true);
      example('/foo', '/foo?q=', true);
      example('/foo', '/foo?q=a', true);
      example('/foo', '/foo/some-id', true);
      example('/foo', '/foo/some-id/', true);
      example('/foo', '/foo/bar', true);
      example('/foo', '/foo/bar/', true);
      // should fail
      example('/foo', '/foo/bar/baz', false);
      example('/foo', '/foo/bar/baz/blah', false);
      example('/foo', '/foo/bar/baz/blah/a', false);
      example('/foo', '/foo/bar/baz/blah/a/b', false);
      example('/foo', '/foo/bar/baz/blah/a/b/c', false);
      example('/foo', '/foo/bar/baz/blah/a/', false);
      example('/foo', '/foo/bar/baz/blah/a/b/', false);
      example('/foo', '/foo/bar/baz/blah/a/b/c/', false);
      example('/foo', '/', false);
      example('/foo', 'foo', false);
      example('/foo', '/foo/../bar', false);
    })
  })
  
  describe('.parse(url)', function(){
    function example(url, basepath, id, parts, query) {
      var result = Resource.prototype.parse(url);
      
      expect(result).to.be.a('object');
      expect(result.basepath).to.equal(basepath);
      expect(result.id).to.equal(id);
      expect(result.parts).to.eql(parts);
      expect(result.query).to.eql(query || {});
    }
    
    it('should return a parsed url', function() {
      example('/foo/7?q=bar', 'foo', '7', ['foo', '7'], {q: 'bar'});
      example('/foo/bat', 'foo', 'bat', ['foo', 'bat']);
      example('/foo/bat/baz', 'foo', 'baz', ['foo', 'bat', 'baz']);
      // should also auto encode q={...}
      example('/foo/boo/bar/baz?q=' + encodeURI(JSON.stringify({"a":"b"})), 'foo', 'baz', ['foo', 'boo', 'bar', 'baz'], {'q':{'a': 'b'}});
    })
  })
  
  describe('.handle(req, res)', function(){
    it('should respond with 200 OK', function(done) {
      var r = new Resource({path: '/foo'});
      
      freq('/foo', null, function (req, res) {
        r.handle(req, res);
      }, function (req, res) {
        expect(res.statusCode).to.equal(200);
        done();
      })
    })
  })
})