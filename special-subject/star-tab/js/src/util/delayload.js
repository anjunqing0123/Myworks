define(function(require,exports,module){

    var $ = require("jquery");
    var Webp = require("util/webp");

    function _getpos(e) {
        var g;
        if (e.parentNode === null || e.style.display == "none") {
            return false
        }
        if (e.getBoundingClientRect) {
            g = e.getBoundingClientRect();
            var m = e.ownerDocument,
            h = m.body,
            b = m.documentElement,
            f = b.clientTop || h.clientTop || 0,
            i = b.clientLeft || h.clientLeft || 0;
            var a = Math.max(document.documentElement.scrollTop, document.body.scrollTop);
            var c = Math.max(document.documentElement.scrollLeft, document.body.scrollLeft);
            var l = g.left + c - i;
            var k = g.top + a - f;
            return {
                x : l,
                y : k,
                left : l,
                top : k
            }
        } else {
            if (document.getBoxObjectFor) {
                g = document.getBoxObjectFor(e);
                var j = (e.style.borderLeftWidth) ? parseInt(e.style.borderLeftWidth) : 0;
                var d = (e.style.borderTopWidth) ? parseInt(e.style.borderTopWidth) : 0;
                pos = [g.x - j, g.y - d]
            } else {
                pos = [e.offsetLeft, e.offsetTop];
                parent = e.offsetParent;
                if (parent != e) {
                    while (parent) {
                        pos[0] += parent.offsetLeft;
                        pos[1] += parent.offsetTop;
                        parent = parent.offsetParent
                    }
                }
                if (e.style.position == "absolute") {
                    pos[0] -= document.body.offsetLeft;
                    pos[1] -= document.body.offsetTop
                }
            }
        }
        if (e.parentNode) {
            parent = e.parentNode
        } else {
            parent = null
        }
        while (parent && parent.tagName != "BODY" && parent.tagName != "HTML") {
            pos[0] -= parent.scrollLeft;
            pos[1] -= parent.scrollTop;
            if (parent.parentNode) {
                parent = parent.parentNode
            } else {
                parent = null
            }
        }
        return {
            x : pos[0],
            y : pos[1],
            left : pos[0],
            top : pos[1]
        }
    }
    function _images_delay_load(element) {
        var e = element?$(element).find("img"):document.images;
        var c = [];
        var b = null;
        for (var d = 0, a = e.length; d < a; d++) {
            if (e[d].getAttribute("data-src2") != null) {
                c.push(e[d])
            }
        }
        function h(k, t) {
            var l = document.documentElement.scrollTop || document.body.scrollTop;
            var j = document.documentElement.clientHeight || document.body.clientHeight;
            if (typeof(k) == "number" && typeof(t) == "number") {
                l = k;
                j = t
            }
            var q = l + j;
            var n,
            r,
            s,
            o;
            for (var m = 0, p = c.length; m < p; m++) {
                n = c[m];
                r = _getpos(n);
                s = r.y;
                o = n.offsetHeight;
                if (s + o > l && s < q) {
                    n.src = Webp.getWebp(n.getAttribute("data-src2"));
                    c.splice(m, 1);
                    m--;
                    p--
                }
            }
        }
        function g() {
            clearTimeout(b);
            b = setTimeout(h, 100)
        }
        function f(k, j, i) {
            if (k.addEventListener) {
                k.addEventListener(j, i, false)
            } else {
                if (k.attachEvent) {
                    k.attachEvent("on" + j, i)
                }
            }
        }
        f(window, "scroll", g);
        f(window, "resize", g);
        h();
        _images_delay_load.update = h;
        _images_delay_load.add=function(elements){
            if(!!Array.prototype.concat){
                c=c.concat(elements);
            }
        }
    }


    exports.init = function(element){
        _images_delay_load(element);
    };
    exports.update = function(){
        _images_delay_load.update();
    };
    exports.add=function(elements){
        _images_delay_load.add(elements);
    };
    exports.init();

});
