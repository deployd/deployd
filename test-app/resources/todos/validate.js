
if (this.message === 'notvalid') {
    error('message', "Message must not be notvalid");
}

if (this.title === 'notvalid') {
    error('title', "Title must not be notvalid");
}

if (this.title === '$VALIDATE_TEST') {
  this.message += "x";
}

errorIf(this.title === "$ERROR_IF_TEST", 'errorIf', "Yep");
errorUnless(this.title !== "$ERROR_UNLESS_TEST", 'errorUnless', "Yep");