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