var router = require("express").Router();

var fs = require("fs");

//Soundcloud resolve helper
var resolve = require("soundcloud-resolve");

var path = require("path");

module.exports = router;

router.get("/", function(req, res) {
  
  var type = req.query.type;
  var url = req.query.url;
  
  global.winston.info("AUDIO: [" + type + "] @ " + url);
  
  if (type == "soundcloud") {
    resolve("3BimZt6WNvzdEFDGmj4oeCSZfgVPAoVc", url, function(err, json, stream_url) {
      if (err) {
        //Something went wrong
        res.sendStatus(400);
      } else {
        //Check if the file already exists
        fs.open("cache/" + json.id + ".mp3", 'r', function(err) {
          if (err) {
            //File doesn't exist, get and save file
            require("request").get(stream_url).pipe(fs.createWriteStream("cache/" + json.id + ".mp3")).on("close", function() {
              res.sendFile(global._root + "/cache/" + json.id + ".mp3");
              
            });
             global.winston.debug("Loaded " + json.title + " by " + json.user.username);
          } else {
            res.sendFile(global._root + "/cache/" + json.id + ".mp3");
             global.winston.debug("Loaded " + json.title + " by " + json.user.username + " from the cache");
          }
        });
        
      }

    });
  } else {
    res.sendStatus(400);
  }
  
});