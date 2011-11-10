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
  host: 'my-testing-app.skawful@gmail.com',
  name: 'My Testing App'
};

var tests = {
  
  '1. creating a user': {
    route: '/user',
    data: user,
    expect: {
      _id: 'toExist',
      name: 'Ritchie Martori',
      password: 'toNotExist',
      errors: 'toNotExist'
    }
  },
  
  '2. finding a user': {
    route: '/user/' + user.uid,
    expect: {
      _id: 'toExist',
      password: 'toNotExist',
      errors: 'toNotExist'
    }
  },
  
  '3. login a user': {
    route: '/user/login',
    data: user,
    expect: {
      _id: 'toExist',
      password: 'toNotExist',
      auth: 'toExist',
      errors: 'toNotExist'
    },
    after: function(res) {
      auth = res.auth;
    }
  },
  
  '4. get me': {
    route: '/me',
    expect: {
      uid: user.uid,
      name: user.name,
      password: 'toNotExist',
      errors: 'toNotExist'
    }
  },
  
  '5. searching users': {
    route: '/search?type=users&find={"uid": "skawful@gmail.com"}',
    expect: {
      results: 'toExist', 
      errors: 'toNotExist'
    }
  },
  
  '6. delete a user': {
    route: '/me?method=delete',
    expect: {
      errors: 'toNotExist'
    }
  },
  
  '7. creating an app': {
    route: '/app',
    data: app,
    expect: {
      _id: 'toExist',
      name: app.name,
      errors: 'toNotExist'
    },
    after: function(result) {
      app = result;
      console.log(app);
    }
  },
  
  '8. list my apps': {
    route: '/apps',
    expect: {
      results: 'toExist',
      errors: 'toNotExist'
    }
  },
  
  '9. get 1 app': {
    route: '/app/' + app._id,
    expect: {
      _id: app._id,
      name: app.name,
      errors: 'toNotExist',
      plugins: 'toExist'
    }
  }
  
};

var testNames = Object.keys(tests)
  , sorted = testNames.sort()
;

// execute tests
for(var i = 0; i < sorted.length; i++) {
  var context = sorted[i];
  if(tests.hasOwnProperty(context)) {
    describe(context, function() {
      var test = tests[context]
        , route = typeof test.route === 'function' ? test.route() : test.route
      ;
      
      it('should hit ' + route, function() {
        
        var args = []
          , finished = false
          , after = test.after
          , callback = function(res) {
            console.log('finished');
              finished = true;
              after && after(res);
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
        
        // build arguments
        args.push(route);
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