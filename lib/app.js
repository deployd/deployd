var express = require('express')
  , app = express.createServer()
  , db = require('./db').db
  , config = require('./config')
  , SessionStore = require('./session')(express)
;

// expose the app as a module so everyone can use it
module.exports = app;

app.configure(function(){
  
  app.set('views', __dirname + '/../views');
  app.set('view engine', 'ejs');
  
  app.enable('jsonp callback');
  app.use(express.bodyParser());
  
  app.use(function(req, res, next) {
    var key = 'method'
      , method = req.param(key)
    ;
    
    res.header('X-Powered-By', 'Deployd');
    
    // CORS support
    res.header('Access-Control-Allow-Origin', req.header('Origin'));
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    res.header('Access-Control-Allow-Credentials', 'true');
    
    req.originalMethod = req.originalMethod || req.method;
    // req.body
    if (method) {
      req.method = method.toUpperCase();
      if(req.body && key in req.body) delete req.body[key];
      if(req.query && key in req.query) delete req.query[key];
    // check X-HTTP-Method-Override
    } else if (req.headers['x-http-method-override']) {
      req.method = req.headers['x-http-method-override'].toUpperCase();
    }

    next();
  });
  
  app.use(express.cookieParser());
  
  app.use(express.session({
    secret: 'secret',
    key: 'deployd.sid',
    cookie: {httpOnly: false},
    store: new SessionStore
  }));
  
  function isUser() {
    return this.session && this.session.user;
  }
  
  function isRoot() {
    var user = this.isUser();
    return user && user.groups && user.groups.root;
  }
  
  app.use(function(req, res, next) {
    req.isUser = isUser;
    req.isRoot = isRoot;
    next();
  })
  
  app.use(app.router);
  app.use(express.static(__dirname + '/../public', {redirect: true}));
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
  res.redirect('/dashboard');
});

function redirect(req, res, next, isNew) {
  if(isNew) {
    // for brand new apps
    res.redirect('/setup.html');
  } else if(req.isRoot()) {
    // allow access for root users
    next();
  } else {
    // for logged in users trying
    // to get to the dashboard
    var error = '<h1>Access Denied</h1>';
    
    // let users know who they are signed in as
    if(req.isUser()) {
      error += 'You must be root to see the dashboard. You are logged in as ' + req.session.user.email;
    } else {
      res.redirect('/login.html');
      return;
    }
    
    res.send(error);
  }
}

app.get('/dashboard', function(req, res, next) {
  if(typeof app.isNew === 'function') {
    app.isNew(function(isNew) {
      redirect(req, res, next, isNew);
    });
  } else {
    redirect(req, res, true);
  }
});
