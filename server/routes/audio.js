var router = require("express").Router();

//Soundcloud resolve helper
var resolve = require("soundcloud-resolve");

module.exports = router;

router.get("/", function(req, res) {
  
  var type = req.query.type;
  var url = req.query.url;
  
  global.winston.info("AUDIO: [" + type + "] @ " + url);
  
  if (type == "soundcloud") {
    resolve("3BimZt6WNvzdEFDGmj4oeCSZfgVPAoVc", url, function(err, json, stream_url) {
      if (err) {
        res.sendStatus(400);
      } else {
        require("request").get(stream_url).pipe(res);
        global.winston.debug("Loaded " + json.title + " by " + json.user.username);
      }

    });
  } else {
    res.sendStatus(400);
  }
  
});