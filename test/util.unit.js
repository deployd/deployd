var http = require('../lib/util/http')
	,	Stream = require('stream');

describe('uuid', function() {
	describe('.create()', function() {
		var uuid = require('../lib/util/uuid');
		var used = {};
		// max number of objects that must not conflict
		// total of about 2 trillion possible combinations
		var i = 1000; // replace this with a larger number to really test
		while(i--) {
			var next = uuid.create();
			if(used[next]) throw 'already used';
			used[next] = 1;
		}
	});
});

describe('http', function() {
	describe('.parseQuery', function() {
		it('should parse a query string', function() {
			var q = http.parseQuery('/foo/bar?foo=bar');
			expect(q).to.eql({foo:'bar'});
		});

		it('should parse a json query string', function() {
			var q = http.parseQuery('/foo/bar?{"foo":"bar"}');
			expect(q).to.eql({foo:'bar'});
		});
	});


describe('.parseBody()', function() {
  beforeEach(function () {
    this.res = {
      setHeader: function () {
        
      }
    };
  });

  it ('should parse json', function(done) {
    var obj = {foo: 'bar'}
      , req = new Stream();

    http.parseBody(req, this.res, 'application/json', function(err, result) {
      expect(err).to.not.exist;
      expect(req.body).to.eql(obj);
      done();
    });
    req.emit('data', JSON.stringify(obj));
    req.emit('end');
  });

  it('should parse json in chunks', function(done) {
    var req = new Stream()
      , chunks = ['{"fo'
                , 'o": "bar"'
                , ', "bar"'
                , ': "baz"'
                , '}'];

    http.parseBody(req, this.res, 'application/json', function(err) {
      expect(err).to.not.exist;
      expect(req.body).to.eql({"foo": "bar", "bar": "baz"});
      done();
    });
    chunks.forEach(function(c) {
      req.emit('data', c);
    });
    req.emit('end');
  });

  it('should parse a form url-encoded value', function(done) {
    var value = "foo=bar&bar=baz"
      , req = new Stream();

    http.parseBody(req, this.res, 'application/x-www-form-urlencoded', function(err) {
      expect(err).to.not.exist;
      expect(req.body).to.eql({"foo": "bar", "bar": "baz"});
      done();
    });
    req.emit('data', value);
    req.emit('end');
  });
  
  it('should interpret an empty body as an empty object', function(done) {
    var req = new Stream();

    http.parseBody(req, this.res, 'application/json', function(err) {
      expect(err).to.not.exist;
      expect(req.body).to.eql({});
      done();
    });
    req.emit('end');
  });
});
});

