$('#submit').on('click', function() {
   document.getElementById('audio').src='/audio?type=soundcloud&url=' + $('#url').val();
});