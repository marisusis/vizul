$(document).ready(function() {
  
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
});