// setup
beforeEach(function() {
  this.addMatchers({
    toExist: function() { return !!this.actual; },
    toNotExist: function() { return !this.actual; },
    toContainOne: function() { return this.actual && (this.actual.length === 1); }
  });
});

// sample data
var user = {
  email: 'skawful@gmail.com',
  name: 'Ritchie Martori',
  password: '1234'
};

var auth;

var app = {
  name: 'My Testing App',
  secret: 'tag soup'
};

var tests = {
  
  '1. creating a user': {
    route: '/users',
    data: user,
    expect: {
      _id: 'toExist',
      name: 'Ritchie Martori',
      password: 'toNotExist',
      errors: 'toNotExist'
    }
  },
  
  '3. add a user to group': {
    route: '/users/' + user.email + '/group',
    data: {group: 'root'},
    expect: {
      errors: 'toNotExist'
    }
  },
  
  '4. login a user': {
    route: '/users/login',
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
  
  '5. get current user': {
    route: '/me',
    expect: {
      email: user.email,
      name: user.name,
      password: 'toNotExist',
      errors: 'toNotExist'
    }
  },
  
  '6. searching users': {
    route: '/search?type=users&find={"email": "skawful@gmail.com"}',
    expect: {
      results: 'toExist', 
      errors: 'toNotExist'
    }
  },
  
  '7. creating an app': {
    route: '/apps',
    data: app,
    expect: {
      _id: 'toExist',
      name: app.name,
      errors: 'toNotExist'
    },
    after: function(result) {
      app = result;
    }
  },
  
  // search supports GET and POST
  // GET
  // my-app.d.com/search/apps?find={"creator": "someuser"}
  '8. list my apps': {
    route: '/search/apps',
    data: {
      creator: user.uid
    },
    expect: {
      results: 'toExist',
      errors: 'toNotExist'
    }
  },
  
  '9. validate users': {
    route: '/users',
    data: {asdf: 1234, uid: {foo: 'bar'}, password: 1111},
    expect: {
      errors: 'toExist'
    }
  },
  
  '10. only 1 user per email': {
    route: '/search/users', 
    data: {email: user.email},
    expect: {
      results: 'toContainOne'
    }
  },
  
  '11. only 1 app per name': {
    route: '/search/apps', 
    data: {name: app.name},
    expect: {
      results: 'toContainOne'
    }
  },
  
  '12. only 1 user': {
    route: '/search/users', 
    data: {},
    expect: {
      results: 'toContainOne'
    }
  }

  // '13. delete a user': {
  //   route: '/me?method=delete',
  //   expect: {
  //     errors: 'toNotExist'
  //   }
  // }
  
};

var testNames = Object.keys(tests)
  , sorted = testNames.sort(function(a, b) {
    // sort by the number in front of the test name
    return (Number(a.split('.')[0]) < Number(b.split('.')[0])) ? -1 : 1;
  })
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