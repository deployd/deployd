/* Readonly properties */
// protect(\"creator\");

if (this.title === "$PUT_TEST") {
  this.message += "x";
}

if (this.message == "notvalidput") {
    error('message', "message should not be notvalidput");
}