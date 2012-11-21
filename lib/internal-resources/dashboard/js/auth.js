$(document).ready(function() {

  $('.save').click(function() {
    $('#error').hide();
    var key = $.trim($('textarea[name=key]').val());

    $.cookie('DpdSshKey', key);

    //Make sure it works
    $.ajaxSetup({
      headers: {
        'dpd-ssh-key': key || true
      }
    });
    dpd('dashboard').get('__is-root', function(res) {
      if (res && res.isRoot) {
        window.location.reload();
      } else {
        $('#error').show();
      }
    });

  });

});