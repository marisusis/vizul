$(document).ready(function() {
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
        
        console.log(greatestChannel, mainColor);
        
        //Get three colors from the image
        const stolenColors = colorThief.getPalette(img, 8);
        
        //Sort them by the value of the common channel
        const modifiedOrder = _.sortBy(stolenColors, function(x) {
          return x[greatestChannel];
        });
        
        //Set the color of the seeking bar
        $(".line").css({
          "background": chroma(mainColor).css()
        });
        
        
        window.COLOR = modifiedOrder;
      }

    });


  });
});