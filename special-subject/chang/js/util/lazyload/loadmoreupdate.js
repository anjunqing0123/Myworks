/**
 * suning lazyload.js
 * @param  {[type]} require     [description]
 * @param  {[type]} exports     [description]
 * @param  {[type]} module){} [description]
 * @return {[type]}             [description]
 */
define(function(require, exports, module) {
    'use strict';
    var e = require('jquery'),
        $ = e;
    var isIpad=(function(){
        var ua = navigator.userAgent.toLowerCase();
        return /\(ipad/i.test(ua);
    })();
    function loadImg(img){
        img.onerror = function() {  
            if(isIpad==true){
                img.setAttribute('data-isError',1);
                img.parentNode.style.backgroundColor='#323232';
                img.src='http://sr3.pplive.com/cms/29/99/82a09d9163f75597527c23664f4c3658.jpg';
            }else{
                img.src = "http://sr1.pplive.com/cms/16/31/85d797962d52321b9e53cfeab66e92d6.jpg";
            }
        };
        img.onload=function(){
            if(isIpad==true){
                if(img.getAttribute('data-isError')!=1){
                    img.parentNode.style.backgroundColor='#323232';
                }
            }
        }
        img.src = img.getAttribute("data-src");
        img.setAttribute("data-src", "done");
    }

    function lazyload(el, callBack) {
        var delay = null;
        $(el).find("img").each(function(index, item) {
            !$(el).hasClass("lazyimg") && $(el).addClass("lazyimg");
            if (!item.getAttribute("data-src")) {
                return;
            }
            if ($(this).offset().top < window.innerHeight && item.getAttribute("data-src") != "done") {
                loadImg(item);
            }
        });

        var linstener = function() {
            delay = setTimeout(function() {

                $(el).find("img").each(function(index, item) {
                    !$(el).hasClass("lazyimg") && $(el).addClass("lazyimg");
                    if (!item.getAttribute("data-src")) {
                        return;
                    }
                    var top = $(this).offset().top;
                    var h = window.innerHeight || window.screen.height;
                    if (window.pageYOffset > top + h || window.pageYOffset < top - h && item.getAttribute("data-src") != "done") {
                        clearTimeout(delay);
                        return;
                    }
                    if (window.pageYOffset > top - h && item.getAttribute("data-src") != "done") {
                        loadImg(item);
                    }
                });
                if (typeof callBack == "function") {
                    $(el).each(function() {
                        var item = $(this)[0];
                        var top = $(this).offset().top;
                        var h = window.innerHeight || window.screen.height;
                        var height = $(this).height();
                        // if(window.pageYOffset > top + h || window.pageYOffset < top - h && item.getAttribute("data-loaded") != "done"){
                        //     clearTimeout(delay);
                        //     return;
                        // }
                        if (window.pageYOffset > height + top - h - 100 && item.getAttribute("data-loaded") != "done") {
                            callBack($(el));
                        }
                    });
                }
            }, 80);
        };
        var removed = false;
        //若是屏幕出现纵向滚动条，则scroll可以满足效果
        window.addEventListener("scroll", function() {
            if (!removed) { //出现滚动条后才可以触发，触发后直接删除touchmove监听
                document.removeEventListener('touchmove', linstener, false);
                removed = true;
            }
            linstener.apply(this, arguments);
        }, false);
        //若页面没有出现纵向滚动条，则需要添加touchmove监听事件
        window.addEventListener("touchmove", linstener, false);

        setTimeout(function() {
            $(window).trigger('scroll');
        }, 0);
        lazyload.update = function() {
            var self = this;
            setTimeout(function() {
                linstener.apply(self);
            }, 1000);
        };
    }

    exports.init = function(i) {
        return this.each(function() {
            lazyload(e(this), i);
        });
    };

    exports.update = function() {
        lazyload.update();
    };
});
