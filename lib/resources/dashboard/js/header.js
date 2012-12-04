$(document).ready(function() {

  if (Context.env !== "development") {
    $('#header #deploy-btn-group').hide();
  }

  $('#header #open-btn').attr('href', 'http://' + window.location.host);

  $('#deploy-btn-group').on('click', '.deployment', function(e) {
    var subdomain = $(e.currentTarget).attr('data-deployment');
    var dialog = new ui.Dialog({title: subdomain, message: "Deploying..."}).show();
    $(dialog.el).addClass('deploying');
    dpd('__deployments').post({
      subdomain: subdomain
    }, function(deployment, err) {
      dialog.hide();
      if (err) { 
        dialog = new ui.Dialog({title: "Error deploying " + subdomain, message: err.message});
      } else {
        var url = deployment.name + "." + deployment.remote;
        dialog = ui.dialog(subdomain, $('<span>Deployed to <a target="_blank" href="http://' + url + '">' + url + '</a>!</span>'));
      }

      dialog.show().closable().hide(2000);
    });
    e.preventDefault();
  });

  function refreshDeployments() {
    dpd('__deployments').get(function(deployments) {
      $('#deploy-btn-group .btn').attr('href', '#');
      $('#deploy-btn-group ul .deployment').remove();
      if (deployments && deployments.length) {
        $('#deploy-btn-group .btn')
          .find('.caret').removeClass('hide').end()
          .dropdown();

        deployments.forEach(function(d) {
          var $item = $('<li class="deployment"><a href="#">Push to <strong>' + d.name + '</strong></a></li>');
          $item.attr('data-deployment', d.name);
          $item.insertBefore('#deploy-btn-group ul .divider');
        });
      } else {

        $('#deploy-btn-group .btn').attr('href', '/dashboard/deployments')
          .find('.caret').addClass('hide');
      }
    });
  }
  refreshDeployments();

  window.refreshHeaderDeployments = refreshDeployments;
  

});