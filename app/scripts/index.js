$(document).ready(function() {
    $("#go").on("click", function(event) {
        $.getJSON("/audio?url=" + $("#url").val(), function(res) {
            document.getElementById("audio").src = "/audio/stream/" + res.key;
            //Start animation
            $(".container").addClass("mode--viz");

            window.img = new Image();

            img.src = "/audio/artwork?url=" + res.artwork;

            img.onload = function() {

              var c = new ColorThief();
              
              var pal = c.getPalette(img);
              
              var out = [pal[0],pal[1],pal[2]];
              
              var done = out.map(x => {
                return chroma(x).luminance(0.70).saturate(3).rgb();
              });

             window.COLOR = done;
        
      }
      
    });
    
      
  });
});

