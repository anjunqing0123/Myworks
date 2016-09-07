/*! 一唱成名 create by ErickSong */
/**
 * @Description 播放页逻辑
 * @Author      YanYang
 * @Qq          175225632
 * @Data        2014/9/26
 * @Used
 *     www.pptv.com
 *     v.pptv.com
 */
define("util/scroller/tab", [ "core/jquery/1.8.3/jquery", "../function/delay" ], function(require, exports) {
    var $ = require("core/jquery/1.8.3/jquery");
    var delay = require("../function/delay");
    function tab(jqSelector, options) {
        var opt = $.extend({
            evt: "mouseenter",
            activeClass: "now",
            beforeSwitch: function() {
                return true;
            },
            onSwitch: function() {},
            delay: 200,
            strict: false
        }, options || {});
        $(jqSelector).each(function(i, n) {
            var $this = $(n);
            var $child = $this.children();
            var $target = $("#" + $this.attr("data-targetid"));
            if ($target.length) {
                var show = delay(function(i, $btn) {
                    if (opt.strict) {
                        var tar = $btn.attr("data-targetid");
                        var $tar = $target.find('[data-targetid="' + tar + '"]');
                        i = $tar.index();
                    }
                    var c = $target.children();
                    if (i < c.length) {
                        if (opt.beforeSwitch(i, c.eq(i), $btn) !== false) {
                            $child.removeClass(opt.activeClass);
                            $btn.addClass(opt.activeClass);
                            c.hide().eq(i).show();
                            opt.onSwitch(i, c.eq(i));
                        }
                    }
                }, opt.evt == "click" ? 0 : opt.delay);
                $child.each(function() {
                    $(this).on(opt.evt, function(e) {
                        e.preventDefault();
                        if ($(this).hasClass("disable")) {
                            return;
                        }
                        show($(this).index(), $(this));
                    }).on("mouseleave", function(e) {
                        show.cancel();
                    });
                });
            }
        });
        return {};
    }
    return tab;
});

define("util/function/delay", [], function(require, exports) {
    function delay(fn, time) {
        var t, flag = true, ct = clearTimeout, f = function() {
            ct(t);
            if (typeof time != "number" || time < 0) {
                time = 300;
            }
            var args = f.arg = arguments;
            flag = true;
            t = setTimeout(function() {
                flag && fn.apply(window, args);
            }, time);
        };
        f.cancel = function() {
            flag = false;
        };
        return f;
    }
    return delay;
});
