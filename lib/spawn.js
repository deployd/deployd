Object.defineProperty(Object.prototype, "spawn", {value: function (props) {
  var defs = {}, key;
  for (key in props) {
    if (props.hasOwnProperty(key)) {
      defs[key] = {value: props[key], enumerable: true};
    }
  }
  var o = Object.create(this, defs);
  o.initialize && o.initialize();
  return o;
}});