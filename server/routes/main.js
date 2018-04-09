var express = require('express');

//Path helper
var path = require('path');

//Create a router
var router = express.Router();

router.get('/js/*', function(req, res) {
  res.sendFile(path.resolve(global._root + '/app/scripts/' + req.params[0]));
});

router.get('/', function(req, res) {
  global.winston.info('Loading home page...');
  res.render('index', { title: 'Hey', message: 'Hello there!' })
});



module.exports = router;