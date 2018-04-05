module.exports = function(httpPort, httpsPort) {
  //Get nconf module
  var nconf = require('nconf');

  ////Get express.js module
  var express = require('express');

  //Get http/https modules
  var http = require('http');
  var https = require('https');

  //Create an instance of express.js for the app
  var app = express();
  app.get('/*',function(req,res) {
    res.send('Hello, World!');
  });
  
  //Create the servers and listen on the specified ports
  http.createServer(app).listen(httpPort);
  
}