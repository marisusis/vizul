var router = require("express").Router();

var md5 = require("md5");

//Youtube downloader
var ytdl = require("youtube-dl");

var request = require("request");

//Get url module
const {
  URL
} = require("url");

var fs = require("fs");

//Soundcloud resolve helper
var resolve = require("soundcloud-resolve");

//Path module
var path = require("path");

module.exports = router;

router.get("/", function(req, res) {

  var url = new URL(req.query.url);

  //   res.send(url.hostname);

  if(url.hostname == "soundcloud.com") {
    resolve("3BimZt6WNvzdEFDGmj4oeCSZfgVPAoVc", req.query.url, function(err, json, stream_url) {
      var data = md5(json.id);
      if(err) {
        //Something went wrong
        res.sendStatus(400);
      } else {
        var send = {
                title: json.title,
                artist: json.user.username,
                key: data,
          artwork: json.artwork_url
              };
        
        //Check if the file already exists
        fs.open("cache/" + data, 'r', function(err) {
          if(err) {


            //File doesn't exist, get and save file
            require("request").get(stream_url).pipe(fs.createWriteStream("cache/" + data)).on("close", function() {
              
              res.send(JSON.stringify(send));
            });
            global.winston.debug("Loaded " + json.title + " by " + json.user.username);
          } else {
            global.winston.debug("Loaded " + json.title + " by " + json.user.username + " from the cache");
            res.send(JSON.stringify(send));
          }
        });

      }

    });
  } else if(url.hostname == "www.youtube.com") {

    var video = ytdl(req.query.url);

    var key = md5(req.query.url);
    fs.open("cache/" + key, 'r', function(err) {
      if(err) {


        video.pipe(fs.createWriteStream("cache/" + key, {
          flags: 'a'
        }));

        video.on('end', function() {
          var send = {
            key: key
          };
          res.send(JSON.stringify(send));
          console.log('finished downloading!');
        });
      } else {
        var send = {
            key: key
          };
          res.send(JSON.stringify(send));
      }
    });



  }



});

router.get("/stream/*", function(req, res) {

  var key = req.params[0];

  global.winston.info("AUDIO: " + key);

  res.sendFile(global._root + "/cache/" + key);


});

router.get("/artwork", function(req, res) {
  request(req.query.url).pipe(res);
});