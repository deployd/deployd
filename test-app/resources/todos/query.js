if(event === 'PUT' && this.title === '$CUSTOM_PERMISSIONS_PUT') {
  allow('updating multiple objects');  
}

if(event === 'DELETE' && query.test === '$CUSTOM_PERMISSIONS_DELETE') {
  allow('deleting multiple objects');  
}