var app = require('../app');

app.get('/app/:id', function(req, res) {
  res.send({app: req.param('id') || 0});
});