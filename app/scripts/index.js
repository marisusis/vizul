$(document).ready(function() {
  $("#go").on("click", function(event) {
      document.getElementById("audio").src="/audio?type=soundcloud&url=" + $("#url").val();
  });
});

