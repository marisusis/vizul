var colorAdd = 60;
let midiChannel = 1;

const gui = new dat.GUI();

let app = {};


function start() {
  handlePad = function(){};
  $(".container").addClass("mode--viz");
  audio.play();
}

$(document).ready(function() {
  

  // Initialize stats.js
  app.stats = new Stats();
  app.stats.showPanel( 0 );
  document.body.appendChild( app.stats.domElement );

  var mouseX = 0;
  
  
  $(".bar").on("mousemove", function(event) {
    
    mouseX = event.pageX;
    
    $(".line-hover").css({
      "width": event.pageX + "px"
    });
    
    var timeOffset = function (x) {
      
      var left = 0;
      
      left = event.pageX - $(".time-hover").innerWidth();
      
      if (left < 0) {
        left = 0;
      }
      
      return left;
      
    }(event.pageX);
    
    $(".time-hover").css({
      "left": timeOffset + "px"
    });
    
    var seconds = function (maxWidth, width, maxTime) {
      var sec = 0;
      
      sec = (width/maxWidth) * maxTime;
      
      return sec;
      
      } (window.innerWidth, event.pageX, audio.duration);
    
    $(".time-hover").text(moment().minutes(0).seconds(seconds).format("mm:ss"));
    
  });
  
  $(".bar").on("click", function(event) {
     var seconds = function (maxWidth, width, maxTime) {
      var sec = 0;
      
      sec = (width/maxWidth) * maxTime;
      
      return sec;
      
      } (window.innerWidth, mouseX, audio.duration);
    
    audio.currentTime = seconds;
  });
  
  $("#go").on("click", function(event) {
    $.getJSON("/audio?url=" + $("#url").val(), function(res) {
      document.getElementById("audio").src = "/audio/stream/" + res.key;
      //Start animation
      $(".container").addClass("mode--viz");

      window.img = new Image();

      img.src = "/audio/artwork?url=" + res.artwork;

      img.onload = function() {

        var colorThief = new ColorThief();
        
        const mainColor = colorThief.getColor(img);
        
        var greatestChannel = function(color) {
          var max = 0;
          var index = 0;
          for (var i = 0; i < color.length; i++) {
            if (color[i] >= max) {
              max = color[i];
              index = i;
            }
          }
          return index;
        }(mainColor);
        
        //Get three colors from the image
        const stolenColors = colorThief.getPalette(img, 8);
        
        //Sort them by the value of the common channel
        const modifiedOrder = _.sortBy(stolenColors, function(x) {
          return x[greatestChannel];
        });
        
        //Apply some efects to the colors
        const effects = modifiedOrder.map(function(x) {
          return chroma(x).saturate(1).rgb();
        });
        
        
        
        //Set the color of the seeking bar
        $(".line").css({
          "background": chroma(effects[effects.length-1]).css()
        });
        
        $(".line-hover").css({
          "background": chroma(effects[effects.length-1]).css(),
          "border-right-color": chroma(effects[effects.length-1]).luminance(0.7).alpha(0.8).css()
        });
        
        $("span.time").css({
          "color": chroma(effects[effects.length-1]).css()
        });
        
        
        $(".title h1").css({
          "color": chroma(effects[6]).css()
        });
        
        
        window.COLOR = effects;
      }
    });


  });

  WebMidi.enable(function(err) {
    if (err) {
      console.log("WebMidi could not be enabled.", err);
    } else {
      console.log("WebMidi enabled!");
      output = WebMidi.getOutputByName("Launchpad Pro Standalone Port");

      input = WebMidi.getInputByName("Launchpad Pro Standalone Port");

      clearPad();
      output.playNote(10, midiChannel, {
        velocity: 3,
        rawVelocity: true
      });

      for (var i = 0; i < 8; i++) {
        prev.push([0, 0, 0, 0, 0, 0, 0, 0]);
      }
      volPrev = [1, 1, 1, 1, 1, 1, 1, 1];
    }

  }, true);

  // STUFF FOR MIC
  navigator.mediaDevices.getUserMedia({audio:{
		channelCount: 2,
			sampleRate: 48000,
			sampleSize: 24
		}})
		.then(stream => {
      console.info("VIZUL: Initialized audio nodes");
      initNodes(audioCtx.createMediaStreamSource(stream));
		})
		.catch(e=>console.log(e));
});


function clearPad() {
  for (var i = 0; i < 100; i++) {
    output.stopNote(i, "all");
  }
  for (var i = 0; i < 8; i++) {
    prev[i] = [0, 0, 0, 0, 0, 0, 0, 0];
  }
}

let midiOk=true;
function handlePad(array) {
  if (midiOk) {
    var bars = [];
    for (var i = 3; i < 63; i += 7) {
      var _avg = math.max(Array.from(array.slice(i, i + 7)))
      var avg = normalize(_avg, 0, 255, -1, 8);
      bars.push(math.round(avg));
    }
    var bars2 = experimentalTransform(bars, 7);
    var bars3 = bars2.map(function(a, b, c) {
      return Math.floor(a);
    })
    drawBars(bars3);
    for (let i = 0; i < bottom.length; i++) {
      let val = bottom[i];
      let vel = math.floor(normalize(math.max(array.slice(0, 20)), 255, 0, bottomColor.length - 1, 0));
      let c = bottomColor[vel];
      if (c === undefined) c = bottomColor[bottomColor.length - 1];
      output.playNote(val, midiChannel, {
        velocity: c,
        rawVelocity: true
      });
    }
  }
}

let bottom = [1,2,3,4,5,6,7,8,19,29,39,49,59,69,79,89,10,20,30,40,50,60,70,80,91,92,93,94,95,96,97,98];
var map = [
  [11, 21, 31, 41, 51, 61, 71, 81],
  [12, 22, 32, 42, 52, 62, 72, 82],
  [13, 23, 33, 43, 53, 63, 73, 83],
  [14, 24, 34, 44, 54, 64, 74, 84],
  [15, 25, 35, 45, 55, 65, 75, 85],
  [16, 26, 36, 46, 56, 66, 76, 86],
  [17, 27, 37, 47, 57, 67, 77, 87],
  [18, 28, 38, 48, 58, 68, 78, 88]
];

let color = [57, 49, 41, 33, 25, 17, 9, 3];
// let bottomColor = [31, 30, 29, 27, 26, 25, 23, 22, 21, 19, 18, 17, 15, 14, 13, 11, 10, 9, 7, 6, 5];
let bottomColor = [0,1,117,2,118,3,119,5];
// let bottomColor = [0,51,47,43,39,50,46,42,38,49,45,41,37];


var volMap = [19, 29, 39, 49, 59, 69, 79, 89];

var volPrev = [];
var prev = [];

function drawBars(levels) {
  messages = 0;
  for (var i in levels) {
    level = levels[i];
    section = map[i];
    for (var j in section) {
      if (j <= levels[i]) {
        if (prev[i][j] == 0) {
          prev[i][j] = 1;
          output.playNote(section[j], midiChannel, {
            velocity: color[j],
            rawVelocity: true
          });
          messages++;
        } else {

        }
      } else if (j > levels[i]) {
        if (prev[i][j] == 1) {
          prev[i][j] = 0;
          messages++;
          output.playNote(section[j], midiChannel, {
            velocity: 0,
            rawVelocity: true
          });
        } else {

        }
      }
    }
  }
}

$(document).click(function() {
  start();
})