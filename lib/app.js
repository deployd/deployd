var express = require('express')
  , app = express.createServer();

// expose the app as a module so everyone can use it
module.exports = app;

app.configure(function(){
  app.set('views', __dirname + '/../views');
  app.set('view engine', 'ejs');
  app.use(express.bodyParser());
  app.use(function(req, res, next) {
    var key = 'method'
      , method = req.param(key)
    ;
    
    req.originalMethod = req.originalMethod || req.method;
    // req.body
    if (method) {
      req.method = method.toUpperCase();
      if(req.body && key in req.body) delete req.body[key];
    // check X-HTTP-Method-Override
    } else if (req.headers['x-http-method-override']) {
      req.method = req.headers['x-http-method-override'].toUpperCase();
    }

    next();
  });
  app.use(express.cookieParser());
  app.use(express.session({ secret: 'your secret here', key: 'deployd.sid', cookie: {httpOnly: false} }));
  app.use(app.router);
  app.use(express.static(__dirname + '/../public'));
});

app.get('/', function(req, res) {
  res.send({home: true});
});

app.get('/config', function(req, res) {
  res.send({
    name: 'Hello World',
    host: 'foo.bar.com'
  })
});

app.get('/plugins', function(req, res) {
  res.send({
    results: [{
      name: 'Users',
      overview_html: '<p>The Users plugin lets you configure users...</p>',
      configurable_objects: [
        {name: "Roles &amp; Permissions"},
        {name: "Existing Users"
          , list: "User List"
          , source: "/users"
        },
        {name: "Model"},
        {
          name: "New User"
          , helper_text: "Fill out the form below to create a new user"
          , form: {
            action: "/user"
            , method: "POST"
            , fields: [
              {
                name: "Full Name"
                , type: "text"
                , required: true
              }
              , {
                name: "Email"
                , type: "email"
                , required: true
              },
              {
                name: "Password"
                , type: "password"
                , required: true
              }
              , {
                name: "Twitter"
                , type: "text"
                , required: false
              }
            ]
            
          }
        }
      ],
      _id: 1234
    },
    {
      name: "Phone",
      overview_html: '<p>The Phone plugin lets you configure phone stuff...</p>',
      configurable_objects: [
        {name: "Numbers"}
      ],
      
      _id: 2345
    }]
  })
});

app.get('/models', function(req, res) {
  res.send({
    results: [{
      plugin: 'Users',
      name: 'Users',
      _id: 5432
    }]
  })
});