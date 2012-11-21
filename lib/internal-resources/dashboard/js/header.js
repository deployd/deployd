$(document).ready(function() {

  $('#header h1').text(Context.appName);

  if (Context.env !== "development") {
    $('#header #deploy-btn-group').hide();
  }

  $('#header #open-btn').attr('href', 'http://' + window.location.host);

});