(function() {
  var key = $.cookie('DpdSshKey');
  $.ajaxSetup({
    headers: {
      'dpd-ssh-key': key || true
    }
  });
})();


$(document).ready(function() {
  dpd('__resources').get(function(res, err) {
    $('#body').text(JSON.stringify(err) || JSON.stringify(res));
  });
});