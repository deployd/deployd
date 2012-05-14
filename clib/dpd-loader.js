var url = /*rootUrl*/ + '/dpd.js';

if (!document.readystate || document.readystate === "complete") {
  var head = document.getElementsByTagName('head')[0],
      script = document.createElement('script');

  script.src = url;
  head.appendChild(script);
} else {
  document.write('<script type="text/javascript" src="' + url + '"></script>')
}