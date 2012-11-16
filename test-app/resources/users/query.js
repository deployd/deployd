if(query.test === '$CUSTOM_PERMISSIONS_PUT') {
  allow('updating multiple objects');
}

if(query.test === '$CUSTOM_PERMISSIONS_DELETE') {
  allow('deleting multiple objects');
}