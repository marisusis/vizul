//Get nconf module
var nconf = require('nconf');

////Get express.js module
var express = require('express');

//Get http/https modules
var http = require('http');
var https = require('https');

//Create an instance of express.js for the app
var app = express();

//Set the ports for the http/https servers
const httpPort = 8080;
const httpsPort = 8081;


//Create the servers and listen on the specified ports
http.createServer(app).listen(httpPort);

/*
 * need to add options required by https
 * https.createServer(app, options).listen(httpsPort);
 */