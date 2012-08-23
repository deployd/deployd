if (this.message === 'notvalid') {
    error('message', "Message must not be notvalid");
}

if (this.title === 'notvalid') {
    error('title', "Title must not be notvalid");
}

if (this.title === '$VALIDATE_TEST') {
  this.message += "x";
}