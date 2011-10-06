// setup
beforeEach(function() {
  this.addMatchers({
    toExist: function() { return !!this.actual; },
    toNotExist: function() { return !this.actual; }
  });
});

// sample data
var user = {
  uid: 'skawful@gmail.com',
  name: 'Ritchie Martori',
  password: '1234'
};

var auth;

var app = {
  name: 'My Testing App'
};

var tests = {
  
  'creating a user': {
    route: '/user',
    data: user,
    expect: {
      _id: 'toExist',
      name: 'Ritchie Martori',
      password: 'toNotExist',
      errors: 'toNotExist'
    }
  },
  
  'finding a user': {
    route: '/user/' + user.uid,
    expect: {
      _id: 'toExist',
      password: 'toNotExist',
      errors: 'toNotExist'
    }
  },
  
  'login a user': {
    route: '/user/login',
    data: user,
    expect: {
      _id: 'toExist',
      password: 'toNotExist',
      auth: 'toExist',
      errors: 'toNotExist'
    },
    complete: function(res) {
      auth = res.auth;
    }
  },
  
  'get me': {
    route: '/me',
    expect: {
      uid: user.uid,
      name: user.name,
      password: 'toNotExist',
      errors: 'toNotExist'
    }
  },
  
  'searching users': {
    route: '/search?type=user&find={uid: "skawful@gmail.com"}',
    expect: {
      results: 'toExist', 
      erros: 'toNotExist'
    }
  },
  
  'delete a user': {
    route: '/me?method=delete',
    expect: {
      errors: 'toNotExist'
    }
  },
  
};

// execute tests
for(var context in tests) {
  if(tests.hasOwnProperty(context)) {
    describe(context, function() {
      var test = tests[context];
      it('should hit ' + test.route, function() {
        
        var args = []
          , finished = false
          , complete = test.complete
          , callback = function(res) {
            console.log('finished');
              finished = true;
              complete && complete(res);
              // dynamic expects
              if(test.expect) {
                for(var p in test.expect) {
                  if(test.expect.hasOwnProperty(p)) {
                    var val = res[p]
                      , ex = expect(val)
                      , expected = test.expect[p]
                      , matcher = ex[expected]
                    ;
                    
                    jasmine.log('Expect', p, test.expect[p]);
                    
                    jasmine.log(' - Received: ' + val);
                    
                    matcher
                      ? ex[test.expect[p]]()
                      : ex.toEqual(expected)
                    ;
                  }
                }
              }
            }
        ;
        
        // build arguments do d()
        args.push(test.route);
        test.data && args.push(test.data);
        args.push(callback);
        
        // call d()
        d.apply(this, args);
        
        // wait for response
        waitsFor(function() {
          return finished;
        });
        
        // async continue
        runs(function() {
          expect(finished).toBeTruthy();
        });
      });
    })
  }
}