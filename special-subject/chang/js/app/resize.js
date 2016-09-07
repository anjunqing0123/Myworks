(function(designW) { // 参数w是设计稿的宽度，可以在页面中使用rem，1rem = 100px;
    var loadSize = function() {
        if (window.localStorage && window.localStorage.getItem("pplive_chang_fontsize_test")) {
            document.documentElement.style.fontSize = window.localStorage.getItem("pplive_chang_fontsize_test");
        } else {
            setSize();
        }
    };
    var setSize = function() {
        var screenW = Math.min(screen.width, window.innerWidth);
        document.documentElement.style.fontSize = 100 * screenW / designW + 'px';
    };

    var rem = function() {
        if (window.localStorage && !window.localStorage.getItem("pplive_chang_fontsize_test")) {
            var screenW = Math.min(screen.width, window.innerWidth);
            try {
                window.localStorage.setItem("pplive_chang_fontsize_test", 100 * screenW / designW + 'px')
            } catch (e) {

            }
        }
        setSize();
    };
    window.onload = rem;
    loadSize();
    window.onresize = loadSize;
})(750);
