/* Readonly properties */
// protect(\"creator\");

if (this.title === "$PUT_TEST") {
  this.message += "x";
}

if (this.message == "notvalidput") {
    error('message', "message should not be notvalidput");
}

if (this.title === "$PROTECT_TEST") {
  if (this.message !== 'y') error('message', 'should be new value of y before protect');
  protect('message');
  
  if (this.message !== 'x') error('message', 'should be x again after protect');

  try {
    // this should throw an error
    this.message = 'z';
  } catch (err) {
    if (err.message == "Cannot modify protected property 'message'") {
      this.error_message_ok = true;
    }
  }

  try {
    // this should throw an error
    this.id = 'hello';
  } catch (err) {
    if (err.message == "Cannot modify protected property 'id'") {
      this.error_id_ok = true;
    }
  }

  hide('title'); // check that hide also works in put

  // keep this to ensure that even if the field is hidden it is still updated properly
  this.done = true;
  hide('done');
}

if (previous.message == "protected") {
  protect('message');
}