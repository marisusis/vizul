module.exports = function() {
  
  //log cwd
  global.winston.info("CWD: " + process.cwd());
  
  //Get nconf module
  var nconf = require("nconf");

  ////Get express.js module
  var express = require("express");
  
  //Send seekable
  var sendSeekable = require("send-seekable");

  //Get http/https modules
  var http = require("http");
  var https = require("https");

  //Create an instance of express.js for the app
  var app = express();
  
  app.use(sendSeekable);
  
  //Use the pug templating engine
  app.set("view engine", "pug");
  app.set("views", process.cwd() + "/app/views/");
  
  //Audio router
  app.use("/audio", require("./routes/audio.js"));
  
  //Root router
  app.use("/",require("./routes/main.js"));
  
  //Create the servers and listen on the specified ports
  http.createServer(app).listen(8080);
  
}