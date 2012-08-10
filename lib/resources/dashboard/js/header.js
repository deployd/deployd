$(document).ready(function() {

  var $modal = $('#deployModal').modal({show: false});

  $('#header h1').text(Context.appName);

  if (Context.env !== "development") {
    $('#header #deploy-btn-group').hide();
  }

  $('#header #open-btn').attr('href', 'http://' + window.location.host);



  $('#header #deploy-btn').click(function() {
    showModal();
  });

  function showModal() {
    $modal.modal('show');
    $modal.find('#deployment-name').val(Context.appName);
  }

});