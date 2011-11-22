/* Copyright (c) 2006 Brandon Aaron (brandon.aaron@gmail.com || http://brandonaaron.net)
 * Dual licensed under the MIT (http://www.opensource.org/licenses/mit-license.php)
 * and GPL (http://www.opensource.org/licenses/gpl-license.php) licenses.
 * Thanks to: http://adomas.org/javascript-mouse-wheel/ for some pointers.
 * Thanks to: Mathias Bank(http://www.mathias-bank.de) for a scope bug fix.
 *
 * $LastChangedDate: 2007-12-20 09:02:08 -0600 (Thu, 20 Dec 2007) $
 * $Rev: 4265 $
 *
 * Version: 3.0
 * 
 * Requires: $ 1.2.2+
 */
(function(a){a.event.special.mousewheel={setup:function(){var b=a.event.special.mousewheel.handler;if(a.browser.mozilla){a(this).bind("mousemove.mousewheel",function(c){a.data(this,"mwcursorposdata",{pageX:c.pageX,pageY:c.pageY,clientX:c.clientX,clientY:c.clientY})})}if(this.addEventListener){this.addEventListener((a.browser.mozilla?"DOMMouseScroll":"mousewheel"),b,false)}else{this.onmousewheel=b}},teardown:function(){var b=a.event.special.mousewheel.handler;a(this).unbind("mousemove.mousewheel");if(this.removeEventListener){this.removeEventListener((a.browser.mozilla?"DOMMouseScroll":"mousewheel"),b,false)}else{this.onmousewheel=function(){}}a.removeData(this,"mwcursorposdata")},handler:function(d){var b=Array.prototype.slice.call(arguments,1);d=a.event.fix(d||window.event);a.extend(d,a.data(this,"mwcursorposdata")||{});var e=0,c=true;if(d.wheelDelta){e=d.wheelDelta/120}if(d.detail){e=-d.detail/3}d.data=d.data||{};d.type="mousewheel";b.unshift(e);b.unshift(d);return a.event.handle.apply(this,b)}};a.fn.extend({mousewheel:function(b){return b?this.bind("mousewheel",b):this.trigger("mousewheel")},unmousewheel:function(b){return this.unbind("mousewheel",b)}})})(jQuery);