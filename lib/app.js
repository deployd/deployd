var express = require('express')
  , app = express.createServer()
;

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

app.get('/routes', function(req, res) {
  var routes = []
    , format = '       - '
    , method
    , supported = {GET:1, POST:1, DELETE:1, PUT:1}
  ;
  
  app.routes.all().forEach(function(route){
     method = route.method.toUpperCase();
     if(supported[method]) {
       routes.push(
           method
         + format.substr(method.length, format.length)
         + route.path
       );
     }
  });
  
  res.send(routes);
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

app.get('/models', function(req, res) {
  res.send({
    results: [{
      plugin: 'Users',
      name: 'Users',
      _id: 5432
    }]
  })
});

app.get('/plugins', function(req, res) {
  res.send({
    results: [{
      name: 'Users',
      overview_html: '<p>The Users plugin lets you configure users...</p>',
      configurable_objects: [
        {
          name: "Roles and Permissions"
          , id: 1
        },
        {
          name: "Existing Users"
          , id: 2
          , list: "User List"
          , source: "/users"
        },
        {
          name: "Model",
          id: 3,
          model_description: {
              password:"password",
              uid:"email",
              removed:"boolean",
              name:"string",
              auth:"string"
          },
          plugin: "graph",
          _id: "4ec48fa3d1a11cd925000007"
        },
        {
          /*
          description: {
            uid: 'email',
            password: 'password',
            name: 'string',
            auth: 'string',
            removed: 'boolean'
          },
          
          */
          name: "New User"
          , id: 4
          , helper_text: "Fill out the form below to create a new user"
          , form: {
            action: "/user"
            , method: "POST"
            , fields: [
              {
                name: "name"
                , label: "Full Name"
                , type: "text"
                , required: true
              },
              {
                name: "uid"
                , label: "Email"
                , type: "email"
                , required: true
              },
              {
                name: "password"
                , label: "Password"
                , type: "password"
                , required: true
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
        {
          name: "Numbers"
          , id: 1
        }
      ],
      
      _id: 2345
    }]
  })
});