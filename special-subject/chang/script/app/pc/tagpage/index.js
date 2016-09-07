/*! 一唱成名 create by ErickSong */
define("app/pc/tagpage/index", [ "./slider", "core/jquery/1.8.3/jquery", "../../../util/flexSlider/flexSlider", "core/underscore/1.8.3/underscore", "../../../util/loader/loader", "../../../util/log/log", "../../../util/platform/plt", "../../../util/browser/browser", "../../../util/net/urlquery", "../../../util/linkcfg/interfaceurl", "../../../util/linkcfg/pcredirect", "../../../util/login/login", "../../../util/user/user", "client", "../../../util/cookie/cookie", "../../../util/others/getquery", "./tagpk", "../../../util/date/format", "../../../util/Timer/timer", "../../../util/vote/uniformDate", "../../../util/vote/vote", "../../../util/vote/voteupdate", "../../../util/vote/formatVote", "../index/flipclock", "./tagConcert", "./stagefour", "./stagefive", "./stagesix", "./stageseven" ], function(require, exports) {
    //幻灯模块以及下拉菜单模块
    require("./slider");
    var $ = require("core/jquery/1.8.3/jquery");
    var _ = require("core/underscore/1.8.3/underscore");
    var loader = require("../../../util/loader/loader");
    var urls = require("../../../util/linkcfg/interfaceurl");
    //登录模块
    require("../../../util/linkcfg/pcredirect");
    //登录模块结束
    var isClient = function() {
        //是否是客户端
        try {
            if (external && external.GetObject) {
                return true;
            }
        } catch (e) {}
        return false;
    }();
    var template_item = "<li>" + '<a href="<%= link %>" <%if(isClient==false){%>target="_blank"<%}%> class="item" title="<%= title %>">' + '<img alt="<%= title %>" src="<%= videourl %>">' + '<span class="v-bg"></span> <i class="v-ico v-show"></i> <!--v-show代表有播放icon -->' + '<i class="v-ico2"></i>' + "</a>" + "<dl>" + "<dt><%= real_name%></dt>" + "<dd><%= title %></dd>" + '<a class="hpic" href="<%= playerurl %>" <%if(isClient==false){%>target="_blank"<%}%>>' + '<img alt="<%= title %>" src="<%= avatar %>">' + "</a>" + "</dl>" + '<div class="vote">' + '<a class="up"><%= upvote%></a><a class="down"><%= downvote%></a>' + "</div>" + "</li>";
    var tempFunc = _.template(template_item);
    //获取url参数对象
    var getUrlArgObject = require("../../../util/others/getquery");
    var urlObj = getUrlArgObject();
    var page = 1;
    var pageSize = 20;
    var stage = "1";
    var scope = urlObj["scope"] || 1;
    var sort = 1;
    var isend = false;
    var mode = "haixuan";
    var marqueeObj = $(".js-marquee");
    if (marqueeObj.length == 0) {
        return;
    }
    var template_item_more = "<li>" + '<a title="<%= title %>" class="item" <%if(isClient==false){%>target="_blank"<%}%>  href="<%= link %>">' + '<img alt="<%= title %>" src="<%= videourl %>">' + "<dl>" + "<dt><%= title %></dt>" + "<dd><%= stage_name %></dd>" + "</dl>" + '<span class="v-bg"></span> <i class="v-ico v-show"></i> <!--v-show代表有播放icon -->' + '<i class="v-ico2"></i>' + '<span class="msk-txt"><%= real_name%></span>' + "</a>" + "</li>";
    var tempMoreFunc = _.template(template_item_more);
    if ($(".module-vote-layout").length != 0) {
        require("./tagpk");
        mode = "pk";
        sort = 3;
    } else if ($(".module-myconcert-tag").length != 0) {
        require("./tagConcert");
        mode = "concert";
        sort = 3;
    } else if ($("#gold-stage-tag4").length != 0) {
        require("./stagefour");
        mode = "goldstage4";
        sort = 3;
    } else if ($("#gold-stage-tag5").length != 0) {
        require("./stagefive");
        mode = "goldstage5";
        sort = 3;
    } else if ($("#gold-stage-tag6").length != 0) {
        require("./stagesix");
        mode = "goldstage5";
        sort = 3;
    } else if ($("#gold-stage-tag7").length != 0) {
        require("./stageseven");
        mode = "goldstage5";
        sort = 3;
    } else {
        var sortA = $(".module-inmatch .drop-tit a");
        sortA.on("click", function(e) {
            e.preventDefault();
            var obj = $(this);
            var tempsort = obj.data("sort");
            if (tempsort != sort) {
                sort = tempsort;
                lock = true;
                sortA.removeClass("active");
                obj.addClass("active");
                loadData(true);
            }
            return false;
        });
    }
    function loadData(isReset) {
        if (isReset) {
            page = 0;
            $(".js-marquee").find("ul").html("");
            lock = true;
            isend = false;
        }
        var tempData = {
            stage: stage,
            scope: scope,
            sort: sort,
            start: pageSize * page,
            stop: pageSize * (page + 1) - 1,
            plt: "pc"
        };
        tempData.__config__ = {
            cdn: true,
            callback: "updateMarquee"
        };
        loader.load(urls["interface"]["tagMarquee"], tempData, function(data) {
            if (data.length == 0) {
                isend = true;
            }
            if (mode == "haixuan") {
                var returnHtml = buildData(data);
            } else if (mode != "haixuan") {
                var returnHtml = buildPKData(data);
            }
            $(".js-marquee").find("ul").append(returnHtml);
            page++;
            lock = false;
        }, function() {
            lock = false;
        });
    }
    function buildData(arr) {
        var temphtml = "";
        for (var i = 0; i < arr.length; i++) {
            var tempObj = arr[i];
            var buildObj = {};
            buildObj.title = tempObj.title;
            if (tempObj.player_info.is_group == "1") {
                buildObj.real_name = tempObj.player_info.group_name;
            } else {
                buildObj.real_name = tempObj.player_info.real_name;
            }
            if (!isClient) {
                buildObj.link = tempObj.web_link;
                buildObj.playerurl = "http://chang.pptv.com/pc/player?username=" + tempObj.player_info.username;
                buildObj.isClient = false;
            } else {
                buildObj.link = tempObj.pc_link;
                buildObj.playerurl = "http://chang.pptv.com/pc/player?username=" + tempObj.player_info.username + "&plt=clt";
                buildObj.isClient = true;
            }
            buildObj.videourl = tempObj.dp.picurl;
            buildObj.upvote = tempObj.like_vote_format;
            buildObj.downvote = tempObj.dislike_vote_format;
            buildObj.avatar = tempObj.player_info.avatar;
            temphtml += tempFunc(buildObj);
        }
        return temphtml;
    }
    function buildPKData(arr) {
        var temphtml = "";
        for (var i = 0; i < arr.length; i++) {
            var tempObj = arr[i];
            var buildObj = {};
            buildObj.title = tempObj.title;
            buildObj.stage_name = tempObj.stage_name;
            if (tempObj.player_info.is_group == "1") {
                buildObj.real_name = tempObj.player_info.group_name;
            } else {
                buildObj.real_name = tempObj.player_info.real_name;
            }
            if (!isClient) {
                buildObj.link = tempObj.web_link;
                buildObj.playerurl = "http://chang.pptv.com/pc/player?username=" + tempObj.player_info.username;
                buildObj.isClient = false;
            } else {
                buildObj.link = tempObj.pc_link;
                buildObj.playerurl = "http://chang.pptv.com/pc/player?username=" + tempObj.player_info.username + "&plt=clt";
                buildObj.isClient = true;
            }
            buildObj.videourl = tempObj.dp.picurl;
            buildObj.avatar = tempObj.player_info.avatar;
            temphtml += tempMoreFunc(buildObj);
        }
        return temphtml;
    }
    var offsetTop = marqueeObj.offset().top;
    var win = $(window);
    var winH = win.height();
    var lock = false;
    $(window).on("scroll", function() {
        var tempScrollTop = win.scrollTop();
        if (tempScrollTop + winH > marqueeObj.offset().top + marqueeObj.height() - 167) {
            if (lock == false) {
                lock = true;
                if (isend == true) {
                    return false;
                }
                loadData();
            }
        }
    });
});

define("app/pc/tagpage/slider", [ "core/jquery/1.8.3/jquery", "util/flexSlider/flexSlider" ], function(require, exports) {
    var $ = require("core/jquery/1.8.3/jquery");
    //var ps = require('../../../util/photoslide/photoslide');
    require("util/flexSlider/flexSlider")($);
    //幻灯
    /*ps.init($(".module-slider"), {
        perTime: 1,
        showNum: 1,
        outer: '.slider-wrap',
        inner: '.slider ul',
        autoSwitchTime:0,
        loop:true,
        btns:".btnbox p",
        onChangePage: function(){
            //console.log(this.selectedPageIndex);
            var index = $(".module-slider .btnbox .now").html() - 1,
                lis = $(".module-slider li"),
                curtxt = $(lis[index]).find("img").attr("alt");              
            $(".module-slider span").html(curtxt);
            var as = $(".module-slider .btnbox a");       
            if(index == $(as).length - 1){
                console.log($(as).length)
            }
        }
    });*/
    $(".dropbox").mouseenter(function() {
        $(".drop").show();
    });
    $(".dropbox").mouseleave(function() {
        $(".drop").hide();
    });
    $(function() {
        $(".flexslider").flexslider({
            animationLoop: true,
            directionNav: true,
            slideshowSpeed: 3e3,
            slideshow: true,
            startAt: 0,
            after: function(obj) {
                var curIdx = obj.currentSlide;
                var lis = $(".module-slider .slides li");
                var curtxt = $(lis[curIdx]).find("a").attr("title");
                $(".flex-control-pagingW p").html(curtxt);
            },
            start: function() {
                var pageW = $("<div class='flex-control-pagingW'></div>");
                $(document.documentElement).append(pageW);
                pageW.insertBefore(".flex-direction-nav");
                pageW.append("<p></p>");
                $(".flex-control-paging").appendTo(pageW);
                function getAttr() {
                    var index = $(".flex-control-paging .flex-active").html() - 1, lis = $(".module-slider .slides li"), curtxt = $(lis[index]).find("a").attr("title");
                    $(".flex-control-pagingW p").html(curtxt);
                }
                getAttr();
                $(".flex-direction-nav a").click(function() {
                    getAttr();
                });
                $(".flex-control-paging a").click(function() {
                    return false;
                });
            }
        });
    });
});

/*
 * jQuery FlexSlider v2.1
 * http://www.woothemes.com/flexslider/
 *
 * Copyright 2012 WooThemes
 * Free to use under the GPLv2 license.
 * http://www.gnu.org/licenses/gpl-2.0.html
 *
 * Contributing author: Tyler Smith (@mbmufffin)
 */
/*
使用方法
var flexslider = require('flexslider')($)
 */
define("util/flexSlider/flexSlider", [], function(require, exports, modules) {
    return function(jQuery) {
        (function($) {
            //FlexSlider: Object Instance
            $.flexslider = function(el, options) {
                var slider = $(el), vars = $.extend({}, $.flexslider.defaults, options), namespace = vars.namespace, touch = "ontouchstart" in window || window.DocumentTouch && document instanceof DocumentTouch, eventType = touch ? "touchend" : "click", vertical = vars.direction === "vertical", reverse = vars.reverse, carousel = vars.itemWidth > 0, fade = vars.animation === "fade", asNav = vars.asNavFor !== "", methods = {};
                // Store a reference to the slider object
                $.data(el, "flexslider", slider);
                // Privat slider methods
                methods = {
                    init: function() {
                        slider.animating = false;
                        slider.currentSlide = vars.startAt;
                        slider.animatingTo = slider.currentSlide;
                        slider.atEnd = slider.currentSlide === 0 || slider.currentSlide === slider.last;
                        slider.containerSelector = vars.selector.substr(0, vars.selector.search(" "));
                        slider.slides = $(vars.selector, slider);
                        slider.container = $(slider.containerSelector, slider);
                        slider.count = slider.slides.length;
                        // SYNC:
                        slider.syncExists = $(vars.sync).length > 0;
                        // SLIDE:
                        if (vars.animation === "slide") vars.animation = "swing";
                        slider.prop = vertical ? "top" : "marginLeft";
                        slider.args = {};
                        // SLIDESHOW:
                        slider.manualPause = false;
                        // TOUCH/USECSS:
                        slider.transitions = !vars.video && !fade && vars.useCSS && function() {
                            var obj = document.createElement("div"), props = [ "perspectiveProperty", "WebkitPerspective", "MozPerspective", "OPerspective", "msPerspective" ];
                            for (var i in props) {
                                if (obj.style[props[i]] !== undefined) {
                                    slider.pfx = props[i].replace("Perspective", "").toLowerCase();
                                    slider.prop = "-" + slider.pfx + "-transform";
                                    return true;
                                }
                            }
                            return false;
                        }();
                        // CONTROLSCONTAINER:
                        if (vars.controlsContainer !== "") slider.controlsContainer = $(vars.controlsContainer).length > 0 && $(vars.controlsContainer);
                        // MANUAL:
                        if (vars.manualControls !== "") slider.manualControls = $(vars.manualControls).length > 0 && $(vars.manualControls);
                        // RANDOMIZE:
                        if (vars.randomize) {
                            slider.slides.sort(function() {
                                return Math.round(Math.random()) - .5;
                            });
                            slider.container.empty().append(slider.slides);
                        }
                        slider.doMath();
                        // ASNAV:
                        if (asNav) methods.asNav.setup();
                        // INIT
                        slider.setup("init");
                        // CONTROLNAV:
                        if (vars.controlNav) methods.controlNav.setup();
                        // DIRECTIONNAV:
                        if (vars.directionNav) methods.directionNav.setup();
                        // KEYBOARD:
                        if (vars.keyboard && ($(slider.containerSelector).length === 1 || vars.multipleKeyboard)) {
                            $(document).bind("keyup", function(event) {
                                var keycode = event.keyCode;
                                if (!slider.animating && (keycode === 39 || keycode === 37)) {
                                    var target = keycode === 39 ? slider.getTarget("next") : keycode === 37 ? slider.getTarget("prev") : false;
                                    slider.flexAnimate(target, vars.pauseOnAction);
                                }
                            });
                        }
                        // MOUSEWHEEL:
                        if (vars.mousewheel) {
                            slider.bind("mousewheel", function(event, delta, deltaX, deltaY) {
                                event.preventDefault();
                                var target = delta < 0 ? slider.getTarget("next") : slider.getTarget("prev");
                                slider.flexAnimate(target, vars.pauseOnAction);
                            });
                        }
                        // PAUSEPLAY
                        if (vars.pausePlay) methods.pausePlay.setup();
                        // SLIDSESHOW
                        if (vars.slideshow) {
                            if (vars.pauseOnHover) {
                                slider.hover(function() {
                                    if (!slider.manualPlay && !slider.manualPause) slider.pause();
                                }, function() {
                                    if (!slider.manualPause && !slider.manualPlay) slider.play();
                                });
                            }
                            // initialize animation
                            vars.initDelay > 0 ? setTimeout(slider.play, vars.initDelay) : slider.play();
                        }
                        // TOUCH
                        if (touch && vars.touch) methods.touch();
                        // FADE&&SMOOTHHEIGHT || SLIDE:
                        if (!fade || fade && vars.smoothHeight) $(window).bind("resize focus", methods.resize);
                        // API: start() Callback
                        setTimeout(function() {
                            vars.start(slider);
                        }, 200);
                    },
                    asNav: {
                        setup: function() {
                            slider.asNav = true;
                            slider.animatingTo = Math.floor(slider.currentSlide / slider.move);
                            slider.currentItem = slider.currentSlide;
                            slider.slides.removeClass(namespace + "active-slide").eq(slider.currentItem).addClass(namespace + "active-slide");
                            slider.slides.click(function(e) {
                                e.preventDefault();
                                var $slide = $(this), target = $slide.index();
                                if (!$(vars.asNavFor).data("flexslider").animating && !$slide.hasClass("active")) {
                                    slider.direction = slider.currentItem < target ? "next" : "prev";
                                    slider.flexAnimate(target, vars.pauseOnAction, false, true, true);
                                }
                            });
                        }
                    },
                    controlNav: {
                        setup: function() {
                            if (!slider.manualControls) {
                                methods.controlNav.setupPaging();
                            } else {
                                // MANUALCONTROLS:
                                methods.controlNav.setupManual();
                            }
                        },
                        setupPaging: function() {
                            var type = vars.controlNav === "thumbnails" ? "control-thumbs" : "control-paging", j = 1, item;
                            slider.controlNavScaffold = $('<ol class="' + namespace + "control-nav " + namespace + type + '"></ol>');
                            if (slider.pagingCount > 1) {
                                for (var i = 0; i < slider.pagingCount; i++) {
                                    item = vars.controlNav === "thumbnails" ? '<img src="' + slider.slides.eq(i).attr("data-thumb") + '"/>' : "<a>" + j + "</a>";
                                    slider.controlNavScaffold.append("<li>" + item + "</li>");
                                    j++;
                                }
                            }
                            // CONTROLSCONTAINER:
                            slider.controlsContainer ? $(slider.controlsContainer).append(slider.controlNavScaffold) : slider.append(slider.controlNavScaffold);
                            methods.controlNav.set();
                            methods.controlNav.active();
                            slider.controlNavScaffold.delegate("a, img", eventType, function(event) {
                                event.preventDefault();
                                var $this = $(this), target = slider.controlNav.index($this);
                                if (!$this.hasClass(namespace + "active")) {
                                    slider.direction = target > slider.currentSlide ? "next" : "prev";
                                    slider.flexAnimate(target, vars.pauseOnAction);
                                }
                            });
                            // Prevent iOS click event bug
                            if (touch) {
                                slider.controlNavScaffold.delegate("a", "click touchstart", function(event) {
                                    event.preventDefault();
                                });
                            }
                        },
                        setupManual: function() {
                            slider.controlNav = slider.manualControls;
                            methods.controlNav.active();
                            slider.controlNav.live(eventType, function(event) {
                                event.preventDefault();
                                var $this = $(this), target = slider.controlNav.index($this);
                                if (!$this.hasClass(namespace + "active")) {
                                    target > slider.currentSlide ? slider.direction = "next" : slider.direction = "prev";
                                    slider.flexAnimate(target, vars.pauseOnAction);
                                }
                            });
                            // Prevent iOS click event bug
                            if (touch) {
                                slider.controlNav.live("click touchstart", function(event) {
                                    event.preventDefault();
                                });
                            }
                        },
                        set: function() {
                            var selector = vars.controlNav === "thumbnails" ? "img" : "a";
                            slider.controlNav = $("." + namespace + "control-nav li " + selector, slider.controlsContainer ? slider.controlsContainer : slider);
                        },
                        active: function() {
                            slider.controlNav.removeClass(namespace + "active").eq(slider.animatingTo).addClass(namespace + "active");
                        },
                        update: function(action, pos) {
                            if (slider.pagingCount > 1 && action === "add") {
                                slider.controlNavScaffold.append($("<li><a>" + slider.count + "</a></li>"));
                            } else if (slider.pagingCount === 1) {
                                slider.controlNavScaffold.find("li").remove();
                            } else {
                                slider.controlNav.eq(pos).closest("li").remove();
                            }
                            methods.controlNav.set();
                            slider.pagingCount > 1 && slider.pagingCount !== slider.controlNav.length ? slider.update(pos, action) : methods.controlNav.active();
                        }
                    },
                    directionNav: {
                        setup: function() {
                            var directionNavScaffold = $('<ul class="' + namespace + 'direction-nav"><li><a class="' + namespace + 'prev" href="#">' + vars.prevText + '</a></li><li><a class="' + namespace + 'next" href="#">' + vars.nextText + "</a></li></ul>");
                            // CONTROLSCONTAINER:
                            if (slider.controlsContainer) {
                                $(slider.controlsContainer).append(directionNavScaffold);
                                slider.directionNav = $("." + namespace + "direction-nav li a", slider.controlsContainer);
                            } else {
                                slider.append(directionNavScaffold);
                                slider.directionNav = $("." + namespace + "direction-nav li a", slider);
                            }
                            methods.directionNav.update();
                            slider.directionNav.bind(eventType, function(event) {
                                event.preventDefault();
                                var target = $(this).hasClass(namespace + "next") ? slider.getTarget("next") : slider.getTarget("prev");
                                slider.flexAnimate(target, vars.pauseOnAction);
                            });
                            // Prevent iOS click event bug
                            if (touch) {
                                slider.directionNav.bind("click touchstart", function(event) {
                                    event.preventDefault();
                                });
                            }
                        },
                        update: function() {
                            var disabledClass = namespace + "disabled";
                            if (slider.pagingCount === 1) {
                                slider.directionNav.addClass(disabledClass);
                            } else if (!vars.animationLoop) {
                                if (slider.animatingTo === 0) {
                                    slider.directionNav.removeClass(disabledClass).filter("." + namespace + "prev").addClass(disabledClass);
                                } else if (slider.animatingTo === slider.last) {
                                    slider.directionNav.removeClass(disabledClass).filter("." + namespace + "next").addClass(disabledClass);
                                } else {
                                    slider.directionNav.removeClass(disabledClass);
                                }
                            } else {
                                slider.directionNav.removeClass(disabledClass);
                            }
                        }
                    },
                    pausePlay: {
                        setup: function() {
                            var pausePlayScaffold = $('<div class="' + namespace + 'pauseplay"><a></a></div>');
                            // CONTROLSCONTAINER:
                            if (slider.controlsContainer) {
                                slider.controlsContainer.append(pausePlayScaffold);
                                slider.pausePlay = $("." + namespace + "pauseplay a", slider.controlsContainer);
                            } else {
                                slider.append(pausePlayScaffold);
                                slider.pausePlay = $("." + namespace + "pauseplay a", slider);
                            }
                            methods.pausePlay.update(vars.slideshow ? namespace + "pause" : namespace + "play");
                            slider.pausePlay.bind(eventType, function(event) {
                                event.preventDefault();
                                if ($(this).hasClass(namespace + "pause")) {
                                    slider.manualPause = true;
                                    slider.manualPlay = false;
                                    slider.pause();
                                } else {
                                    slider.manualPause = false;
                                    slider.manualPlay = true;
                                    slider.play();
                                }
                            });
                            // Prevent iOS click event bug
                            if (touch) {
                                slider.pausePlay.bind("click touchstart", function(event) {
                                    event.preventDefault();
                                });
                            }
                        },
                        update: function(state) {
                            state === "play" ? slider.pausePlay.removeClass(namespace + "pause").addClass(namespace + "play").text(vars.playText) : slider.pausePlay.removeClass(namespace + "play").addClass(namespace + "pause").text(vars.pauseText);
                        }
                    },
                    touch: function() {
                        var startX, startY, offset, cwidth, dx, startT, scrolling = false;
                        el.addEventListener("touchstart", onTouchStart, false);
                        function onTouchStart(e) {
                            if (slider.animating) {
                                e.preventDefault();
                            } else if (e.touches.length === 1) {
                                slider.pause();
                                // CAROUSEL:
                                cwidth = vertical ? slider.h : slider.w;
                                startT = Number(new Date());
                                // CAROUSEL:
                                offset = carousel && reverse && slider.animatingTo === slider.last ? 0 : carousel && reverse ? slider.limit - (slider.itemW + vars.itemMargin) * slider.move * slider.animatingTo : carousel && slider.currentSlide === slider.last ? slider.limit : carousel ? (slider.itemW + vars.itemMargin) * slider.move * slider.currentSlide : reverse ? (slider.last - slider.currentSlide + slider.cloneOffset) * cwidth : (slider.currentSlide + slider.cloneOffset) * cwidth;
                                startX = vertical ? e.touches[0].pageY : e.touches[0].pageX;
                                startY = vertical ? e.touches[0].pageX : e.touches[0].pageY;
                                el.addEventListener("touchmove", onTouchMove, false);
                                el.addEventListener("touchend", onTouchEnd, false);
                            }
                        }
                        function onTouchMove(e) {
                            dx = vertical ? startX - e.touches[0].pageY : startX - e.touches[0].pageX;
                            scrolling = vertical ? Math.abs(dx) < Math.abs(e.touches[0].pageX - startY) : Math.abs(dx) < Math.abs(e.touches[0].pageY - startY);
                            if (!scrolling || Number(new Date()) - startT > 500) {
                                e.preventDefault();
                                if (!fade && slider.transitions) {
                                    if (!vars.animationLoop) {
                                        dx = dx / (slider.currentSlide === 0 && dx < 0 || slider.currentSlide === slider.last && dx > 0 ? Math.abs(dx) / cwidth + 2 : 1);
                                    }
                                    slider.setProps(offset + dx, "setTouch");
                                }
                            }
                        }
                        function onTouchEnd(e) {
                            // finish the touch by undoing the touch session
                            el.removeEventListener("touchmove", onTouchMove, false);
                            if (slider.animatingTo === slider.currentSlide && !scrolling && !(dx === null)) {
                                var updateDx = reverse ? -dx : dx, target = updateDx > 0 ? slider.getTarget("next") : slider.getTarget("prev");
                                if (slider.canAdvance(target) && (Number(new Date()) - startT < 550 && Math.abs(updateDx) > 50 || Math.abs(updateDx) > cwidth / 2)) {
                                    slider.flexAnimate(target, vars.pauseOnAction);
                                } else {
                                    if (!fade) slider.flexAnimate(slider.currentSlide, vars.pauseOnAction, true);
                                }
                            }
                            el.removeEventListener("touchend", onTouchEnd, false);
                            startX = null;
                            startY = null;
                            dx = null;
                            offset = null;
                        }
                    },
                    resize: function() {
                        if (!slider.animating && slider.is(":visible")) {
                            if (!carousel) slider.doMath();
                            if (fade) {
                                // SMOOTH HEIGHT:
                                methods.smoothHeight();
                            } else if (carousel) {
                                //CAROUSEL:
                                slider.slides.width(slider.computedW);
                                slider.update(slider.pagingCount);
                                slider.setProps();
                            } else if (vertical) {
                                //VERTICAL:
                                slider.viewport.height(slider.h);
                                slider.setProps(slider.h, "setTotal");
                            } else {
                                // SMOOTH HEIGHT:
                                if (vars.smoothHeight) methods.smoothHeight();
                                slider.newSlides.width(slider.computedW);
                                slider.setProps(slider.computedW, "setTotal");
                            }
                        }
                    },
                    smoothHeight: function(dur) {
                        if (!vertical || fade) {
                            var $obj = fade ? slider : slider.viewport;
                            dur ? $obj.animate({
                                height: slider.slides.eq(slider.animatingTo).height()
                            }, dur) : $obj.height(slider.slides.eq(slider.animatingTo).height());
                        }
                    },
                    sync: function(action) {
                        var $obj = $(vars.sync).data("flexslider"), target = slider.animatingTo;
                        switch (action) {
                          case "animate":
                            $obj.flexAnimate(target, vars.pauseOnAction, false, true);
                            break;

                          case "play":
                            if (!$obj.playing && !$obj.asNav) {
                                $obj.play();
                            }
                            break;

                          case "pause":
                            $obj.pause();
                            break;
                        }
                    }
                };
                // public methods
                slider.flexAnimate = function(target, pause, override, withSync, fromNav) {
                    if (asNav && slider.pagingCount === 1) slider.direction = slider.currentItem < target ? "next" : "prev";
                    if (!slider.animating && (slider.canAdvance(target, fromNav) || override) && slider.is(":visible")) {
                        if (asNav && withSync) {
                            var master = $(vars.asNavFor).data("flexslider");
                            slider.atEnd = target === 0 || target === slider.count - 1;
                            master.flexAnimate(target, true, false, true, fromNav);
                            slider.direction = slider.currentItem < target ? "next" : "prev";
                            master.direction = slider.direction;
                            if (Math.ceil((target + 1) / slider.visible) - 1 !== slider.currentSlide && target !== 0) {
                                slider.currentItem = target;
                                slider.slides.removeClass(namespace + "active-slide").eq(target).addClass(namespace + "active-slide");
                                target = Math.floor(target / slider.visible);
                            } else {
                                slider.currentItem = target;
                                slider.slides.removeClass(namespace + "active-slide").eq(target).addClass(namespace + "active-slide");
                                return false;
                            }
                        }
                        slider.animating = true;
                        slider.animatingTo = target;
                        // API: before() animation Callback
                        vars.before(slider);
                        // SLIDESHOW:
                        if (pause) slider.pause();
                        // SYNC:
                        if (slider.syncExists && !fromNav) methods.sync("animate");
                        // CONTROLNAV
                        if (vars.controlNav) methods.controlNav.active();
                        // !CAROUSEL:
                        // CANDIDATE: slide active class (for add/remove slide)
                        if (!carousel) slider.slides.removeClass(namespace + "active-slide").eq(target).addClass(namespace + "active-slide");
                        // INFINITE LOOP:
                        // CANDIDATE: atEnd
                        slider.atEnd = target === 0 || target === slider.last;
                        // DIRECTIONNAV:
                        if (vars.directionNav) methods.directionNav.update();
                        if (target === slider.last) {
                            // API: end() of cycle Callback
                            vars.end(slider);
                            // SLIDESHOW && !INFINITE LOOP:
                            if (!vars.animationLoop) slider.pause();
                        }
                        // SLIDE:
                        if (!fade) {
                            var dimension = vertical ? slider.slides.filter(":first").height() : slider.computedW, margin, slideString, calcNext;
                            // INFINITE LOOP / REVERSE:
                            if (carousel) {
                                margin = vars.itemWidth > slider.w ? vars.itemMargin * 2 : vars.itemMargin;
                                calcNext = (slider.itemW + margin) * slider.move * slider.animatingTo;
                                slideString = calcNext > slider.limit && slider.visible !== 1 ? slider.limit : calcNext;
                            } else if (slider.currentSlide === 0 && target === slider.count - 1 && vars.animationLoop && slider.direction !== "next") {
                                slideString = reverse ? (slider.count + slider.cloneOffset) * dimension : 0;
                            } else if (slider.currentSlide === slider.last && target === 0 && vars.animationLoop && slider.direction !== "prev") {
                                slideString = reverse ? 0 : (slider.count + 1) * dimension;
                            } else {
                                slideString = reverse ? (slider.count - 1 - target + slider.cloneOffset) * dimension : (target + slider.cloneOffset) * dimension;
                            }
                            slider.setProps(slideString, "", vars.animationSpeed);
                            if (slider.transitions) {
                                if (!vars.animationLoop || !slider.atEnd) {
                                    slider.animating = false;
                                    slider.currentSlide = slider.animatingTo;
                                }
                                slider.container.unbind("webkitTransitionEnd transitionend");
                                slider.container.bind("webkitTransitionEnd transitionend", function() {
                                    slider.wrapup(dimension);
                                });
                            } else {
                                slider.container.animate(slider.args, vars.animationSpeed, vars.easing, function() {
                                    slider.wrapup(dimension);
                                });
                            }
                        } else {
                            // FADE:
                            if (!touch) {
                                slider.slides.eq(slider.currentSlide).fadeOut(vars.animationSpeed, vars.easing);
                                slider.slides.eq(target).fadeIn(vars.animationSpeed, vars.easing, slider.wrapup);
                            } else {
                                slider.slides.eq(slider.currentSlide).css({
                                    opacity: 0,
                                    zIndex: 1
                                });
                                slider.slides.eq(target).css({
                                    opacity: 1,
                                    zIndex: 2
                                });
                                slider.slides.unbind("webkitTransitionEnd transitionend");
                                slider.slides.eq(slider.currentSlide).bind("webkitTransitionEnd transitionend", function() {
                                    // API: after() animation Callback
                                    vars.after(slider);
                                });
                                slider.animating = false;
                                slider.currentSlide = slider.animatingTo;
                            }
                        }
                        // SMOOTH HEIGHT:
                        if (vars.smoothHeight) methods.smoothHeight(vars.animationSpeed);
                    }
                };
                slider.wrapup = function(dimension) {
                    // SLIDE:
                    if (!fade && !carousel) {
                        if (slider.currentSlide === 0 && slider.animatingTo === slider.last && vars.animationLoop) {
                            slider.setProps(dimension, "jumpEnd");
                        } else if (slider.currentSlide === slider.last && slider.animatingTo === 0 && vars.animationLoop) {
                            slider.setProps(dimension, "jumpStart");
                        }
                    }
                    slider.animating = false;
                    slider.currentSlide = slider.animatingTo;
                    // API: after() animation Callback
                    vars.after(slider);
                };
                // SLIDESHOW:
                slider.animateSlides = function() {
                    if (!slider.animating) slider.flexAnimate(slider.getTarget("next"));
                };
                // SLIDESHOW:
                slider.pause = function() {
                    clearInterval(slider.animatedSlides);
                    slider.playing = false;
                    // PAUSEPLAY:
                    if (vars.pausePlay) methods.pausePlay.update("play");
                    // SYNC:
                    if (slider.syncExists) methods.sync("pause");
                };
                // SLIDESHOW:
                slider.play = function() {
                    slider.animatedSlides = setInterval(slider.animateSlides, vars.slideshowSpeed);
                    slider.playing = true;
                    // PAUSEPLAY:
                    if (vars.pausePlay) methods.pausePlay.update("pause");
                    // SYNC:
                    if (slider.syncExists) methods.sync("play");
                };
                slider.canAdvance = function(target, fromNav) {
                    // ASNAV:
                    var last = asNav ? slider.pagingCount - 1 : slider.last;
                    return fromNav ? true : asNav && slider.currentItem === slider.count - 1 && target === 0 && slider.direction === "prev" ? true : asNav && slider.currentItem === 0 && target === slider.pagingCount - 1 && slider.direction !== "next" ? false : target === slider.currentSlide && !asNav ? false : vars.animationLoop ? true : slider.atEnd && slider.currentSlide === 0 && target === last && slider.direction !== "next" ? false : slider.atEnd && slider.currentSlide === last && target === 0 && slider.direction === "next" ? false : true;
                };
                slider.getTarget = function(dir) {
                    slider.direction = dir;
                    if (dir === "next") {
                        return slider.currentSlide === slider.last ? 0 : slider.currentSlide + 1;
                    } else {
                        return slider.currentSlide === 0 ? slider.last : slider.currentSlide - 1;
                    }
                };
                // SLIDE:
                slider.setProps = function(pos, special, dur) {
                    var target = function() {
                        var posCheck = pos ? pos : (slider.itemW + vars.itemMargin) * slider.move * slider.animatingTo, posCalc = function() {
                            if (carousel) {
                                return special === "setTouch" ? pos : reverse && slider.animatingTo === slider.last ? 0 : reverse ? slider.limit - (slider.itemW + vars.itemMargin) * slider.move * slider.animatingTo : slider.animatingTo === slider.last ? slider.limit : posCheck;
                            } else {
                                switch (special) {
                                  case "setTotal":
                                    return reverse ? (slider.count - 1 - slider.currentSlide + slider.cloneOffset) * pos : (slider.currentSlide + slider.cloneOffset) * pos;

                                  case "setTouch":
                                    return reverse ? pos : pos;

                                  case "jumpEnd":
                                    return reverse ? pos : slider.count * pos;

                                  case "jumpStart":
                                    return reverse ? slider.count * pos : pos;

                                  default:
                                    return pos;
                                }
                            }
                        }();
                        return posCalc * -1 + "px";
                    }();
                    if (slider.transitions) {
                        target = vertical ? "translate3d(0," + target + ",0)" : "translate3d(" + target + ",0,0)";
                        dur = dur !== undefined ? dur / 1e3 + "s" : "0s";
                        slider.container.css("-" + slider.pfx + "-transition-duration", dur);
                    }
                    slider.args[slider.prop] = target;
                    if (slider.transitions || dur === undefined) slider.container.css(slider.args);
                };
                slider.setup = function(type) {
                    // SLIDE:
                    if (!fade) {
                        var sliderOffset, arr;
                        if (type === "init") {
                            slider.viewport = $('<div class="' + namespace + 'viewport"></div>').css({
                                overflow: "hidden",
                                position: "relative"
                            }).appendTo(slider).append(slider.container);
                            // INFINITE LOOP:
                            slider.cloneCount = 0;
                            slider.cloneOffset = 0;
                            // REVERSE:
                            if (reverse) {
                                arr = $.makeArray(slider.slides).reverse();
                                slider.slides = $(arr);
                                slider.container.empty().append(slider.slides);
                            }
                        }
                        // INFINITE LOOP && !CAROUSEL:
                        if (vars.animationLoop && !carousel) {
                            slider.cloneCount = 2;
                            slider.cloneOffset = 1;
                            // clear out old clones
                            if (type !== "init") slider.container.find(".clone").remove();
                            slider.container.append(slider.slides.first().clone().addClass("clone")).prepend(slider.slides.last().clone().addClass("clone"));
                        }
                        slider.newSlides = $(vars.selector, slider);
                        sliderOffset = reverse ? slider.count - 1 - slider.currentSlide + slider.cloneOffset : slider.currentSlide + slider.cloneOffset;
                        // VERTICAL:
                        if (vertical && !carousel) {
                            slider.container.height((slider.count + slider.cloneCount) * 200 + "%").css("position", "absolute").width("100%");
                            setTimeout(function() {
                                slider.newSlides.css({
                                    display: "block"
                                });
                                slider.doMath();
                                slider.viewport.height(slider.h);
                                slider.setProps(sliderOffset * slider.h, "init");
                            }, type === "init" ? 100 : 0);
                        } else {
                            slider.container.width((slider.count + slider.cloneCount) * 200 + "%");
                            slider.setProps(sliderOffset * slider.computedW, "init");
                            setTimeout(function() {
                                slider.doMath();
                                slider.newSlides.css({
                                    width: slider.computedW,
                                    "float": "left",
                                    display: "block"
                                });
                                // SMOOTH HEIGHT:
                                if (vars.smoothHeight) methods.smoothHeight();
                            }, type === "init" ? 100 : 0);
                        }
                    } else {
                        // FADE:
                        slider.slides.css({
                            width: "100%",
                            "float": "left",
                            marginRight: "-100%",
                            position: "relative"
                        });
                        if (type === "init") {
                            if (!touch) {
                                slider.slides.eq(slider.currentSlide).fadeIn(vars.animationSpeed, vars.easing);
                            } else {
                                slider.slides.css({
                                    opacity: 0,
                                    display: "block",
                                    webkitTransition: "opacity " + vars.animationSpeed / 1e3 + "s ease",
                                    zIndex: 1
                                }).eq(slider.currentSlide).css({
                                    opacity: 1,
                                    zIndex: 2
                                });
                            }
                        }
                        // SMOOTH HEIGHT:
                        if (vars.smoothHeight) methods.smoothHeight();
                    }
                    // !CAROUSEL:
                    // CANDIDATE: active slide
                    if (!carousel) slider.slides.removeClass(namespace + "active-slide").eq(slider.currentSlide).addClass(namespace + "active-slide");
                };
                slider.doMath = function() {
                    var slide = slider.slides.first(), slideMargin = vars.itemMargin, minItems = vars.minItems, maxItems = vars.maxItems;
                    slider.w = slider.width();
                    slider.h = slide.height();
                    slider.boxPadding = slide.outerWidth() - slide.width();
                    // CAROUSEL:
                    if (carousel) {
                        slider.itemT = vars.itemWidth + slideMargin;
                        slider.minW = minItems ? minItems * slider.itemT : slider.w;
                        slider.maxW = maxItems ? maxItems * slider.itemT : slider.w;
                        slider.itemW = slider.minW > slider.w ? (slider.w - slideMargin * minItems) / minItems : slider.maxW < slider.w ? (slider.w - slideMargin * maxItems) / maxItems : vars.itemWidth > slider.w ? slider.w : vars.itemWidth;
                        slider.visible = Math.floor(slider.w / (slider.itemW + slideMargin));
                        slider.move = vars.move > 0 && vars.move < slider.visible ? vars.move : slider.visible;
                        slider.pagingCount = Math.ceil((slider.count - slider.visible) / slider.move + 1);
                        slider.last = slider.pagingCount - 1;
                        slider.limit = slider.pagingCount === 1 ? 0 : vars.itemWidth > slider.w ? (slider.itemW + slideMargin * 2) * slider.count - slider.w - slideMargin : (slider.itemW + slideMargin) * slider.count - slider.w - slideMargin;
                    } else {
                        slider.itemW = slider.w;
                        slider.pagingCount = slider.count;
                        slider.last = slider.count - 1;
                    }
                    slider.computedW = slider.itemW - slider.boxPadding;
                };
                slider.update = function(pos, action) {
                    slider.doMath();
                    // update currentSlide and slider.animatingTo if necessary
                    if (!carousel) {
                        if (pos < slider.currentSlide) {
                            slider.currentSlide += 1;
                        } else if (pos <= slider.currentSlide && pos !== 0) {
                            slider.currentSlide -= 1;
                        }
                        slider.animatingTo = slider.currentSlide;
                    }
                    // update controlNav
                    if (vars.controlNav && !slider.manualControls) {
                        if (action === "add" && !carousel || slider.pagingCount > slider.controlNav.length) {
                            methods.controlNav.update("add");
                        } else if (action === "remove" && !carousel || slider.pagingCount < slider.controlNav.length) {
                            if (carousel && slider.currentSlide > slider.last) {
                                slider.currentSlide -= 1;
                                slider.animatingTo -= 1;
                            }
                            methods.controlNav.update("remove", slider.last);
                        }
                    }
                    // update directionNav
                    if (vars.directionNav) methods.directionNav.update();
                };
                slider.addSlide = function(obj, pos) {
                    var $obj = $(obj);
                    slider.count += 1;
                    slider.last = slider.count - 1;
                    // append new slide
                    if (vertical && reverse) {
                        pos !== undefined ? slider.slides.eq(slider.count - pos).after($obj) : slider.container.prepend($obj);
                    } else {
                        pos !== undefined ? slider.slides.eq(pos).before($obj) : slider.container.append($obj);
                    }
                    // update currentSlide, animatingTo, controlNav, and directionNav
                    slider.update(pos, "add");
                    // update slider.slides
                    slider.slides = $(vars.selector + ":not(.clone)", slider);
                    // re-setup the slider to accomdate new slide
                    slider.setup();
                    //FlexSlider: added() Callback
                    vars.added(slider);
                };
                slider.removeSlide = function(obj) {
                    var pos = isNaN(obj) ? slider.slides.index($(obj)) : obj;
                    // update count
                    slider.count -= 1;
                    slider.last = slider.count - 1;
                    // remove slide
                    if (isNaN(obj)) {
                        $(obj, slider.slides).remove();
                    } else {
                        vertical && reverse ? slider.slides.eq(slider.last).remove() : slider.slides.eq(obj).remove();
                    }
                    // update currentSlide, animatingTo, controlNav, and directionNav
                    slider.doMath();
                    slider.update(pos, "remove");
                    // update slider.slides
                    slider.slides = $(vars.selector + ":not(.clone)", slider);
                    // re-setup the slider to accomdate new slide
                    slider.setup();
                    // FlexSlider: removed() Callback
                    vars.removed(slider);
                };
                //FlexSlider: Initialize
                methods.init();
            };
            //FlexSlider: Default Settings
            $.flexslider.defaults = {
                namespace: "flex-",
                //{NEW} String: Prefix string attached to the class of every element generated by the plugin
                selector: ".slides > li",
                //{NEW} Selector: Must match a simple pattern. '{container} > {slide}' -- Ignore pattern at your own peril
                animation: "fade",
                //String: Select your animation type, "fade" or "slide"
                easing: "swing",
                //{NEW} String: Determines the easing method used in jQuery transitions. jQuery easing plugin is supported!
                direction: "horizontal",
                //String: Select the sliding direction, "horizontal" or "vertical"
                reverse: false,
                //{NEW} Boolean: Reverse the animation direction
                animationLoop: true,
                //Boolean: Should the animation loop? If false, directionNav will received "disable" classes at either end
                smoothHeight: false,
                //{NEW} Boolean: Allow height of the slider to animate smoothly in horizontal mode
                startAt: 0,
                //Integer: The slide that the slider should start on. Array notation (0 = first slide)
                slideshow: true,
                //Boolean: Animate slider automatically
                slideshowSpeed: 7e3,
                //Integer: Set the speed of the slideshow cycling, in milliseconds
                animationSpeed: 600,
                //Integer: Set the speed of animations, in milliseconds
                initDelay: 0,
                //{NEW} Integer: Set an initialization delay, in milliseconds
                randomize: false,
                //Boolean: Randomize slide order
                // Usability features
                pauseOnAction: true,
                //Boolean: Pause the slideshow when interacting with control elements, highly recommended.
                pauseOnHover: false,
                //Boolean: Pause the slideshow when hovering over slider, then resume when no longer hovering
                useCSS: true,
                //{NEW} Boolean: Slider will use CSS3 transitions if available
                touch: true,
                //{NEW} Boolean: Allow touch swipe navigation of the slider on touch-enabled devices
                video: false,
                //{NEW} Boolean: If using video in the slider, will prevent CSS3 3D Transforms to avoid graphical glitches
                // Primary Controls
                controlNav: true,
                //Boolean: Create navigation for paging control of each clide? Note: Leave true for manualControls usage
                directionNav: true,
                //Boolean: Create navigation for previous/next navigation? (true/false)
                prevText: "Previous",
                //String: Set the text for the "previous" directionNav item
                nextText: "Next",
                //String: Set the text for the "next" directionNav item
                // Secondary Navigation
                keyboard: true,
                //Boolean: Allow slider navigating via keyboard left/right keys
                multipleKeyboard: false,
                //{NEW} Boolean: Allow keyboard navigation to affect multiple sliders. Default behavior cuts out keyboard navigation with more than one slider present.
                mousewheel: false,
                //{UPDATED} Boolean: Requires jquery.mousewheel.js (https://github.com/brandonaaron/jquery-mousewheel) - Allows slider navigating via mousewheel
                pausePlay: false,
                //Boolean: Create pause/play dynamic element
                pauseText: "Pause",
                //String: Set the text for the "pause" pausePlay item
                playText: "Play",
                //String: Set the text for the "play" pausePlay item
                // Special properties
                controlsContainer: "",
                //{UPDATED} jQuery Object/Selector: Declare which container the navigation elements should be appended too. Default container is the FlexSlider element. Example use would be $(".flexslider-container"). Property is ignored if given element is not found.
                manualControls: "",
                //{UPDATED} jQuery Object/Selector: Declare custom control navigation. Examples would be $(".flex-control-nav li") or "#tabs-nav li img", etc. The number of elements in your controlNav should match the number of slides/tabs.
                sync: "",
                //{NEW} Selector: Mirror the actions performed on this slider with another slider. Use with care.
                asNavFor: "",
                //{NEW} Selector: Internal property exposed for turning the slider into a thumbnail navigation for another slider
                // Carousel Options
                itemWidth: 0,
                //{NEW} Integer: Box-model width of individual carousel items, including horizontal borders and padding.
                itemMargin: 0,
                //{NEW} Integer: Margin between carousel items.
                minItems: 0,
                //{NEW} Integer: Minimum number of carousel items that should be visible. Items will resize fluidly when below this.
                maxItems: 0,
                //{NEW} Integer: Maxmimum number of carousel items that should be visible. Items will resize fluidly when above this limit.
                move: 0,
                //{NEW} Integer: Number of carousel items that should move on animation. If 0, slider will move all visible items.
                // Callback API
                start: function() {},
                //Callback: function(slider) - Fires when the slider loads the first slide
                before: function() {},
                //Callback: function(slider) - Fires asynchronously with each slider animation
                after: function() {},
                //Callback: function(slider) - Fires after each slider animation completes
                end: function() {},
                //Callback: function(slider) - Fires when the slider reaches the last slide (asynchronous)
                added: function() {},
                //{NEW} Callback: function(slider) - Fires after a slide is added
                removed: function() {}
            };
            //FlexSlider: Plugin Function
            $.fn.flexslider = function(options) {
                if (options === undefined) options = {};
                if (typeof options === "object") {
                    return this.each(function() {
                        var $this = $(this), selector = options.selector ? options.selector : ".slides > li", $slides = $this.find(selector);
                        if ($slides.length === 1) {
                            $slides.fadeIn(400);
                            if (options.start) options.start($this);
                        } else if ($this.data("flexslider") == undefined) {
                            new $.flexslider(this, options);
                        }
                    });
                } else {
                    // Helper strings to quickly perform functions on the slider
                    var $slider = $(this).data("flexslider");
                    switch (options) {
                      case "play":
                        $slider.play();
                        break;

                      case "pause":
                        $slider.pause();
                        break;

                      case "next":
                        $slider.flexAnimate($slider.getTarget("next"), true);
                        break;

                      case "prev":
                      case "previous":
                        $slider.flexAnimate($slider.getTarget("prev"), true);
                        break;

                      default:
                        if (typeof options === "number") $slider.flexAnimate(options, true);
                    }
                }
            };
        })(jQuery);
    };
});

/**
 * @author  Erick Song
 * @date    2015-09-28
 * @email   ahschl0322@gmail.com
 * @info    loader - 加载器

 * Loader.load('url', params, sucessCallback, errorcallback, beforeSend, scope);

 * Loader.load('ordersvc/v1/getLastNews.json?', {
 *     type : 'hoster',
 *     roomid : webcfg.roomid,
 *     limit : 20,
 *     __config__ : {
 *        cache : true,
 *        callback : 'getCallback'
 *     }
 * }, function(d){
 *     if(d && d.err === 0 && d.data){
 *        GIftRender($('#gift ul'), d.data);
 *    }
 * });
 *
 */
define("util/loader/loader", [ "core/jquery/1.8.3/jquery", "util/log/log", "util/platform/plt", "util/browser/browser", "util/net/urlquery" ], function(require, exports, module) {
    var $ = require("core/jquery/1.8.3/jquery");
    var log = require("util/log/log");
    var loaderParams = require("util/platform/plt");
    var Loader = {}, N = 0;
    function load(url, params, callback, errorcallback, beforecallback, scope) {
        log("Loader load====", url, params);
        var sevurl = url, _config = {}, _cdn, prefix = "pplive_callback_", callbackName = "", beforeCallback = beforecallback || $.noop, errorCallback = typeof errorcallback == "function" ? errorcallback : $.noop, opts = {
            from: "chang",
            version: "2.1.0",
            format: "jsonp"
        };
        params = $.extend(opts, loaderParams, params);
        if (params.__config__) {
            _config = params.__config__;
            delete params.__config__;
        }
        _cdn = _config.cache === true || _config.cdn === true && _config.callback ? true : false;
        sevurl = sevurl.indexOf("?") > -1 ? sevurl + "&" : sevurl + "?";
        sevurl += $.param(params);
        sevurl = sevurl.replace(/&&/, "&").replace(/\?\?/, "?");
        if (sevurl.match(/cb=.*/i)) {
            callbackName = /cb=(.*?(?=&)|.*)/.exec(sevurl)[1];
            sevurl = sevurl.replace(/(.*)?(cb=.*?\&+)/, "$1");
        } else {
            callbackName = _cdn ? _config.callback : prefix + N++;
        }
        $.ajax({
            dataType: "jsonp",
            type: "GET",
            cache: _config.cache === 0 ? false : true,
            url: sevurl,
            jsonp: "cb",
            jsonpCallback: function() {
                return callbackName;
            },
            beforeSend: function(XMLHttpRequest) {
                beforeCallback();
            },
            success: function(data) {
                _config = null;
                if (callback && typeof callback == "function") {
                    callback.apply(scope, arguments);
                }
            },
            timeout: 1e4,
            statusCode: {
                404: function() {
                    errorCallback();
                },
                500: function() {
                    errorCallback();
                },
                502: function() {
                    errorCallback();
                },
                504: function() {
                    errorCallback();
                },
                510: function() {
                    errorCallback();
                }
            },
            error: function(XMLHttpRequest, textStatus, errorThrown) {
                log("Ajax Load error: ", sevurl, XMLHttpRequest, textStatus, errorThrown);
                errorCallback();
            }
        });
    }
    function ajax(option) {
        var opt = $.extend({
            type: "GET",
            dataType: "jsonp",
            cache: true,
            jsonp: "cb",
            success: function() {},
            error: function() {}
        }, loaderParams, option);
        var success = opt.success;
        opt.success = function(data) {
            if (!data.err) {
                success(data);
            } else {}
        };
        return $.ajax(opt);
    }
    Loader = {
        load: load,
        ajax: ajax
    };
    module.exports = Loader;
});

/**
 * @author  Erick Song
 * @date    2012-08-22
 * @email   ahschl0322@gmail.com
 * @info    console.log moudle
 *
 * 2014-03-20   增加sendLog方法发送错误日志
 *
 */
define("util/log/log", [], function(require) {
    var logdiv, logstr = "", doc = document, curl = window.location.href, encode = encodeURIComponent, isDebug = window.DEBUG || curl.slice(-4) === "-deb" ? true : false;
    var pe = {
        serviceUrl: "http://web.data.pplive.com/pe/1.html?",
        newImg: new Image(),
        adr: curl,
        sadr: "log",
        et: "js",
        n: "ERROR_"
    };
    var sendLog = function(e, prefix) {
        prefix = prefix || "default";
        pe.newImg.src = pe.serviceUrl + "et=" + pe.et + "&adr=" + encode(pe.adr) + "&sadr=" + encode(pe.sadr) + "&n=" + encode(pe.n + prefix + "_" + (e.message || e));
    };
    if (!window.console) {
        window.console = {};
        window.console.log = function() {
            return;
        };
    }
    //log
    window.log = function() {
        if (isDebug && this.console) {
            console.log(date2str(new Date(), "hh:mm:ss"), [].slice.call(arguments));
        }
    };
    log.sendLog = sendLog;
    if (isDebug) {
        log.sendLog = function() {};
    }
    //firelite + log
    if (curl.indexOf("firelite=1") > -1) {
        var a = doc.createElement("A");
        a.href = 'javascript:if(!window.firebug){window.firebug=document.createElement("script");firebug.setAttribute("src","http://getfirebug.com/releases/lite/1.2/firebug-lite-compressed.js");document.body.appendChild(firebug);(function(){if(window.firebug.version){firebug.init()}else{setTimeout(arguments.callee)}})();void (firebug);if(window.log){(function(){if(window.firebug&&window.firebug.version){for(var a=0;a<log.history.length;a++){console.log(log.history[a])}}else{setTimeout(arguments.callee,100)}})()}};';
        a.style.cssText = "position:absolute;right:0;top:0;color:#000;font-size:12px;border:1px solid #f00";
        a.innerHTML = "Filelite + Log";
        doc.body.appendChild(a);
    }
    /*else if(curl.indexOf('log=1') > -1){
        for(var i = 0, l = arguments.length; i < l; i ++){ logstr += arguments[i] + " ## " ;}
        if(typeof(logdiv) == 'undefined'){
            logdiv = doc.createElement('div');
            logdiv.style.cssText = 'position:absolute;left:0;bottom:0;width:400px;height:200px;overflow:hidden;overflow-y:auto;border:1px solid #f00;z-index:10000;background:#ccc';
            doc.body.appendChild(logdiv);
        }
        logdiv.innerHTML += logstr + '<br />';
    }else{}*/
    function date2str(x, y) {
        var z = {
            M: x.getMonth() + 1,
            d: x.getDate(),
            h: x.getHours(),
            m: x.getMinutes(),
            s: x.getSeconds()
        };
        y = y.replace(/(M+|d+|h+|m+|s+)/g, function(v) {
            return ((v.length > 1 ? "0" : "") + eval("z." + v.slice(-1))).slice(-2);
        });
        return y.replace(/(y+)/g, function(v) {
            return x.getFullYear().toString().slice(-v.length);
        });
    }
    return log;
});

/**
 * @author  Erick Song
 * @date    2015-09-28
 * @email   ahschl0322@gmail.com
 * @info    返回三个维度信息
 *
 * 平台 - 网站|客户端|多终端
 * plt = pc|clt|mut
 *
 * 系统平台
 * platform = mobile|ipad|web|clt
 *
 * 浏览器信息
 * device = ie|moz|chrome|safari|opear|weixin|iphone|ipad|android|winphone
 *
 */
define("util/platform/plt", [ "util/browser/browser", "util/net/urlquery" ], function(require, exports, module) {
    var browser = require("util/browser/browser");
    var query = require("util/net/urlquery");
    var params = {};
    var SPLITCHAT = {
        plt: [ "WEB", "CLT", "MUT" ],
        platform: [ "IPAD", "MOBILE", "WEB", "CLT" ],
        device: [ "IE", "MOZ", "CHROME", "SAFARI", "OPERA", "WEIXIN", "IPHONE", "IPAD", "ANDROID", "ITOUCH", "WINPHONE" ]
    };
    for (var key in SPLITCHAT) {
        for (var k = 0, lenk = SPLITCHAT[key].length; k < lenk; k++) {
            var mapKey = SPLITCHAT[key][k];
            if (browser[mapKey]) {
                params[key] = mapKey.toLowerCase();
                break;
            }
        }
    }
    //merge if the key in params
    for (var i in query) {
        if (params[i]) params[i] = query[i];
    }
    return params;
});

/**
 * @author: xuxin | seanxu@pptv.com
 * @Date: 13-7-18
 * @history
 */
define("util/browser/browser", [], function(require, exports, module) {
    var ua = navigator.userAgent.toLowerCase();
    var external = window.external || "";
    var core, m, extra, version, os;
    var isMobile = function() {
        var check = false;
        (function(a, b) {
            if (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0, 4))) {
                check = true;
            }
        })(navigator.userAgent || navigator.vendor || window.opera);
        check = ua.match(/(iphone|ipod|android|ipad|blackberry|webos|windows phone)/i) ? true : false;
        return check;
    }();
    var numberify = function(s) {
        var c = 0;
        return parseFloat(s.replace(/\./g, function() {
            return c++ == 1 ? "" : ".";
        }));
    };
    var isClient = function() {
        //是否是客户端
        try {
            if (external && external.GetObject) {
                return true;
            }
        } catch (e) {}
        return false;
    }();
    try {
        if (/windows|win32/i.test(ua)) {
            os = "windows";
        } else if (/macintosh/i.test(ua)) {
            os = "macintosh";
        } else if (/rhino/i.test(ua)) {
            os = "rhino";
        }
        if ((m = ua.match(/applewebkit\/([^\s]*)/)) && m[1]) {
            core = "webkit";
            version = numberify(m[1]);
        } else if ((m = ua.match(/presto\/([\d.]*)/)) && m[1]) {
            core = "presto";
            version = numberify(m[1]);
        } else if (m = ua.match(/msie\s([^;]*)/)) {
            core = "trident";
            version = 1;
            if ((m = ua.match(/trident\/([\d.]*)/)) && m[1]) {
                version = numberify(m[1]);
            }
        } else if (/gecko/.test(ua)) {
            core = "gecko";
            version = 1;
            if ((m = ua.match(/rv:([\d.]*)/)) && m[1]) {
                version = numberify(m[1]);
            }
        }
        if (/world/.test(ua)) {
            extra = "world";
        } else if (/360se/.test(ua)) {
            extra = "360";
        } else if (/maxthon/.test(ua) || typeof external.max_version == "number") {
            extra = "maxthon";
        } else if (/tencenttraveler\s([\d.]*)/.test(ua)) {
            extra = "tt";
        } else if (/se\s([\d.]*)/.test(ua)) {
            extra = "sogou";
        }
    } catch (e) {}
    var ret = {
        OS: os,
        CORE: core,
        Version: version,
        EXTRA: extra ? extra : false,
        IE: /msie/.test(ua) || /trident/.test(ua) && /rv[:\s]\d+/.test(ua),
        OPERA: /opera/.test(ua),
        MOZ: /gecko/.test(ua) && !/(compatible|webkit)/.test(ua),
        IE5: /msie 5 /.test(ua),
        IE55: /msie 5.5/.test(ua),
        IE6: /msie 6/.test(ua),
        IE7: /msie 7/.test(ua),
        IE8: /msie 8/.test(ua),
        IE9: /msie 9/.test(ua),
        SAFARI: !/chrome\/([\d.]*)/.test(ua) && /\/([\da-f.]*) safari/.test(ua),
        CHROME: /chrome\/([\d.]*)/.test(ua),
        //!!window["chrome"]
        IPAD: /\(ipad/i.test(ua),
        IPHONE: /\(iphone/i.test(ua),
        ITOUCH: /\(itouch/i.test(ua),
        ANDROID: /android|htc/i.test(ua) || /linux/i.test(ua.platform + ""),
        IOS: /iPhone|iPad|iPod|iOS/i.test(ua),
        MOBILE: isMobile,
        WEIXIN: /micromessenger/i.test(ua),
        WINPHONE: /windows phone/i.test(ua),
        WEB: !/iPhone|iPad|iPod|iOS/i.test(ua) && !/android|htc/i.test(ua) && !/windows phone/i.test(ua),
        CLT: isClient
    };
    ret["MUT"] = !ret.WEB && !ret.CLIENT;
    return ret;
});

/**
 * 获取url参数，返回一个对象
 */
define("util/net/urlquery", [], function(require) {
    var queryStr = window.location.search;
    if (queryStr.indexOf("?") === 0 || queryStr.indexOf("#") === 0) {
        queryStr = queryStr.substring(1, queryStr.length);
    }
    var queryObj = {};
    var tt = queryStr.split("&");
    for (var i in tt) {
        var ss = typeof tt[i] == "string" ? tt[i].split("=") : [];
        if (ss.length == 2) {
            queryObj[ss[0]] = decodeURIComponent(ss[1]);
        }
    }
    return queryObj;
});

define("util/linkcfg/interfaceurl", [], function(require, exports) {
    var client_suffix = "?plt=clt";
    var redirectiUrl = {
        registration: "http://chang.pptv.com/pc/registration",
        registrationComplete: "http://chang.pptv.com/pc/registration/pg_complete",
        usercenter: "http://passport.pptv.com/usercenter.aspx",
        oneSingTab: "http://passport.pptv.com/v2/profile/yichangchengming.jsp",
        upload: "http://chang.pptv.com/pc/upload",
        contract_client: "http://w2c.pptv.com/p/zt.chang.pptv.com/news/protocol/17551401.html",
        contract_pc: "http://zt.chang.pptv.com/news/protocol/17551401.html"
    };
    // chackSign 确认是否报名
    var interfaceUrl = {
        checkSign: "http://api.chang.pptv.com/api/checksign",
        phonetoken: "http://api.chang.pptv.com/api/phonetoken",
        sign: "http://api.chang.pptv.com/api/sign",
        voteCollection: "http://api.cdn.vote.pptv.com/vote/collection",
        videoRank: "http://chang.pptv.com/api/video_rank",
        gettreadmill: "http://api.cdn.chang.pptv.com/api/gettreadmill",
        speed: "http://chang.pptv.com/api/speed",
        singList: "http://api.cdn.chang.pptv.com/api/singList",
        uploadCommit: "http://api.chang.pptv.com/api/cimmit_video",
        tagMarquee: "http://chang.pptv.com/api/rank_list",
        PKList_pc: "http://api.cdn.chang.pptv.com/api/PKList_pc",
        reward: "http://chang.pptv.com/api/reward",
        videoList: "http://chang.pptv.com/api/video_list",
        pklistAll: "http://chang.pptv.com/api/pk",
        concertAll: "http://chang.pptv.com/api/concert",
        goldlist: "http://chang.pptv.com/api/sprint_players",
        matchResult: "http://chang.pptv.com/api/match_result",
        goldExtra: "http://chang.pptv.com/api/pg_sprint_players_extra"
    };
    var commonUrl = {
        pc: {
            player: "http://chang.pptv.com/pc/player/",
            suffix: ""
        },
        clt: {
            player: "http://chang.pptv.com/pc/player/",
            suffix: "plt=clt"
        },
        app: {
            player: "http://chang.pptv.com/app/player/",
            suffix: "type=app"
        },
        h5: {
            player: "http://chang.pptv.com/app/player/",
            suffix: "type=share"
        },
        ipad: {
            player: "http://chang.pptv.com/ipad/player/",
            suffix: "type=app"
        }
    };
    return {
        redirect: redirectiUrl,
        "interface": interfaceUrl,
        commonUrl: commonUrl
    };
});

define("util/linkcfg/pcredirect", [ "util/login/login", "core/jquery/1.8.3/jquery", "util/user/user", "client", "util/cookie/cookie", "util/linkcfg/interfaceurl", "util/loader/loader", "util/log/log", "util/platform/plt", "util/browser/browser", "util/net/urlquery" ], function(require, exports) {
    //登录跳转模块
    var login = require("util/login/login");
    var user = require("util/user/user");
    var urls = require("util/linkcfg/interfaceurl");
    var loader = require("util/loader/loader");
    var $ = require("core/jquery/1.8.3/jquery");
    var addEvent = false;
    var client_suffix = "?plt=clt";
    var isClient = function() {
        //是否是客户端
        try {
            if (external && external.GetObject) {
                return true;
            }
        } catch (e) {}
        return false;
    }();
    function validateRegist() {
        var username = user.info.UserName;
        loader.load(urls["interface"]["checkSign"], {}, function(data) {
            if (data.status == -1) {
                //已经报过名
                var registrationComplete = urls["redirect"]["registrationComplete"];
                if (!!isClient) {
                    window.location = registrationComplete + client_suffix;
                } else {
                    window.location = registrationComplete;
                }
            } else if (data.status == 1) {
                //未报名
                var registrationUrl = urls["redirect"]["registration"];
                if (!!isClient) {
                    window.location = registrationUrl + client_suffix;
                } else {
                    window.location = registrationUrl;
                }
            }
        });
    }
    var loginFunc = function() {
        validateRegist();
    };
    $(".apply .btn,.js-apply").on("click", function(e) {
        var isLogin = login.isLogined();
        e.stopPropagation();
        e.preventDefault();
        if (!isLogin) {
            if (!addEvent) {
                addEvent = true;
                user.loginEvents.add(loginFunc);
                //1分钟未登录取消绑定事件
                setTimeout(function() {
                    user.loginEvents.remove(loginFunc);
                    addEvent = false;
                }, 6e4);
            }
            login.init({
                type: "login",
                tip: encodeURIComponent("亲，需要登录后才能报名哦")
            });
        } else if (!!isLogin) {
            //请求接口查看是否报过名，报过名的跳转个人空间
            validateRegist();
        }
    });
});

/**
 * @author  Erick Song
 * @email   ahschl0322@gmail.com
 * @info    通用login
 */
define("util/login/login", [ "core/jquery/1.8.3/jquery", "util/user/user", "client", "util/cookie/cookie" ], function(require) {
    var $ = require("core/jquery/1.8.3/jquery"), user = require("util/user/user"), cookie = require("util/cookie/cookie"), doc = document, ipadPlayer = function(s) {
        var videoPlayer = $("video");
        if (videoPlayer.length === 0) return;
        if (s == "hidden") {
            videoPlayer.each(function() {
                $(this).attr("_controls", $(this).attr("controls"));
                $(this).removeAttr("controls");
            });
        } else {
            videoPlayer.each(function() {
                $(this).attr("controls", $(this).attr("_controls"));
            });
        }
    };
    try {
        doc.domain = "pptv.com";
    } catch (err) {}
    var isClient = function() {
        //是否是客户端
        try {
            if (external && external.GetObject) {
                return true;
            }
        } catch (e) {}
        return false;
    }();
    var clientCommon = window.clientCommon;
    if (isClient && clientCommon) {
        clientCommon.onLogin(function() {
            var sid = setInterval(function() {
                user.readInfo(true);
                clearInterval(sid);
            }, 1e3);
        });
        clientCommon.onLogout(function() {
            user.logout();
        });
    }
    var layer = function() {
        var self = this, now = +new Date(), _cssopts = {}, params = {
            type: "login"
        }, isLoged = !!(cookie.get("PPName") && cookie.get("UDI")) || false, size = "standard";
        var urls = {
            standard: "http://pub.aplus.pptv.com/wwwpub/weblogin/?tab=",
            mobile: "http://pub.aplus.pptv.com/phonepub/mobilogin/?tab=",
            mobile_web: "http://pub.aplus.pptv.com/wwwpub/weblogin/mobilelogin?tab=",
            mobile_web_nosns: "http://pub.aplus.pptv.com/wwwpub/weblogin/mobilelogin?sns=0",
            mini: "http://pub.aplus.pptv.com/wwwpub/minilogin/?tab=",
            tiny: "http://app.aplus.pptv.com/zt/2013/cwpd/plogin/?tab=",
            empty: "about:blank"
        };
        var wp_div = doc.createElement("div"), msk_div = doc.createElement("div"), btn_close = doc.createElement("span");
        wp_div.setAttribute("id", _cssopts.id);
        wp_div.setAttribute("class", "layer loginlayer");
        wp_div.id = "layer_" + now;
        btn_close.className = "layer_close";
        btn_close.innerHTML = "<a href='javascript:;' onclick='close_" + now + "()' class='close'></a>";
        wp_div.innerHTML = "<iframe id='iframe' src='" + urls.empty + "' style='overflow:visible;z-index:2' width='100%' height='100%'  scrolling='no' frameborder='0'></iframe>";
        btn_close.style.cssText = "position:absolute; right:15px; top:15px; width:20px; height:20px; text-align:center;background:url('http://static9.pplive.cn/pptv/index/v_201203081858/images/no.gif'); cursor:pointer";
        wp_div.appendChild(btn_close);
        var wp_width = "620", //$(wp_div).width(),
        wp_height = "498", //$(wp_div).height(),
        st = $(doc).scrollTop(), sl = $(doc).scrollLeft();
        _cssopts = {
            width: wp_width + "px",
            height: wp_height + "px",
            visibility: "hidden",
            position: "absolute",
            top: "50%",
            left: "50%",
            "margin-top": st - 450 / 2 + "px",
            "margin-left": sl - wp_width / 2 + "px",
            "z-index": 1e4
        };
        return {
            init: function(opts, cssopts) {
                doc.body.appendChild(wp_div);
                $(wp_div).css(_cssopts);
                //仅针对直播秀或iPad
                wp_div.style.cssText = "width:0; height:0;overflow:hidden";
                var iframe = $("#iframe");
                iframe.on("load", function() {
                    if (navigator.userAgent.indexOf("MSIE") > -1) {
                        $(this).height(430);
                    } else {
                        var doc = this.contentDocument;
                        $(this).height($(doc).find("body").height());
                    }
                });
                window["iframehide"] = function() {
                    var c = doc.getElementById("iframe");
                    wp_div.style.visibility = "hidden";
                    $(wp_div).css({
                        width: "0",
                        height: "0"
                    });
                    ipadPlayer("visible");
                };
                var isLogined = this.isLogined();
                if (isLogined) {
                    user.readInfo(true);
                    return;
                }
                params = $.extend(params, opts);
                if (isClient && clientCommon) {
                    if (params.type == "login") {
                        clientCommon.showLoginBox();
                    } else if (params.type == "reg") {
                        clientCommon.showRegBox();
                    }
                    return;
                }
                st = $(doc).scrollTop();
                sl = $(doc).scrollLeft();
                /** Web请求参数from
                 *  web顶部信息条    web_toplist
                 *  直播秀      web_liveshow
                 *  评论/聊聊   web_comt
                 *  跳过广告    web_adskip
                 *  添加榜单    web_list
                 *  直播频道互动  web_liveinter
                 *  Web_page(注册网页)
                 *  Web_adskip(跳过广告)
                 *  自定义导航   web_topnav
                 *  播放页订阅/收藏    web_collect
                 *
                **/
                /** app表示哪个应用登录，
                 * vas需求 - app=ppshow，调用vas登录、注册api
                 */
                if (iframe.length > 0) {
                    if (params.hasOwnProperty("size")) {
                        size = params["size"];
                    }
                    iframe[0].src = urls[size] + params.type + "&from=" + params.from + "&app=" + params.app + (params.tip ? "&tip=" + params.tip : "");
                    // + '&r=' + Math.random();
                    _cssopts["margin-top"] = st - 450 / 2 + "px";
                    _cssopts["margin-left"] = sl - wp_width / 2 + "px";
                    _cssopts = cssopts ? $.extend(_cssopts, cssopts) : _cssopts;
                    if (size == "mobile_web" || size == "mobile_web_nosns") {
                        _cssopts["margin-top"] = "0px";
                        _cssopts["margin-left"] = "0px";
                        _cssopts["top"] = (document.body.scrollTop || document.documentElement.scrollTop) + "px";
                        _cssopts["left"] = "0px";
                        _cssopts["width"] = "100%";
                        _cssopts["height"] = "100%";
                        _cssopts["overflow"] = "auto";
                        $(wp_div).find(".layer_close").hide();
                    }
                    $(wp_div).css(_cssopts);
                    iframe.parent().css("visibility", "visible");
                    ipadPlayer("hidden");
                }
                btn_close.onclick = function() {
                    wp_div.style.visibility = "hidden";
                    $(wp_div).css({
                        width: "0",
                        height: "0"
                    });
                    if (window.CustomListDialog) {
                        CustomListDialog.close();
                    }
                    ipadPlayer("visible");
                };
            },
            success: {},
            isLogined: function() {
                if (isClient && clientCommon) {
                    //客户端
                    return clientCommon.userIsLogin();
                } else {
                    return !!(cookie.get("PPName") && cookie.get("UDI"));
                }
            },
            show: function(params) {},
            hide: function() {
                doc.body.removeChild(wp_div);
            },
            check: function(callback, params, cssobj) {
                var isLogined = this.isLogined();
                if (params) {
                    if (params.from) {
                        this.success[params.from] = callback;
                    }
                    if (params.size in urls) {
                        size = params.size;
                    }
                }
                if (isLogined) {
                    if (callback && typeof callback == "function") {
                        callback();
                    }
                } else {
                    this.init(params, cssobj);
                }
            },
            logout: function(callback) {
                if (callback && typeof callback == "function") {
                    user.onLogout(callback);
                } else {
                    user.logout();
                }
            },
            onSuccess: function(arg, from) {
                user.readInfo(true);
                //触发登录
                if (arg == "success" && this.success[from]) {
                    this.check(this.success[from]);
                }
            }
        };
    }();
    return layer;
});

/**
 *用户登陆请求和用户数据信息读取
 * mirongxu
 */
define("util/user/user", [ "core/jquery/1.8.3/jquery", "client", "util/cookie/cookie" ], function(require) {
    var jq = require("core/jquery/1.8.3/jquery"), clientCommon = require("client"), cookie = require("util/cookie/cookie"), encode = encodeURIComponent, infoKeys = [ "Gender", //性别
    "PpNum", //用户极点
    "ExpNum", //用户经验值
    "LevelName", //用户等级
    "NextLevelName", //下一等级名称
    "NextLevelExpNum", //下一等级相差经验值
    "Area", //省市
    "Subscribe", //用户一天的节目订阅数
    "UnreadNotes", //未读的小纸条数
    "HeadPic", //用户图像
    "Email", //用户Email
    "OnlineTime", //在线时间
    "Birthday", //生日
    "BlogAddress", //blog地址
    "Signed", //签名档
    "Type", //节目类型
    "Nickname", //昵称
    "isVip", //vip -> 0|1|2
    "VipDate", //vip过期日期
    "IsNoad", //去广告
    "NoadDate", //
    "IsSpdup", //加速
    "SpdupDate", "IsRtmp", //低延迟直播RTMP
    "RtmpDate", //
    "IsUgspeed", //UGS等级加速
    "UgspeedDate" ], domain = "pptv.com", path = "/", loginUrl = "http://passport.pptv.com/weblogin.do?";
    //登陆，退出defer
    var loginDefer = jq.Deferred(), logoutDefer = jq.Deferred(), loginPromise = jq.when(loginDefer), logoutPromise = jq.when(logoutDefer);
    function htmlEncode(s) {
        return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }
    var isClient = function() {
        //是否是客户端
        try {
            if (external && external.GetObject) {
                return true;
            }
        } catch (e) {}
        return false;
    }();
    // var clientCommon = window.clientCommon;
    var User = {
        /**
         * 用户信息对象
         */
        info: {},
        isLogined: false,
        /**
         * 读取用户cookie，并触发登陆或者退出
         */
        readInfo: function(notify) {
            //在UDI存在时，用UDI中的信息填充info
            //UDI若不存在，判断是否是客户端
            //  若不是客户端，代表没有登录，触发logout通知
            //  若是客户端，调用客户端接口判断是否登录
            //      若登录，从客户端中读取info信息，客户端中只能读到部分信息
            var udi = cookie.get("UDI");
            var ppname = cookie.get("PPName");
            if (udi == null || ppname == null) {
                if (isClient && clientCommon && clientCommon.userIsLogin()) {
                    var passport = external.GetObject("@pplive.com/passport;1");
                    this.info["UserName"] = passport.userName;
                    this.info["Nickname"] = passport.nickName;
                    this.info["HeadPic"] = passport.facePictureURL;
                    this.info["isVip"] = passport.isVipUser;
                } else {
                    //触发logout通知
                    if (notify) {
                        this.logoutEvents.fire();
                        logoutDefer.resolve();
                    }
                    return this.info;
                }
            } else {
                // Java的URLEncode是把空格encode为加号，因此要先进行替换
                var infoList = udi.replace(/\+/g, "%20").replace(/\%/g, "%25").split("$");
                //把UDI字段拆分存放到info对象中
                for (var i = 0; i < infoList.length; i++) {
                    this.info[infoKeys[i]] = infoList[i];
                }
                this.info["Nickname"] = decodeURIComponent(this.info["Nickname"]);
                //把PPName字段信息拆分存放info对象中
                var nameList = ppname.split("$");
                this.info["UserName"] = decodeURIComponent(nameList[0]);
            }
            if (isClient && clientCommon && clientCommon.userIsLogin()) {
                this.info["token"] = external.GetObject("@pplive.com/passport;1").token;
            } else {
                this.info["token"] = cookie.get("ppToken");
            }
            this.isLogined = true;
            if (notify) {
                if (loginDefer.state() == "resolved" || loginDefer.state() == "pending") {
                    this.loginEvents.fire(this.info);
                }
                loginDefer.resolve(this.info);
            }
            return this.info;
        },
        /**
         * 登陆
         */
        login: function(name, password, callback) {
            var self = this;
            jq.ajax({
                url: loginUrl,
                dataType: "jsonp",
                jsonp: "cb",
                data: {
                    username: name,
                    password: password
                },
                success: function(statu, json) {
                    if (statu == 1) {
                        self._writeInfo(json);
                    }
                    callback(statu, self.info);
                    loginDefer.resolve(self.info);
                    self.loginEvents.fire(self.info);
                }
            });
            return this;
        },
        /**
         * 退出
         */
        logout: function() {
            if (isClient && clientCommon) {
                try {
                    var passport = external.GetObject("@pplive.com/passport;1");
                    passport.Logout();
                } catch (e) {}
            }
            cookie.remove("PPKey", domain, path);
            cookie.remove("UDI", domain, path);
            cookie.remove("PPName", domain, path);
            cookie.remove("ppToken", domain, path);
            this.isLogined = false;
            logoutDefer.resolve();
            this.logoutEvents.fire();
            return this;
        },
        /**
         * 写入用户信息到pptv.com根域下
         */
        _writeInfo: function(data) {
            for (var i in data) {
                cookie.set(i, data[i], 7, domain, path);
            }
        },
        /**
         * 登陆事件回调
         */
        loginEvents: jq.Callbacks(),
        /**
         *退出事件回调
         */
        logoutEvents: jq.Callbacks(),
        /**
         * 登陆消息处理，并添加到登陆事件
         */
        onLogin: function(fn) {
            loginPromise.then(fn);
            this.loginEvents.add(fn);
            return this;
        },
        /**
         * 退出消息处理，并添加到退出事件
         */
        onLogout: function(fn) {
            logoutPromise.then(fn);
            this.logoutEvents.add(fn);
            return this;
        },
        //海沟计划之真实用户识别,针对有插用户发送diskid和name，设置白名单用户cookie标识
        white: function(flag) {
            var ppi = cookie.get("ppi");
            var self = this;
            var url = "http://tools.aplusapi.pptv.com/get_ppi";
            if (flag || !ppi) {
                var diskId;
                var defer = jq.Deferred();
                getDiskId();
                defer.then(function() {
                    var userName = null;
                    if (diskId !== undefined) {
                        url += "?b=" + encode(diskId);
                        userName = self.info["UserName"] ? self.info["UserName"] : null;
                        if (userName) {
                            url += "&a=" + encode(userName);
                        }
                    } else {
                        userName = self.info["UserName"] ? self.info["UserName"] : null;
                        if (userName) {
                            url += "?a=" + encode(userName);
                        }
                    }
                    window.wn = window.wn || function() {};
                    jq.ajax({
                        type: "GET",
                        url: url,
                        jsonp: "cb",
                        cache: true,
                        dataType: "jsonp",
                        contentType: "text/json; charset=utf-8",
                        jsonpCallback: "wn",
                        async: true,
                        success: function(data) {
                            if (data.ppi) {
                                cookie.set("ppi", data.ppi, 1, "pptv.com", "/");
                            }
                        },
                        complete: function(xhr, textStatus) {}
                    });
                });
            }
            //获取插件
            function getDiskId() {
                var obj;
                try {
                    if (navigator.userAgent.indexOf("IE") > -1) {
                        obj = new ActiveXObject("PPLive.Lite");
                        diskId = obj.getDiskID();
                    } else {
                        if (window.navigator.mimeTypes["application/x-pptv-plugin"]) {
                            var id = "PPTVPlayer_plugin_detect_" + +new Date();
                            var div = document.createElement("div");
                            div.style.cssText = "width:1px;height:1px;line-height:0px;font-size:0px;overflow:hidden;";
                            div.innerHTML = '<object width="1px" height="1px" id="' + id + '" type="application/x-pptv-plugin"><param value="false" name="enableupdate"><param value="false" name="enabledownload"><param name="type" value="2"/></object>';
                            document.body.appendChild(div);
                            obj = document.getElementById(id);
                            diskId = obj.getDiskID();
                        }
                    }
                    defer.resolve();
                } catch (e) {
                    jq.ajax({
                        type: "GET",
                        dataType: "jsonp",
                        jsonp: "cb",
                        jsonpCallback: "synacast_json",
                        cache: true,
                        url: "http://127.0.0.1:9000/synacast.json",
                        timeout: 1e3,
                        success: function(data) {
                            diskId = data.k;
                            defer.resolve();
                        },
                        error: function() {
                            defer.resolve();
                        }
                    });
                }
            }
        }
    };
    //脚本载入自动读取用户cookie,并触发消息通知
    User.readInfo(true);
    if (!isClient) {
        User.white();
        var FlashApi = window.player || window.PLAYER;
        //登录时白名单检查
        User.loginEvents.add(function() {
            User.white(true);
            if (!FlashApi) FlashApi = window.player || window.PLAYER;
            if (FlashApi && FlashApi.onNotification) {
                var UserInfo = {
                    ppToken: encode(cookie.get("ppToken")),
                    PPKey: encode(cookie.get("PPKey")),
                    PPName: encode(cookie.get("PPName")),
                    UDI: encode(cookie.get("UDI"))
                };
                FlashApi.onNotification({
                    header: {
                        type: "userinfo"
                    },
                    body: {
                        data: UserInfo
                    }
                });
            }
        });
        User.logoutEvents.add(function() {
            cookie.remove("ppi", "pptv.com", "/");
            if (!FlashApi) FlashApi = window.player || window.PLAYER;
            if (FlashApi && FlashApi.onNotification) {
                FlashApi.onNotification({
                    header: {
                        type: "userinfo"
                    },
                    body: {
                        data: {}
                    }
                });
            }
        });
    }
    return User;
});

/**
 *cookie操作封装
 *mirongxu
 */
define("util/cookie/cookie", [], function(require) {
    var doc = document, MILLISECONDS_OF_DAY = 24 * 60 * 60 * 1e3, encode = encodeURIComponent, decode = decodeURIComponent;
    function isValidParamValue(val) {
        var t = typeof val;
        // If the type of val is null, undefined, number, string, boolean, return true.
        return val == null || t !== "object" && t !== "function";
    }
    function isNotEmptyString(val) {
        return isValidParamValue(val) && val !== "";
    }
    return {
        /**
         * Returns the cookie value for given name
         * @return {String} name The name of the cookie to retrieve
         */
        get: function(name) {
            var ret, m;
            if (isNotEmptyString(name)) {
                if (m = String(doc.cookie).match(new RegExp("(?:^| )" + name + "(?:(?:=([^;]*))|;|$)"))) {
                    ret = m[1] ? decode(m[1]) : "";
                }
            }
            return ret;
        },
        /**
         * Set a cookie with a given name and value
         * @param {String} name The name of the cookie to set
         * @param {String} val The value to set for cookie
         * @param {Number|Date} expires
         * if Number secified how many days this cookie will expire
         * @param {String} domain set cookie's domain
         * @param {String} path set cookie's path
         * @param {Boolean} secure whether this cookie can only be sent to server on https
         */
        set: function(name, val, expires, domain, path, secure) {
            var text = String(encode(val)), date = expires;
            // 从当前时间开始，多少天后过期
            if (typeof date === "number") {
                date = new Date();
                date.setTime(date.getTime() + expires * MILLISECONDS_OF_DAY);
            }
            // expiration date
            if (date instanceof Date) {
                if (expires === 0) {
                    text += ";";
                } else {
                    text += "; expires=" + date.toUTCString();
                }
            }
            // domain
            if (isNotEmptyString(domain)) {
                text += "; domain=" + domain;
            }
            // path
            if (isNotEmptyString(path)) {
                text += "; path=" + path;
            }
            // secure
            if (secure) {
                text += "; secure";
            }
            doc.cookie = name + "=" + text;
        },
        /**
         * Remove a cookie from the machine by setting its expiration date to sometime in the past
         * @param {String} name The name of the cookie to remove.
         * @param {String} domain The cookie's domain
         * @param {String} path The cookie's path
         * @param {String} secure The cookie's secure option
         */
        remove: function(name, domain, path, secure) {
            this.set(name, "", -1, domain, path, secure);
        }
    };
});

define("util/others/getquery", [], function(require, exports) {
    //返回的是对象形式的参数
    function getUrlArgObject() {
        var args = new Object();
        var query = location.search.substring(1);
        //获取查询串
        var pairs = query.split("&");
        for (var i = 0; i < pairs.length; i++) {
            var pos = pairs[i].indexOf("=");
            //查找name=value
            if (pos == -1) {
                //如果没有找到就跳过
                continue;
            }
            var argname = pairs[i].substring(0, pos);
            //提取name
            var value = pairs[i].substring(pos + 1);
            //提取value
            args[argname] = unescape(value);
        }
        return args;
    }
    return getUrlArgObject;
});

define("app/pc/tagpage/tagpk", [ "core/jquery/1.8.3/jquery", "util/loader/loader", "util/log/log", "util/platform/plt", "util/browser/browser", "util/net/urlquery", "util/linkcfg/interfaceurl", "util/date/format", "util/Timer/timer", "util/vote/uniformDate", "util/vote/vote", "util/cookie/cookie", "util/user/user", "client", "util/vote/voteupdate", "util/vote/formatVote", "app/pc/index/flipclock", "util/others/getquery" ], function(require, exports) {
    var $ = require("core/jquery/1.8.3/jquery");
    var loader = require("util/loader/loader");
    var urls = require("util/linkcfg/interfaceurl");
    var formatDate = require("util/date/format");
    var timer = require("util/Timer/timer");
    var vote = require("util/vote/vote");
    var voteupdate = require("util/vote/voteupdate");
    var uniformDate = require("util/vote/uniformDate");
    var formatVote = require("util/vote/formatVote");
    var voteMap = require("util/vote/voteupdate");
    var flipclock = require("app/pc/index/flipclock");
    var cookie = require("util/cookie/cookie");
    var $pkContainer = $(".module-vote-layout");
    var isClient = function() {
        //是否是客户端
        try {
            if (external && external.GetObject) {
                return true;
            }
        } catch (e) {}
        return false;
    }();
    var getServerSuccess = false;
    var timerInterval = null;
    var cdnDate;
    cdnDate = $pkContainer.attr("data-date");
    if (!!cdnDate) {
        var tempCdnDate = uniformDate(cdnDate);
    } else {
        var tempCdnDate = null;
    }
    //获取服务器时间,模块global
    var serverOffsetTime = 0;
    //用于服务器时间获取失败记录的页面本地打开时间
    var pageStartTime = new Date().getTime();
    //获取url参数对象
    var getUrlArgObject = require("util/others/getquery");
    var urlObj = getUrlArgObject();
    //所有的pk item
    var pkItems = $pkContainer.find("li");
    $.ajax({
        url: "http://time.pptv.com?time=" + new Date().getTime(),
        type: "GET",
        dataType: "jsonp",
        cache: true,
        jsonp: "cb",
        success: function(data) {
            serverOffsetTime = data * 1e3 - new Date().getTime();
            getServerSuccess = true;
            init();
            initTopTimer();
        },
        timeout: 1e3,
        error: function() {
            init();
            initTopTimer();
        }
    });
    //投票配置
    var counterDefault = 10;
    function getCounter(voteid, first) {
        //first 页面打开加载
        var getCookieVal = cookie.get("_c_" + voteid);
        if (!getCookieVal) {
            if (first != true) {
                cookie.set("_c_" + voteid, Math.floor(new Date().getTime() / 1e3), 1 / 24 / (3600 / counterDefault), ".pptv.com", "/");
            }
            return counterDefault;
        } else {
            var eclipseTime = Math.floor(new Date().getTime() / 1e3) - Number(getCookieVal);
            if (counterDefault - eclipseTime < 0) {
                cookie.set("_c_" + voteid, Math.floor(new Date().getTime() / 1e3), 1 / 24 / (3600 / counterDefault), ".pptv.com", "/");
                //cookie.set("_c_" + relid, Math.floor(new Date().getTime() / 1e3), 1 / 24/(3600/counterDefault), ".pptv.com", "/");
                return counterDefault;
            }
            return counterDefault - eclipseTime;
        }
    }
    //获取现在的时间
    function getNow(cdnDate) {
        if (getServerSuccess == true) {
            return new Date(new Date().getTime() + serverOffsetTime);
        } else {
            if (!cdnDate) {
                return new Date();
            }
            var offsetTime = new Date().getTime() - pageStartTime;
            var tempPhpDate = new Date(cdnDate.getTime() + offsetTime);
            var clientOffsetTime = new Date().getTime() - tempPhpDate.getTime();
            //cdn 缓存<1小时，相信用户的时间
            if (clientOffsetTime > 0 && clientOffsetTime < 1e3 * 60 * 60 || clientOffsetTime < 0 && clientOffsetTime > -1e3 * 60 * 30) {
                return new Date();
            } else {
                return tempPhpDate;
            }
        }
    }
    //头部倒计时
    function initTopTimer() {
        //首页倒计时
        var timeDom = $(".js-timer-data");
        if ($.trim(timeDom.html()) != "") {
            var servertime = getNow(tempCdnDate);
            //建立time对象如果不是合法的timer对象，跳出
            var timerDate = timeDom.text().replace(/-/g, "/");
            if (!!timerDate) {
                timerDate = new Date(timerDate);
            } else {
                return false;
            }
            if (servertime.getTime() < timerDate.getTime()) {
                var obj = {
                    sec: document.getElementById("sec"),
                    mini: document.getElementById("mini"),
                    hour: document.getElementById("hour"),
                    servertime: servertime,
                    finishCallback: function() {
                        $(".module-index-top .time").addClass("hidden");
                    }
                };
                flipclock.create(timerDate, obj);
                $(".module-index-top .time").removeClass("hidden");
            }
        }
    }
    //获取下一天的中午的date
    function getEndVoteTime(endDate, targetTime) {
        var dayMap = {
            "1": "31",
            "2": "28",
            "3": "31",
            "4": "30",
            "5": "31",
            "6": "30",
            "7": "31",
            "8": "31",
            "9": "30",
            "10": "31",
            "11": "30",
            "12": "31"
        };
        var targetDay = null;
        var targetTime = targetTime ? targetTime : "12:00:00";
        var mon = endDate.getMonth() + 1;
        var day = endDate.getDate();
        var year = endDate.getFullYear();
        var nextOffset = 1;
        var finalStr = null;
        if (day <= 29) {
            if (day == 28 && mon == 2 && !(year % 4 == 0 && year % 100 != 0 || year % 400 == 0) || day == 29 && mon == 2) {
                finalStr = year + "/" + 3 + "/" + 1 + " " + targetTime;
            } else {
                finalStr = year + "/" + mon + "/" + (1 + day) + " " + targetTime;
            }
        } else {
            var getMonDay = dayMap[mon];
            if (day + 1 > getMonDay) {
                if (mon == 12) {
                    finalStr = 1 + year + "/" + 1 + "/" + 1 + " " + targetTime;
                } else {
                    finalStr = year + "/" + (1 + mon) + "/" + 1 + " " + targetTime;
                }
            } else {
                finalStr = year + "/" + mon + "/" + (1 + day) + " " + targetTime;
            }
        }
        targetDay = new Date(finalStr);
        return targetDay;
    }
    function dispatchItem(obj, scopeid, needTimer, index) {
        var startTime = obj.startTime = uniformDate(obj.start);
        var endTime = obj.endTime = uniformDate(obj.end);
        var voteEndTime = obj.voteEndTime = obj.player_1.vote_end ? new Date(obj.player_1.vote_end * 1e3 + parseInt(Math.random() * 3e3)) : getEndVoteTime(endTime);
        //console.log('voteEndTime',voteEndTime);
        var nowTime = getNow(tempCdnDate);
        //直播中
        if (startTime.getTime() <= nowTime.getTime() && nowTime.getTime() < endTime.getTime()) {
            updatePKLive(obj, scopeid, needTimer, index);
        } else if (startTime.getTime() > nowTime.getTime()) {
            //未开始
            if (!!needTimer) {
                updateBefore(obj, scopeid, needTimer, index);
            }
        } else if (endTime.getTime() <= nowTime.getTime() && nowTime.getTime() < voteEndTime.getTime()) {
            //pk结束
            updatePKEnd(obj, scopeid, needTimer, index);
        } else {
            //投票结束
            updatePKVoteEnd(obj, scopeid, needTimer, index);
        }
    }
    function updateBefore(obj, scopeid, needTimer, index) {
        var targetDom = pkItems.eq(index);
        var player1 = obj.player_1;
        var player2 = obj.player_2;
        var player1Dom = targetDom.find(".vote-fl");
        var player2Dom = targetDom.find(".vote-fr");
        var avatar1Dom = player1Dom.children(".vote-user");
        var avatar2Dom = player2Dom.children(".vote-user");
        targetDom.find(".vote-wrap").removeAttr("href");
        if (!!needTimer) {
            timer({
                startTime: getNow(tempCdnDate),
                endTime: obj.startTime,
                serverOffsetTime: serverOffsetTime,
                pageStartTime: pageStartTime,
                cdnDate: tempCdnDate,
                getServerSuccess: getServerSuccess,
                callback: function(status, times) {
                    if (status == 2) {
                        if (!!isClient) {
                            avatar1Dom.attr("href", obj.pc_link);
                            avatar2Dom.attr("href", obj.pc_link);
                        } else {
                            avatar1Dom.attr("href", obj.web_link);
                            avatar2Dom.attr("href", obj.web_link);
                        }
                        targetDom.find("h5").html("正在直播");
                        targetDom.addClass("vote-start");
                        var voteDom_1 = player1Dom.find(".vote-wrap");
                        voteDom_1.attr("data-id", player1.vote_id);
                        voteDom_1.addClass("js-vote");
                        voteDom_1.attr("href", "javascript:void(0);");
                        var voteDom_2 = player2Dom.find(".vote-wrap");
                        voteDom_2.attr("data-id", player2.vote_id);
                        voteDom_2.addClass("js-vote");
                        voteDom_2.attr("href", "javascript:void(0);");
                        voteMap.add(player1.vote_id, voteDom_1);
                        voteMap.add(player2.vote_id, voteDom_2);
                        voteDom_1.find(".vote-txt").html(formatVote(player1.counter) + "票");
                        voteDom_2.find(".vote-txt").html(formatVote(player2.counter) + "票");
                        timer({
                            startTime: getNow(tempCdnDate),
                            endTime: obj.endTime,
                            serverOffsetTime: serverOffsetTime,
                            pageStartTime: pageStartTime,
                            cdnDate: tempCdnDate,
                            getServerSuccess: getServerSuccess,
                            callback: function(status, times) {
                                if (status == 2) {
                                    var player1_url = "http://chang.pptv.com/pc/player?username=" + player1.username;
                                    var player2_url = "http://chang.pptv.com/pc/player?username=" + player2.username;
                                    avatar1Dom.attr("href", player1_url);
                                    avatar2Dom.attr("href", player2_url);
                                    targetDom.addClass("vote-gray");
                                    targetDom.find("h5").html("PK结束");
                                }
                            }
                        });
                    } else {}
                }
            });
        }
    }
    function updatePKLive(obj, scopeid, needTimer, index) {
        var targetDom = pkItems.eq(index);
        targetDom.addClass("vote-start");
        var player1 = obj.player_1;
        var player2 = obj.player_2;
        var player1Dom = targetDom.find(".vote-fl");
        var player2Dom = targetDom.find(".vote-fr");
        var voteDom_1 = player1Dom.find(".vote-wrap");
        voteDom_1.attr("data-id", player1.vote_id);
        voteDom_1.addClass("js-vote");
        voteDom_1.find(".vote-txt").html(formatVote(player1.counter) + "票");
        var voteDom_2 = player2Dom.find(".vote-wrap");
        voteDom_2.attr("data-id", player2.vote_id);
        voteDom_2.addClass("js-vote");
        voteDom_2.find(".vote-txt").html(formatVote(player2.counter) + "票");
        targetDom.find("h5").html("正在直播");
        var avatar1Dom = player1Dom.children(".vote-user");
        var avatar2Dom = player2Dom.children(".vote-user");
        if (!!isClient) {
            avatar1Dom.attr("href", obj.pc_link);
            avatar2Dom.attr("href", obj.pc_link);
        } else {
            avatar1Dom.attr("href", obj.web_link);
            avatar2Dom.attr("href", obj.web_link);
        }
        if (!!needTimer) {
            timer({
                startTime: getNow(tempCdnDate),
                endTime: obj.endTime,
                serverOffsetTime: serverOffsetTime,
                pageStartTime: pageStartTime,
                cdnDate: tempCdnDate,
                getServerSuccess: getServerSuccess,
                callback: function(status, times) {
                    if (status == 2) {
                        var player1_url = "http://chang.pptv.com/pc/player?username=" + player1.username;
                        var player2_url = "http://chang.pptv.com/pc/player?username=" + player2.username;
                        avatar1Dom.attr("href", player1_url);
                        avatar2Dom.attr("href", player2_url);
                        targetDom.addClass("vote-gray");
                        targetDom.find("h5").html("PK结束");
                        targetDom.addClass("vote-start");
                    }
                }
            });
        }
    }
    function updatePKEnd(obj, scopeid, needTimer, index) {
        var targetDom = pkItems.eq(index);
        var player1 = obj.player_1;
        var player2 = obj.player_2;
        var player1Dom = targetDom.find(".vote-fl");
        var player2Dom = targetDom.find(".vote-fr");
        var voteDom_1 = player1Dom.find(".vote-wrap");
        voteDom_1.attr("data-id", player1.vote_id);
        voteDom_1.addClass("js-vote");
        var voteDom_2 = player2Dom.find(".vote-wrap");
        voteDom_2.attr("data-id", player2.vote_id);
        voteDom_2.addClass("js-vote");
        targetDom.find("h5").html("PK 结束");
        targetDom.addClass("vote-gray vote-start");
        timer({
            startTime: getNow(tempCdnDate),
            endTime: obj.voteEndTime,
            serverOffsetTime: serverOffsetTime,
            pageStartTime: pageStartTime,
            cdnDate: tempCdnDate,
            getServerSuccess: getServerSuccess,
            callback: function(status, times) {
                if (status == 2) {
                    targetDom.find(".vote-tips").addClass("show").html("投票结束");
                    targetDom.find("em.replace").css("display", "none");
                    targetDom.find("em.num").css("display", "none");
                    voteDom_1.removeClass("js-vote");
                    voteDom_1.off("click");
                    voteDom_2.removeClass("js-vote");
                    voteDom_2.off("click");
                    targetDom.removeClass("vote-start");
                    loader.load("http://chang.pptv.com/api/pk_result", {
                        username: obj.player_1.username
                    }, function(data) {
                        //需要确认数据结构
                        if (data.err == 0) {
                            var data = data.data;
                            if (data.status == -1) {
                                //依旧是异常数据
                                return false;
                            }
                            if (data.iswin === "1" || data.iswin === "0") {
                                var player1 = data.playerinfo;
                                var player2 = data.pkinfo;
                                if (data.iswin === "1") {
                                    targetDom.find(".vote-fl").children("p").before('<span class="vote-win"></span>');
                                } else if (data.iswin === "0") {
                                    targetDom.find(".vote-fr").children("p").before('<span class="vote-win"></span>');
                                }
                            } else {
                                //异常处理，不再次请求，避免重复请求
                                return false;
                            }
                        }
                    });
                }
            }
        });
    }
    function updatePKVoteEnd(obj, scopeid, needTimer, index) {
        var targetDom = pkItems.eq(index);
        targetDom.find("em.replace").css("display", "none");
        targetDom.find("em.num").css("display", "none");
        targetDom.addClass("vote-gray");
        targetDom.removeClass("vote-start");
        targetDom.find(".vote-tips").addClass("show").html("投票结束");
        targetDom.find(".vote-wrap").removeAttr("href");
        var player1 = obj.player_1;
        var player2 = obj.player_2;
        var player1Dom = targetDom.find(".vote-fl");
        var player2Dom = targetDom.find(".vote-fr");
        var voteDom_1 = player1Dom.find(".vote-wrap");
        var voteDom_2 = player2Dom.find(".vote-wrap");
        voteDom_1.removeClass("js-vote");
        voteDom_2.removeClass("js-vote");
        voteDom_1.find(".vote-txt").html(formatVote(player1.counter) + "票");
        voteDom_2.find(".vote-txt").html(formatVote(player2.counter) + "票");
    }
    //常规倒计时
    function counter(dom, count) {
        setTimeout(function() {
            dom.text(--count);
            if (count != 0) {
                counter(dom, count);
            } else {
                dom.hide();
                dom.html("");
            }
        }, 1e3);
    }
    //票数更新
    function updateUI(voteIdMap, arr) {
        for (var i = 0; i < arr.length; i++) {
            var tempObj = voteIdMap[arr[i]];
            var doms = tempObj["doms"];
            var len = doms.length;
            if (!tempObj.data) {
                continue;
            }
            for (var j = 0; j < len; j++) {
                doms[j].find(".vote-txt").html(formatVote(tempObj.data.counter) + "票");
            }
        }
    }
    // 投票动画模块
    function voteAnimate(domParent, originCounter, targetTop) {
        // var relDom=domParent.siblings(selector);
        //var maskRel=relDom.find('.vote-mask');
        var maskDom = domParent.find(".vote-mask");
        var addDom = domParent.find(".vote-add");
        var originTop = addDom.css("top");
        var targetTop = targetTop || -50;
        maskDom.show();
        maskDom.text(originCounter);
        counter(maskDom, originCounter);
        //maskRel.show();
        //maskRel.text(10);
        //counter(maskRel,10);
        if (originCounter == counterDefault) {
            addDom.css("display", "block").animate({
                top: targetTop,
                opacity: 1
            }, 1e3, function() {
                addDom.fadeOut();
                setTimeout(function() {
                    addDom.fadeOut(function() {
                        addDom.css({
                            top: originTop
                        });
                    });
                }, 1e3);
            });
        }
    }
    // 绑定投票事件
    function bindVote() {
        new vote({
            dom: ".js-vote",
            voteAttr: "data-id",
            container: ".module-vote-layout",
            beforeVote: function(data, dom) {
                if (dom.find(".vote-mask").css("display") == "block") {
                    return false;
                } else {
                    return true;
                }
            },
            afterVote: function(data, dom) {
                if (typeof data.counter != "undefined") {
                    dom.find(".vote-txt").text(formatVote(data.counter) + "票");
                    var voteid = dom.attr("data-id");
                    var endCounter = getCounter(voteid);
                    voteAnimate(dom.parents(".vote-h80"), endCounter, -50);
                } else if (data.errors) {
                    if (data.errors.code == 88) {
                        alert("请休息一会儿再投票哦！");
                    } else if (data.errors.code == 91) {
                        alert("投票未开始");
                    } else if (data.errors.code == 92) {
                        alert("投票已结束");
                    }
                }
            }
        });
        voteMap.init({
            selector: ".js-vote",
            voteAttr: "data-id"
        });
        voteMap.getVotes({
            callback: updateUI
        });
        timerInterval = setInterval(function() {
            voteMap.getVotes({
                callback: updateUI
            });
        }, freshTime * 1e3);
    }
    function initMask() {
        $(".js-vote").each(function() {
            var obj = $(this);
            var voteid = obj.attr("data-id");
            if (typeof voteid != "undefined") {
                var endCounter = getCounter(voteid, true);
                if (endCounter != counterDefault) {
                    voteAnimate(obj.parent(), endCounter);
                }
            }
        });
    }
    //投票更新
    var freshTime = 45;
    function init() {
        loader.load(urls["interface"]["pklistAll"], {
            __config__: {
                cdn: true,
                callback: "updatePKList"
            }
        }, function(data) {
            //var data=require('../../phone/index/testpk');
            if (data.err == 0) {
                var pkdata = data.data;
                if (!pkdata) {
                    return false;
                }
                var scopeData = pkdata[urlObj["scope"]];
                if (!scopeData) {
                    return false;
                }
                //var count=0;
                //var tempObj=scopeData['0'];
                var needTimer = true;
                for (var key in scopeData) {
                    dispatchItem(scopeData[key], urlObj["scope"], needTimer, key);
                }
                bindVote();
                //开启cookie模式
                initMask();
            }
        });
    }
});

define("util/date/format", [], function(require, exports) {
    var prefixInteger = function(num, length) {
        return (num / Math.pow(10, length)).toFixed(length).substr(2);
    };
    var formatDate = function(date, format) {
        var self = this;
        if (arguments.length < 2 && !date.getTime) {
            format = date;
            date = new Date();
        }
        typeof format != "string" && (format = "YYYY年MM月DD日 hh时mm分ss秒");
        var week = [ "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "日", "一", "二", "三", "四", "五", "六" ];
        return format.replace(/YYYY|YY|MM|DD|hh|mm|ss|星期|周|www|week/g, function(a) {
            switch (a) {
              case "YYYY":
                return date.getFullYear();

              case "YY":
                return (date.getFullYear() + "").slice(2);

              case "MM":
                return prefixInteger(date.getMonth() + 1, 2);

              case "DD":
                return prefixInteger(date.getDate(), 2);

              case "hh":
                return prefixInteger(date.getHours(), 2);

              case "mm":
                return prefixInteger(date.getMinutes(), 2);

              case "ss":
                return prefixInteger(date.getSeconds(), 2);

              case "星期":
                return "星期" + week[date.getDay() + 7];

              case "周":
                return "周" + week[date.getDay() + 7];

              case "week":
                return week[date.getDay()];

              case "www":
                return week[date.getDay()].slice(0, 3);
            }
        });
    };
    return formatDate;
});

/**
 * 通用模块
 **/
define("util/Timer/timer", [ "util/vote/uniformDate" ], function(require, exports, module) {
    // timer = require('./../../../util/Timer/timer');
    var uniformDate = require("util/vote/uniformDate");
    // timer({
    //     startTime : new Date('2015-08-19 18:11:00'),
    //     endTime   : new Date('2015-08-19 18:12:00'),
    //     callback  : function(status,times){
    //         console.info("------"+status);
    //         console.info(times);
    //     }
    //  });
    /**
     * [倒计时 计时器]
     * @param  {[type]}            
     * @return {[type]}     [description]
     *
     * opt :   {
     *         startTime : 开始时间 
     *         endTime   : 结束时间
     *         callback  : function( status , times )   回调函数
     *     }
     *
     * callback (
     *     status : 当前状态  0 ： 倒计时未开始 ，  1 ： 倒计时进行中  ， 2 ：倒计时结束（status=2 只会回调一次）
     *     times : {hours:"",minitues:"",seconds:"" } 倒计时三位数值  
     * )
     */
    var timer = function() {
        var timer = function(opt) {
            this.serverOffsetTime = 0;
            if (opt.serverOffsetTime) {
                this.serverOffsetTime = opt.serverOffsetTime;
            }
            if (opt.endTime == undefined) return;
            if (opt.startTime == undefined) {
                this.startTime = opt.startTime = this.getNow();
            } else {
                this.startTime = opt.startTime;
            }
            if (opt.callback && (typeof opt.callback).toLowerCase() != "function") delete opt.callback;
            this.stop = false;
            this.opt = opt;
            this.lastSecond = -1;
            this.count = 0;
            this.init();
        };
        var prop = timer.prototype;
        prop.init = function() {
            var now = this.getNow();
            var start = this.opt.startTime.getTime();
            if (!(now < start)) {
                //                console.log('进入run的逻辑');
                this.run();
            } else {
                //              console.log('进入0的逻辑');
                this.cb(0);
            }
        };
        prop.getNow = function() {
            if (typeof this.opt.getServerSuccess == "undefined") {
                return new Date(new Date().getTime() + this.serverOffsetTime);
            } else {
                if (this.opt.getServerSuccess === true) {
                    return new Date(new Date().getTime() + this.serverOffsetTime);
                }
                if (!this.opt.cdnDate) {
                    return new Date();
                }
                var offsetTime = new Date().getTime() - this.opt.pageStartTime;
                var tempPhpDate = new Date(this.opt.cdnDate.getTime() + offsetTime);
                var clientOffsetTime = new Date().getTime() - tempPhpDate.getTime();
                //cdn 缓存<1小时，相信用户的时间
                if (clientOffsetTime > 0 && clientOffsetTime < 1e3 * 60 * 60) {
                    return new Date();
                } else {
                    return tempPhpDate;
                }
            }
        };
        prop.run = function() {
            var time = Math.floor((this.opt.endTime.getTime() - this.getNow().getTime()) / 1e3);
            var times = {};
            if (time > 0) {
                var hour = Math.floor(time / 3600);
                var min = Math.floor(time / 60) % 60;
                var seconds = Math.floor(time % 60);
                hour = hour < 10 ? "0" + hour : "" + hour;
                min = min < 10 ? "0" + min : "" + min;
                seconds = seconds < 10 ? "0" + seconds : "" + seconds;
                times = {
                    hours: hour,
                    minitues: min,
                    seconds: seconds
                };
                this.cb(1, times);
            } else {
                this.cb(2, {
                    hours: "00",
                    minitues: "00",
                    seconds: "00"
                });
            }
        };
        prop.cb = function(status, times) {
            //            console.log('status first',status);
            if (this.stop) return;
            if (this.timeStaps) clearTimeout(this.timeStaps);
            var tempDate = this.getNow();
            if (this.opt.callback && this.lastSecond != tempDate.getSeconds()) {
                this.lastSecond = tempDate.getSeconds();
                this.opt.callback.call(this, status, times);
            }
            //var next = ( 1000 - tempDate.getTime() % 1000 ) + 10;
            //        console.log('thiscount',this.count);
            var offset = tempDate.getTime() - (this.startTime.getTime() + this.count * 1e3);
            var next = 1e3 - offset;
            var self = this;
            //      console.log(next);
            //    console.log('status',status);
            if (status == 1) {
                this.timeStaps = setTimeout(function() {
                    self.count++;
                    self.run();
                }, next);
            } else if (status == 0) {
                //                console.log('status为0');
                this.timeStaps = setTimeout(function() {
                    self.count++;
                    self.init();
                }, next);
            }
        };
        prop.getStatus = function() {
            if (this.serverOffsetTime != 0) {
                var now = new Date(new Date().getTime() + this.serverOffsetTime);
            } else {
                var now = new Date();
            }
            var start = this.opt.startTime.getTime();
            if (!(now < start)) {
                var time = Math.floor((this.opt.endTime.getTime() - (new Date().getTime() + this.serverOffsetTime)) / 1e3);
                var times = {};
                if (time > 0) {
                    var hour = Math.floor(time / 3600);
                    var min = Math.floor(time / 60) % 60;
                    var seconds = Math.floor(time % 60);
                    hour = hour < 10 ? "0" + hour : "" + hour;
                    min = min < 10 ? "0" + min : "" + min;
                    seconds = seconds < 10 ? "0" + seconds : "" + seconds;
                    times = {
                        hours: hour,
                        minitues: min,
                        seconds: seconds
                    };
                    return [ 1, times ];
                } else {
                    return [ 2, {
                        hours: "00",
                        minitues: "00",
                        seconds: "00"
                    } ];
                }
            } else {
                return [ 0, undefined ];
            }
        };
        prop.clear = function() {
            this.stop = true;
        };
        return timer;
    }();
    module.exports = function(opt) {
        return new timer(opt);
    };
});

define("util/vote/uniformDate", [], function(require, exports) {
    function uniformDate(dateString) {
        if (typeof dateString == "undefined") {
            return false;
        }
        if (typeof dateString == "object") {
            return dateString;
        }
        if (~dateString.toString().indexOf("-")) {
            return new Date(dateString.replace(/-/g, "/"));
        } else {
            return new Date(dateString);
        }
    }
    return uniformDate;
});

/* 
* @Author: WhiteWang
* @Date:   2015-08-21 11:21:58
* @Last Modified by:   weifengwang
* @Last Modified time: 2015-11-12 15:05:49
*/
define("util/vote/vote", [ "core/jquery/1.8.3/jquery", "util/cookie/cookie", "util/loader/loader", "util/log/log", "util/platform/plt", "util/browser/browser", "util/net/urlquery", "util/user/user", "client" ], function(require, exports, module) {
    /**
 * [一唱成名投票模块]
 * @param {[type]} options [description]
 *
 * dom
 *     非必需  可以是jquery对象，也可以是dom选择字符串
 *     会对dom绑定click事件，点击以后向对应id投票
 *     dom上需有data-voteid属性，投票id
 *     如果没传，需要调用this.vote方法投票
 * beforeVote
 *     非必需  function
 *     调用投票接口前
 * afterVote
 *     非必需  function
 *     投票接口返回结果之后
 *     afterVote(
 *         data.counter 当前实时票数
 *         data.errors 投票出错
 *         el   当定义ChangVote对象时传了dom参数，el代表当前点击的dom，否则el为null
 *     )
 *
 * this.vote(
 *     voteId   投票id
 * )    这一方法供没传dom参数时使用
 */
    var $ = require("core/jquery/1.8.3/jquery");
    var pageToken;
    var cookie = require("util/cookie/cookie");
    var voteTokeApi = "http://api.vote.pptv.com/vote/csrf";
    var loader = require("util/loader/loader");
    var user = require("util/user/user");
    var tookieTry = 0;
    //console.log(token);
    //var SID=cookie.get('SID');
    //console.log(SID);
    //console.log(document.cookie.indexOf('SID'));
    function isClient() {
        try {
            if (external && external.GetObject("@pplive.com/ui/mainwindow;1")) {
                return true;
            }
        } catch (e) {}
        return false;
    }
    function getUserName() {
        if (isClient()) {
            if (external.GetObject("@pplive.com/passport;1").state == 0) {
                return external.GetObject("@pplive.com/passport;1").userName;
            }
        } else {
            var ppname = cookie.get("PPName");
            if (ppname) {
                var nameList = ppname.split("$");
                return decodeURIComponent(nameList[0]);
            }
        }
        return "";
    }
    var username = getUserName();
    user.loginEvents.add(function() {
        username = getUserName();
    });
    user.logoutEvents.add(function() {
        username = getUserName();
    });
    function getVoteApi(voteId) {
        return "http://api.vote.pptv.com/vote/" + voteId + "/increase";
    }
    function ChangVote(options) {
        var opt = $.extend({
            dom: null,
            beforeVote: function() {
                return true;
            },
            afterVote: function() {}
        }, options || {});
        var that = this;
        if (opt.dom) {
            var $dom = $(opt.dom);
            this.$el = $dom;
            if (!!opt.container) {
                $(opt.container).on("click.vote", opt.dom, function(ev) {
                    ev.preventDefault();
                    var $obj = $(this);
                    var voteId = $obj.attr(opt.voteAttr || "data-voteid");
                    if (typeof voteId == "undefined") {
                        return false;
                    }
                    that.vote(voteId, $obj);
                });
            } else {
                $dom.on("click.vote", function(ev) {
                    ev.preventDefault();
                    var $obj = $(this);
                    var voteId = $obj.attr(opt.voteAttr || "data-voteid");
                    if (typeof voteId == "undefined") {
                        return false;
                    }
                    that.vote(voteId, $obj);
                });
            }
        }
        var getVoteToken = function(callback) {
            var token = cookie.get("ch_tk") || pageToken;
            if (!token) {
                loader.load(voteTokeApi, {}, function(data) {
                    if (data.token) {
                        cookie.set("ch_tk", data.token, 1 / 12, ".pptv.com", "/");
                        pageToken = data.token;
                        callback(data.token);
                    } else {
                        opt.afterVote.call(that, {
                            errors: {
                                message: "token获取失败",
                                code: 401
                            }
                        });
                    }
                }, function(jqXHR, status) {
                    opt.afterVote.call(that, {
                        errors: {
                            message: "token获取失败",
                            code: 401
                        }
                    });
                });
            } else {
                callback(token);
            }
        };
        this.vote = function(voteId, el) {
            var self = this;
            var id = voteId;
            var $el = el;
            getVoteToken(function(token) {
                var ifValidate = opt.beforeVote.call(that, {
                    id: voteId
                }, el);
                if (ifValidate != false) {
                    loader.load(getVoteApi(voteId), {
                        _token: token,
                        username: username
                    }, function(data) {
                        //invalid token
                        if (!!data.errors && data.errors.code == 89) {
                            cookie.remove("ch_tk", ".pptv.com", "/");
                            tookieTry++;
                            if (tookieTry > 2) {
                                return false;
                            }
                            self.vote(id, $el);
                            return false;
                        } else if (!!data.errors && data.errors.code == 88) {
                            $(".vote-error-limit").show();
                        }
                        opt.afterVote.call(that, data, el);
                    }, function(jqXHR, status) {
                        opt.afterVote.call(that, {
                            errors: {
                                message: status,
                                code: 400
                            }
                        }, el);
                    });
                }
            });
        };
        this.unbind = function() {
            this.$el.off("click.vote");
        };
    }
    return ChangVote;
});

define("util/vote/voteupdate", [ "core/jquery/1.8.3/jquery", "util/loader/loader", "util/log/log", "util/platform/plt", "util/browser/browser", "util/net/urlquery" ], function(require, exports) {
    var $ = require("core/jquery/1.8.3/jquery");
    var loader = require("util/loader/loader");
    var voteIdMap = {};
    voteIdMap.prior = {};
    voteIdMap.id = [];
    /*
		数据结构
		{
			idkey1:信息obj,
			idkey2:信息obj,
			...
			id:Array[] 存放所有的id
			prior:Object 存放所有优先级，默认9999 : [] 
		}
		getCollection 之后返回的 example
		{
			17579:{
				data:{
					counter:13497,
					endedAt:1446307199,
					startedAt:1444579200,
				},
				doms:[jqueryobj,jqueryobj],
				prior:9999,
			},
			17561:{
				data:{
					counter:13497,
					endedAt:1446307199,
					startedAt:1444579200,
				},
				doms:[jqueryobj,jqueryobj],
				prior:9999,
			},
			17563:{
				data:{
					counter:13497,
					endedAt:1446307199,
					startedAt:1444579200,
				},
				doms:[jqueryobj,jqueryobj],
				prior:3,
			}
			id:[17579,17561],
			prior:{
				9999:[17159,17561],
				3:[17563]
			}
		}
	 */
    function delSingle(voteId, prior) {
        if (!!voteIdMap[voteId]) {
            if (!prior) {
                prior = 9999;
            }
            var ids = voteIdMap.id;
            var idIndex = _searchDomIdx(ids, voteId);
            if (idIndex != -1) {
                ids.splice(idIndex, 1);
            }
            var priorArr = voteIdMap["prior"][prior];
            if (!prior) {
                var priorIndex = -1;
            } else {
                var priorIndex = _searchDomIdx(priorArr, voteId);
            }
            if (priorIndex != -1) {
                priorArr.splice(priorIndex, 1);
            }
            voteIdMap[voteId].doms = [];
            delete voteIdMap[voteId];
        }
    }
    function reset() {
        voteIdMap = {};
        voteIdMap.prior = {};
        voteIdMap.id = [];
    }
    function init(options) {
        reset();
        //console.log(options.selector);
        $(options.selector).each(function() {
            var obj = $(this);
            //console.log(obj);
            var voteId = obj.attr(options.voteAttr);
            if (!voteId) {
                return false;
            }
            if (typeof options.prior != "undefined") {
                var prior = obj.attr(options.prior);
            } else {
                var prior = undefined;
            }
            _add(voteId, obj, prior);
        });
    }
    function _add(voteId, dom, prior, updateCounter) {
        if (!voteIdMap[voteId]) {
            voteIdMap[voteId] = {};
            voteIdMap[voteId]["doms"] = [];
            voteIdMap[voteId]["doms"].push(dom);
            if (!!updateCounter) {
                voteIdMap[voteId]["data"] = Number(dom.text());
            }
            if (!prior) {
                prior = 9999;
            }
            voteIdMap[voteId]["prior"] = prior;
            if (!voteIdMap["prior"][prior]) {
                voteIdMap["prior"][prior] = [];
                voteIdMap["prior"][prior].push(voteId);
            } else {
                voteIdMap["prior"][prior].push(voteId);
            }
            voteIdMap.id.push(voteId);
        } else {
            if (!!updateCounter) {
                voteIdMap[voteId]["data"] = Number(dom.text());
            }
            voteIdMap[voteId]["doms"].push(dom);
        }
    }
    function add(voteId, dom, prior) {
        if (!dom && typeof voteId == "object" && !$.isArray(voteId)) {
            $(voteId.selector).each(function() {
                var obj = $(this);
                var id = obj.attr(voteId.voteAttr);
                if (!id) {
                    return false;
                }
                if (typeof voteId.prior != "undefined") {
                    var prior = obj.attr(voteId.prior);
                }
                if (voteId.updateCounter == true) {
                    _add(id, obj, prior, true);
                } else {
                    _add(id, obj, prior, false);
                }
            });
        } else if ($.isArray(voteId)) {
            for (var i = 0; i < voteId.length; i++) {
                var obj = voteId[i];
                _add(obj.voteId, obj.dom, obj.prior);
            }
        } else {
            _add(voteId, dom, prior);
        }
    }
    function getvoteIdMap() {
        return voteIdMap;
    }
    var boolIndexof = Array.prototype.indexOf;
    function _searchDomIdx(arr, val) {
        if (!!boolIndexof) {
            return arr.indexOf(val);
        } else {
            for (var i = 0; i < arr.length; i++) {
                if (val == arr[i]) {
                    return i;
                }
            }
            return -1;
        }
    }
    function priority(id, prior) {
        if (!voteIdMap[id]) {
            //			console.log('id不存在');
            return false;
        } else {
            if (typeof prior != "undefined") {
                //set
                var origPrior = voteIdMap[id]["prior"];
                var origPriorArr = voteIdMap["prior"][origPrior];
                var searchid = _searchDomIdx(origPriorArr, id);
                //console.log(searchid);
                if (!~searchid) {
                    return false;
                } else {
                    origPriorArr.splice(searchid, 1);
                    var newPriorArr = voteIdMap["prior"][prior];
                    if (typeof newPriorArr == "undefined") {
                        voteIdMap["prior"][prior] = [];
                        voteIdMap["prior"][prior].push(id);
                    } else {
                        newPriorArr.unshift(id);
                    }
                }
            }
        }
    }
    function delPrior(prior) {
        if (!!prior) {
            var arr = voteIdMap.prior[prior];
            var idArr = voteIdMap.id;
            var idArrTemp;
            if (!!arr && $.isArray(arr)) {
                for (var i = 0; i < arr.length; i++) {
                    idArrTemp = _searchDomIdx(idArr, arr[i]);
                    if (~idArrTemp) {
                        idArr.splice(idArrTemp, 1);
                    }
                    delete voteIdMap[arr[i]];
                }
            }
            delete voteIdMap.prior[prior];
        }
    }
    var defaults = {
        url: "http://api.cdn.vote.pptv.com/vote/collection",
        singleurl: "http://api.cdn.vote.pptv.com/vote/",
        seperator: ","
    };
    function getVotes(options) {
        if (!!$.isEmptyObject(voteIdMap)) {
            return false;
        }
        if (!options.callback) {
            return false;
        }
        var opts = $.extend({}, defaults, options);
        var finalData, finalUrl;
        var prior = opts.prior;
        var seperator = opts.seperator;
        var finalidArr = prior ? voteIdMap["prior"][prior] : opts.id ? opts.id : voteIdMap.id;
        if (finalidArr.length == 1 || typeof finalidArr == "string") {
            if (typeof finalidArr == "string") {
                var temp = finalidArr;
                finalidArr = [];
                finalidArr[0] = temp;
            }
            finalUrl = opts.singleurl + finalidArr[0];
            finalData = {
                ids: finalidArr.join(opts.seperator)
            };
        } else {
            finalData = {
                ids: finalidArr.join(opts.seperator)
            };
            finalUrl = opts.url;
        }
        if (!finalData.ids) {
            return false;
        }
        finalData.__config__ = {
            cdn: true,
            callback: "updateVote"
        };
        loader.load(finalUrl, finalData, function(data) {
            if (data.errors) {
                return false;
            }
            //单个id
            if (data.counter != null && voteIdMap[finalidArr[0]]) {
                voteIdMap[finalidArr[0]]["data"] = data;
            } else {
                //多个id
                var votes = data.votes;
                for (var key in votes) {
                    if (!!voteIdMap[key]) {
                        voteIdMap[key]["data"] = votes[key];
                    }
                }
            }
            options.callback.call(opts.context || null, voteIdMap, finalidArr);
        });
    }
    return {
        init: init,
        reset: reset,
        add: add,
        get: getvoteIdMap,
        priority: priority,
        getVotes: getVotes,
        delPrior: delPrior,
        delSingle: delSingle
    };
});

define("util/vote/formatVote", [], function(require, exports) {
    function zeroPadding(digit, num) {
        if (!num) {
            num = "0";
        }
        return new Array(digit + 1).join(num);
    }
    function formatVote(num, digit) {
        //测试千万数据
        //num=12235400;
        //测试亿数据
        //num=123500000;
        //num=12000;
        //digit=2;
        if (num == null || num == 0) {
            return 0;
        }
        var intNum = parseFloat(num);
        if (isNaN(intNum)) {
            return false;
        }
        if (typeof digit == "undefined") {
            var digit = 1;
        }
        var len = num.toString().length;
        if (len > 4) {
            //百万
            if (len > 6) {
                //亿
                if (len > 8) {
                    var finalNum = num / 1e8;
                    var finalArr = finalNum.toString().split(".");
                    if (finalArr.length == 1) {
                        var digitNum = zeroPadding(digit);
                    } else {
                        var digitStr = finalArr[1].toString();
                        if (digitStr.length < digit) {
                            var paddNum = digit - digitStr.length;
                            var digitNum = digitStr.substring(0, digit) + zeroPadding(paddNum);
                        } else {
                            var digitNum = digitStr.substring(0, digit);
                        }
                    }
                    return finalArr[0] + "." + digitNum + "亿";
                } else if (len > 7) {
                    var finalNum = num / 1e7;
                    var finalArr = finalNum.toString().split(".");
                    if (finalArr.length == 1) {
                        var digitNum = zeroPadding(digit);
                    } else {
                        var digitStr = finalArr[1].toString();
                        if (digitStr.length < digit) {
                            var paddNum = digit - digitStr.length;
                            var digitNum = digitStr.substring(0, digit) + zeroPadding(paddNum);
                        } else {
                            var digitNum = digitStr.substring(0, digit);
                        }
                    }
                    return finalArr[0] + "." + digitNum + "千万";
                } else {
                    var finalNum = num / 1e6;
                    var finalArr = finalNum.toString().split(".");
                    if (finalArr.length == 1) {
                        var digitNum = zeroPadding(digit);
                    } else {
                        var digitStr = finalArr[1].toString();
                        if (digitStr.length < digit) {
                            var paddNum = digit - digitStr.length;
                            var digitNum = digitStr.substring(0, digit) + zeroPadding(paddNum);
                        } else {
                            var digitNum = digitStr.substring(0, digit);
                        }
                    }
                    return finalArr[0] + "." + digitNum + "百万";
                }
            } else {
                //万
                var finalNum = num / 1e4;
                var finalArr = finalNum.toString().split(".");
                if (finalArr.length == 1) {
                    var digitNum = zeroPadding(digit);
                } else {
                    var digitStr = finalArr[1].toString();
                    if (digitStr.length < digit) {
                        var paddNum = digit - digitStr.length;
                        var digitNum = digitStr.substring(0, digit) + zeroPadding(paddNum);
                    } else {
                        var digitNum = digitStr.substring(0, digit);
                    }
                }
                return finalArr[0] + "." + digitNum + "万";
            }
        } else {
            return num;
        }
    }
    return formatVote;
});

define("app/pc/index/flipclock", [], function(require, module, exports) {
    function fnTimeCountDown(d, o) {
        var count = 0;
        var d = d;
        var interval = 1e3;
        var startTime;
        var future = new Date(d);
        var totalTime = 0;
        var f = {
            zero: function(n) {
                var n = parseInt(n, 10);
                if (n > 0) {
                    if (n <= 9) {
                        n = "0" + n;
                    }
                    return String(n);
                } else {
                    return "00";
                }
            },
            dv: function() {
                if (o.servertime) {
                    var now = new Date(o.servertime.getTime() + totalTime);
                } else {
                    var now = new Date();
                }
                if (!startTime) {
                    if (o.servertime) {
                        var startTime = new Date(o.servertime.getTime());
                    } else {
                        var startTime = new Date();
                    }
                    var offset = 0;
                } else {
                    var offset = now.getTime() - (startTime + count * interval);
                }
                count++;
                var nextTime = interval - offset;
                var dur = Math.round((future.getTime() - now.getTime()) / 1e3), pms = {
                    sec: "00",
                    mini: "00",
                    hour: "00",
                    day: "00",
                    month: "00",
                    year: "0"
                };
                if (dur > 0) {
                    pms.sec = f.zero(dur % 60);
                    pms.mini = Math.floor(dur / 60) > 0 ? f.zero(Math.floor(dur / 60) % 60) : "00";
                    pms.hour = Math.floor(dur / 3600) > 0 ? f.zero(Math.floor(dur / 3600) % 24) : "00";
                    pms.day = Math.floor(dur / 86400) > 0 ? f.zero(Math.floor(dur / 86400) % 30) : "00";
                    pms.month = Math.floor(dur / 2629744) > 0 ? f.zero(Math.floor(dur / 2629744) % 12) : "00";
                    pms.year = Math.floor(dur / 31556926) > 0 ? Math.floor(dur / 31556926) : "0";
                } else {
                    pms.end = true;
                }
                pms.nextTime = nextTime;
                totalTime += nextTime;
                return pms;
            },
            ui: function() {
                var backupObj = f.dv();
                if (o.day) {
                    o.day.innerHTML = backupObj.day;
                }
                if (o.month) {
                    o.month.innerHTML = backupObj.month;
                }
                if (o.year) {
                    o.year.innerHTML = backupObj.year;
                }
                if (o.sec) {
                    o.sec.innerHTML = backupObj.sec;
                }
                if (o.mini) {
                    o.mini.innerHTML = backupObj.mini;
                }
                if (o.hour) {
                    if (backupObj.day != "00" && !o.day) {
                        o.hour.innerHTML = parseInt(backupObj.hour, 10) + parseInt(backupObj.day, 10) * 24;
                    } else {
                        o.hour.innerHTML = backupObj.hour;
                    }
                }
                if (backupObj.end == true) {
                    if (!!o.finishCallback && typeof o.finishCallback == "function") {
                        o.finishCallback.call(null);
                    }
                    return false;
                }
                setTimeout(f.ui, backupObj.nextTime);
            }
        };
        f.ui();
    }
    return {
        create: function(d, options) {
            return new fnTimeCountDown(d, options);
        }
    };
});

define("app/pc/tagpage/tagConcert", [ "core/jquery/1.8.3/jquery", "util/loader/loader", "util/log/log", "util/platform/plt", "util/browser/browser", "util/net/urlquery", "util/vote/uniformDate", "util/Timer/timer", "util/vote/voteupdate", "util/linkcfg/interfaceurl", "app/pc/index/flipclock", "core/underscore/1.8.3/underscore" ], function(require, exports) {
    var $ = require("core/jquery/1.8.3/jquery");
    var loader = require("util/loader/loader");
    var uniformDate = require("util/vote/uniformDate");
    var timer = require("util/Timer/timer");
    var voteMap = require("util/vote/voteupdate");
    var urls = require("util/linkcfg/interfaceurl");
    var flipclock = require("app/pc/index/flipclock");
    //获取url参数对象
    var urlObj = require("util/net/urlquery");
    var _ = require("core/underscore/1.8.3/underscore");
    var globalConcertData = null;
    var isClient = function() {
        //是否是客户端
        try {
            if (external && external.GetObject) {
                return true;
            }
        } catch (e) {}
        return false;
    }();
    var concertContainer = $(".module-myconcert-tag");
    var timeDom = concertContainer.find(".time");
    var cdnDate;
    cdnDate = concertContainer.attr("data-date");
    if (!!cdnDate) {
        var tempCdnDate = uniformDate(cdnDate);
    } else {
        var tempCdnDate = null;
    }
    //获取服务器时间,模块global
    var serverOffsetTime = 0;
    var getServerSuccess = false;
    var pageStartTime = new Date().getTime();
    var freshTime = 45;
    var voteRefreshInterval = null;
    //票数更新
    var gloabalIsLive = false;
    $.ajax({
        url: "http://time.pptv.com?time=" + new Date().getTime(),
        type: "GET",
        dataType: "jsonp",
        cache: true,
        jsonp: "cb",
        success: function(data) {
            serverOffsetTime = data * 1e3 - new Date().getTime();
            getServerSuccess = true;
            init();
            initTopTimer();
        },
        timeout: 1e3,
        error: function() {
            init();
            initTopTimer();
        }
    });
    function initTopTimer() {
        //首页倒计时
        var timeDom = $(".js-timer-data").eq(0);
        if ($.trim(timeDom.html()) != "") {
            var servertime = getNow(cdnDate);
            //建立time对象如果不是合法的timer对象，跳出
            var timerDate = $.trim(timeDom.html()).replace(/-/g, "/");
            if (!!timerDate) {
                timerDate = new Date(timerDate);
            } else {
                return false;
            }
            if (servertime.getTime() < timerDate.getTime()) {
                var obj = {
                    sec: document.getElementById("sec"),
                    mini: document.getElementById("mini"),
                    hour: document.getElementById("hour"),
                    servertime: servertime,
                    finishCallback: function() {
                        $(".module-index-top .time").addClass("hidden");
                    }
                };
                flipclock.create(timerDate, obj);
                $(".module-index-top .time").removeClass("hidden");
            }
        }
    }
    //获取现在的时间
    function getNow(cdnDate) {
        if (getServerSuccess == true) {
            return new Date(new Date().getTime() + serverOffsetTime);
        } else {
            if (!cdnDate) {
                return new Date();
            }
            var offsetTime = new Date().getTime() - pageStartTime;
            var tempPhpDate = new Date(cdnDate.getTime() + offsetTime);
            var clientOffsetTime = new Date().getTime() - tempPhpDate.getTime();
            //cdn 缓存<1小时，相信用户的时间
            if (clientOffsetTime > 0 && clientOffsetTime < 1e3 * 60 * 60 || clientOffsetTime < 0 && clientOffsetTime > -1e3 * 60 * 30) {
                return new Date();
            } else {
                return tempPhpDate;
            }
        }
    }
    // 绑定投票事件
    function bindVote() {
        voteMap.init({
            selector: ".js-vote",
            voteAttr: "data-id"
        });
    }
    function addKannma(number) {
        //测试千万数据
        //num=12235400;
        //测试亿数据
        //num=123500000;
        //num=12000;
        //digit=2;
        if (number == null || number == 0) {
            return 0;
        }
        if (number.length < 4) {
            return number;
        }
        var num = number + "";
        num = num.replace(new RegExp(",", "g"), "");
        // 正负号处理   
        var symble = "";
        if (/^([-+]).*$/.test(num)) {
            symble = num.replace(/^([-+]).*$/, "$1");
            num = num.replace(/^([-+])(.*)$/, "$2");
        }
        if (/^[0-9]+(\.[0-9]+)?$/.test(num)) {
            var num = num.replace(new RegExp("^[0]+", "g"), "");
            if (/^\./.test(num)) {
                num = "0" + num;
            }
            var decimal = num.replace(/^[0-9]+(\.[0-9]+)?$/, "$1");
            var integer = num.replace(/^([0-9]+)(\.[0-9]+)?$/, "$1");
            var re = /(\d+)(\d{3})/;
            while (re.test(integer)) {
                integer = integer.replace(re, "$1,$2");
            }
            return symble + integer + decimal;
        } else {
            return number;
        }
    }
    function exceptionCounter(counter) {
        if (typeof counter == "undefined" || counter == null) {
            return 0;
        } else {
            return counter;
        }
    }
    function updateUI(voteIdMap, arr) {
        var ids = voteIdMap.id;
        if (ids.length != 10) {
            //异常数据
            setTimeout(function() {
                window.location.reload();
            }, 10 * 1e3);
            return false;
        }
        var scopeId = urlObj["scope"];
        var dataObj = globalConcertData["data"]["lists"][scopeId];
        for (var key in dataObj) {
            if (!!voteIdMap[key]) {
                dataObj[key]["votenum"] = exceptionCounter(voteIdMap[key]["data"]["counter"]);
            }
        }
        updateFinal(globalConcertData);
    }
    function updateConcertBefore(data, obj) {
        timer({
            startTime: getNow(tempCdnDate),
            endTime: obj.startTime,
            serverOffsetTime: serverOffsetTime,
            pageStartTime: pageStartTime,
            cdnDate: tempCdnDate,
            getServerSuccess: getServerSuccess,
            callback: function(status, times) {
                //console.log(times);
                if (status == 2) {
                    updateConcertLive(data, obj);
                } else {}
            }
        });
    }
    function updateConcertLive(data, obj) {
        bindVote();
        gloabalIsLive = true;
        voteMap.getVotes({
            callback: updateUI
        });
        voteRefreshInterval = setInterval(function() {
            voteMap.getVotes({
                callback: updateUI
            });
        }, freshTime * 1e3);
        timer({
            startTime: getNow(tempCdnDate),
            endTime: obj.endTime,
            serverOffsetTime: serverOffsetTime,
            pageStartTime: pageStartTime,
            cdnDate: tempCdnDate,
            getServerSuccess: getServerSuccess,
            callback: function(status, times) {
                if (status == 2) {
                    setTimeout(function() {
                        clearInterval(voteRefreshInterval);
                    }, 50 * 1e3 * 2);
                    timeDom.css("display", "none");
                    hourConcert.html("00");
                    miniConcert.html("00");
                    secConcert.html("00");
                } else if (status == 1) {
                    timeDom.css("display", "inline");
                    hourConcert.html(times.hours);
                    miniConcert.html(times.minitues);
                    secConcert.html(times.seconds);
                }
            }
        });
    }
    function updateFinalVote() {
        var ids = voteIdMap.id;
        if (ids.length != 10) {
            //异常数据
            setTimeout(function() {
                window.location.reload();
            }, 10 * 1e3);
            return false;
        }
        var scopeId = urlObj["scope"];
        var dataObj = globalConcertData["data"]["lists"][scopeId];
        for (var key in dataObj) {
            if (!!voteIdMap[key]) {
                dataObj[key]["votenum"] = exceptionCounter(voteIdMap[key]["data"]["counter"]);
            }
        }
        updateFinal(globalConcertData, false);
    }
    var hourConcert = $("#hourConcert");
    var miniConcert = $("#miniConcert");
    var secConcert = $("#secConcert");
    var templateItem = '<li><span class="num"><%= idx %></span>' + '<dl class="cf">' + "<dt>" + '       <a href="<%= url %>" title="<%= showTitle %>" <%if(isClient==false){%>target="_blank"<%}%>></a>' + '<%if(g_status=="4"){%><em class="replace"></em><%}%>' + '<img src="<%= avatar%>" alt="">' + "</dt>" + "  <dd>" + '      <a title="<%= showName %>" href="<%=playerUrl%>" <%if(isClient==false){%>target="_blank"<%}%>><%= showName %></a>' + '    <div class="money <%if(isZero==true){%>nomoney<%}%>">获得酬金： <div class="bar cf"><p style="width:<%= percent%>"><i class="bl"></i><%= percent%><i class="br"></i></p></div></div>' + '<p>获得票数： <em class="color"><%= showVotenum%></em></p>' + "</dd>" + "</dl>" + "</li>";
    var itemFunc = _.template(templateItem);
    function updateConcertEnd() {
        //需要更新dom
        if (globalConcertData != null) {
            updateFinal(globalConcertData);
        } else {
            loader.load(urls["interface"]["concertAll"], {
                __config__: {
                    cdn: true,
                    callback: "updateConcertList"
                }
            }, function(data) {
                updateFinal(data);
            });
        }
    }
    function updateFinal(data) {
        //var data=require('./testconcert');
        if (data.err == 0) {
            var concertData = data.data.lists;
            var scopeId = urlObj["scope"];
            if (concertData == null) {
                return false;
            }
            if (!concertData[scopeId]) {
                return false;
            }
            var finalData = concertData[scopeId];
            var result = {
                data: finalData,
                id: scopeId,
                bonus: data.data["scopes"][scopeId]["bonus"]
            };
            var totalVote = 0;
            var finalArr = _.sortBy(finalData, function(obj) {
                totalVote += Number(obj["votenum"]);
                return -Number(obj.votenum);
            });
            var tempHtml = "<ul>";
            for (var i = 1; i <= finalArr.length; i++) {
                var tempObj = finalArr[i - 1];
                if (tempObj.is_group == 1) {
                    tempObj.showName = tempObj.group_name;
                } else {
                    tempObj.showName = tempObj.real_name;
                }
                if (!!isClient) {
                    if (!!gloabalIsLive) {
                        tempObj.url = tempObj.pc_link;
                        tempObj.showTitle = "正在直播中";
                    } else {
                        tempObj.url = "http://chang.pptv.com/pc/player?username=" + tempObj.username + "&plt=clt";
                        tempObj.showTitle = tempObj.showName;
                    }
                    tempObj.isClient = true;
                    tempObj.playerUrl = "http://chang.pptv.com/pc/player?username=" + tempObj.username + "&plt=clt";
                } else {
                    if (!!gloabalIsLive) {
                        tempObj.showTitle = "正在直播中";
                        tempObj.url = tempObj.web_link;
                    } else {
                        tempObj.url = "http://chang.pptv.com/pc/player?username=" + tempObj.username;
                        tempObj.showTitle = tempObj.showName;
                    }
                    tempObj.isClient = false;
                    tempObj.playerUrl = "http://chang.pptv.com/pc/player?username=" + tempObj.username;
                }
                if (totalVote == 0 || !tempObj["votenum"]) {
                    var num = 0;
                } else {
                    var num = Math.round(Number(tempObj["votenum"]) / totalVote * 1e3) / 10;
                    if (Number(tempObj["votenum"]) != 0 && num == 0) {
                        num = "0.0";
                    }
                }
                if (num === 0) {
                    tempObj.isZero = true;
                } else {
                    tempObj.isZero = false;
                }
                if (num != 0 && num.toString().indexOf(".") == -1) {
                    num += ".0";
                }
                tempObj.percent = num + "%";
                tempObj.idx = i;
                tempObj.showVotenum = addKannma(tempObj["votenum"]);
                tempHtml += itemFunc(tempObj);
                if (i == 5) {
                    tempHtml += "</ul>";
                    tempHtml += "<ul>";
                }
            }
            tempHtml += "</ul>";
            concertContainer.find(".ranklist").html(tempHtml);
        }
    }
    function updateConcertResult(result) {
        var scopeData = result["data"];
        var scopeId = result["id"];
        //演唱会开始时间都是一致的
        for (var key in scopeData) {
            var obj = scopeData[key];
            break;
        }
        var startTime = obj.startTime = uniformDate(obj.start);
        var endTime = obj.endTime = uniformDate(obj.end);
        var nowTime = getNow(tempCdnDate);
        if (startTime.getTime() <= nowTime.getTime() && nowTime.getTime() < endTime.getTime()) {
            updateConcertLive(scopeData, obj);
        } else if (startTime.getTime() > nowTime.getTime()) {
            //未开始
            updateConcertBefore(scopeData, obj);
        } else if (endTime.getTime() <= nowTime.getTime()) {
            //演唱会结束
            //php输出
            if ($(".js-vote").length == 0) {
                return false;
            } else {
                updateConcertEnd();
            }
        }
    }
    function init() {
        loader.load(urls["interface"]["concertAll"], {
            __config__: {
                cdn: true,
                callback: "updateConcertList"
            }
        }, function(data) {
            //var data=require('./testconcert');
            if (data.err == 0) {
                var concertData = data.data.lists;
                var scopeId = urlObj["scope"];
                if (scopeId == "0") {
                    return false;
                }
                if (concertData == null) {
                    return false;
                }
                if (!concertData[scopeId]) {
                    return false;
                }
                var originConcertData = concertData[scopeId];
                var tempObj = {};
                for (var key in originConcertData) {
                    tempObj[originConcertData[key]["voteid"]] = originConcertData[key];
                }
                data.data.lists[scopeId] = tempObj;
                globalConcertData = data;
                //console.log("globalConcertData",globalConcertData);
                var result = {
                    data: tempObj,
                    id: scopeId,
                    bonus: data.data["scopes"][scopeId]["bonus"]
                };
                updateConcertResult(result);
            }
        });
    }
});

define("app/pc/tagpage/stagefour", [ "core/jquery/1.8.3/jquery", "util/vote/uniformDate", "app/pc/index/flipclock", "util/others/getquery", "util/loader/loader", "util/log/log", "util/platform/plt", "util/browser/browser", "util/net/urlquery", "util/linkcfg/interfaceurl", "util/Timer/timer", "core/underscore/1.8.3/underscore" ], function(require, exports) {
    var $ = require("core/jquery/1.8.3/jquery");
    var uniformDate = require("util/vote/uniformDate");
    var flipclock = require("app/pc/index/flipclock");
    var afterContainer = $(".wp-grid .module-pic-layout3");
    //获取服务器时间,模块global
    var serverOffsetTime = 0;
    var getServerSuccess = false;
    var pageStartTime = new Date().getTime();
    if (afterContainer.length > 0) {
        //已经结束
        var phpNowDate = afterContainer.attr("data-date");
        if (!!phpNowDate) {
            var tempCdnDate = uniformDate(phpNowDate);
        } else {
            var tempCdnDate = null;
        }
        $.ajax({
            url: "http://time.pptv.com?time=" + new Date().getTime(),
            type: "GET",
            dataType: "jsonp",
            cache: true,
            jsonp: "cb",
            success: function(data) {
                serverOffsetTime = data * 1e3 - new Date().getTime();
                getServerSuccess = true;
                initTopTimer();
            },
            timeout: 1e3,
            error: function() {
                initTopTimer();
            }
        });
        return false;
    }
    var goldfourContainer = $(".module-gold-tag");
    var globalParent = goldfourContainer.parent();
    var phpNowDate = goldfourContainer.attr("data-date");
    var getUrlArgObject = require("util/others/getquery");
    var loader = require("util/loader/loader");
    var urls = require("util/linkcfg/interfaceurl");
    var timer = require("util/Timer/timer");
    var _ = require("core/underscore/1.8.3/underscore");
    var urlObj = getUrlArgObject();
    var goldItems = goldfourContainer.find("li");
    var phpNowDate = uniformDate(goldfourContainer.attr("data-date"));
    if (!!phpNowDate) {
        var tempCdnDate = uniformDate(phpNowDate);
    } else {
        var tempCdnDate = null;
    }
    var isClient = function() {
        //是否是客户端
        try {
            if (external && external.GetObject) {
                return true;
            }
        } catch (e) {}
        return false;
    }();
    var currentStage = 4;
    var isUpdateEnd = false;
    $.ajax({
        url: "http://time.pptv.com?time=" + new Date().getTime(),
        type: "GET",
        dataType: "jsonp",
        cache: true,
        jsonp: "cb",
        success: function(data) {
            serverOffsetTime = data * 1e3 - new Date().getTime();
            getServerSuccess = true;
            initGold();
            initTopTimer();
        },
        timeout: 1e3,
        error: function() {
            initGold();
            initTopTimer();
        }
    });
    //获取现在的时间
    function getNow(cdnDate) {
        if (getServerSuccess == true) {
            return new Date(new Date().getTime() + serverOffsetTime);
        } else {
            if (!cdnDate) {
                return new Date();
            }
            var offsetTime = new Date().getTime() - pageStartTime;
            var tempPhpDate = new Date(cdnDate.getTime() + offsetTime);
            var clientOffsetTime = new Date().getTime() - tempPhpDate.getTime();
            //cdn 缓存<1小时，相信用户的时间
            if (clientOffsetTime > 0 && clientOffsetTime < 1e3 * 60 * 60 || clientOffsetTime < 0 && clientOffsetTime > -1e3 * 60 * 30) {
                return new Date();
            } else {
                return tempPhpDate;
            }
        }
    }
    function requestEnd(isFirst) {
        var scopeid = urlObj["scope"];
        var tempobj = {};
        tempobj["stage"] = currentStage;
        tempobj["scope"] = scopeid;
        loader.load(urls["interface"]["goldlist"], tempobj, function(data) {
            var liveinfo = data.liveinfo;
            var start = uniformDate(liveinfo.start);
            var end = uniformDate(liveinfo.end);
            var data = data.playerinfo;
            var isEnd = false;
            for (var key in data) {
                if (data[key][g_stage] == currentStage) {
                    isEnd = true;
                }
            }
            if (isEnd == false) {
                setTimeout(function() {
                    if (!!isFirst) {
                        updateDomGoldEnd(data, false);
                    }
                    requestEnd();
                }, 5 * 60 * 1e3);
            } else if (isEnd === true) {
                updateDomGoldEnd(data, true);
            }
        });
    }
    function updateGoldEnd(force) {
        if (force === true || isUpdateEnd === false) {
            requestEnd(isUpdateEnd);
        }
        isUpdateEnd = true;
    }
    var template_item = "<li>" + '<div class="pic">' + '<a href="<%= playurl%>" title="<%= showName %>" <%if(isClient==false){%>target="_blank"<%}%>></a>' + '<img src="<%= avatar%>" alt="<%= showName %>">' + "</div>" + '<h3><a href="<%= playurl%>" title="<%= avatar%>" <%if(isClient==false){%>target="_blank"<%}%>><%= showName %></a></h3>';
    "<% if(isExpand == true) { %>" + "<p>时长：<%= times%></p>" + " <% } %>" + "<% if(isEnd == true&&isOut==true) { %>" + '<i class="icon1"></i>' + " <% } %>" + "<% if(isExpand == true) { %>" + '<p class="cf"><span class="up"><%= upVal%></span><em>|</em><span class="down"><%= downVal%></span></p>' + " <% } %>" + "</li>";
    var tempFunc = _.template(template_item);
    var prefix = '<div class="module-pic-layout3"><div class="hd"><h3><i></i><span>10强</span>选手</h3></div><ul class="cf">';
    var suffix = "</ul></div>";
    function buildItemHtml(data, isEnd, extraInfo) {
        var tempObj1 = data;
        if (!!isClient) {
            tempobj1.isClient = true;
        } else {
            tempobj1.isClient = false;
        }
        if (tempobj1.is_group == "1") {
            tempobj1.showName = tempobj1.group_name;
        } else {
            tempobj1.showName = tempobj1.real_name;
        }
        if (tempobj1.g_status == "2" && g_stage == currentStage) {
            tempobj1.isOut = true;
        }
        tempobj1.isEnd = isEnd === true ? true : false;
        if (!!extraInfo && !$.isEmptyObject(extraInfo)) {
            var tempName = tempObj1.username;
            var tempInfo = extraInfo[tempName];
            if (typeof tempInfo != "undefined") {
                tempobj1.isExpand = true;
                tempobj1.times = "登乐时间" + parseInt(tempInfo["mins"], 10) * 60 + "s";
                tempobj1.upVal = "前进:" + tempInfo["up_votes"];
                tempobj1.downVal = "后退:" + tempInfo["down_votes"];
            }
        }
        return tempFunc(tempobj1);
    }
    function buildNormal(data, isEnd) {
        var tempHtml = "";
        tempHtml += prefix;
        var playData = data.playerinfo;
        for (var key in playData) {
            tempHtml += buildItemHtml(playData[key]["player1_info"], isEnd);
            tempHtml += buildItemHtml(playData[key]["player2_info"], isEnd);
        }
        tempHtml += suffix;
        globalParent.html(tempHtml);
    }
    function updateDomGoldEnd(data, isEnd) {
        if (isEnd === true) {
            var tempobj = {};
            tempobj.__config__ = {
                cdn: true,
                callback: "getextraList"
            };
            tempobj.timeout = 1e3;
            loader.load(urls["goldExtra"], tempobj, function(data) {
                if (data.err === 0) {
                    var extraInfo = data.data;
                    var tempHtml = "";
                    tempHtml += prefix;
                    var playData = data.playerinfo;
                    for (var key in playData) {
                        tempHtml += buildItemHtml(playData[key]["player1_info"], isEnd, extraInfo);
                        tempHtml += buildItemHtml(playData[key]["player2_info"], isEnd, extraInfo);
                    }
                    tempHtml += suffix;
                    globalParent.html(tempHtml);
                }
            }, function() {
                buildNormal(data, isEnd);
            });
        } else {
            buildNormal(data, isEnd);
        }
    }
    function initTopTimer() {
        //首页倒计时
        var timeDom = $(".js-timer-data").eq(0);
        if ($.trim(timeDom.html()) != "") {
            var servertime = getNow(tempCdnDate);
            //建立time对象如果不是合法的timer对象，跳出
            var timerDate = $.trim(timeDom.html()).replace(/-/g, "/");
            if (!!timerDate) {
                timerDate = new Date(timerDate);
            } else {
                return false;
            }
            if (servertime.getTime() < timerDate.getTime()) {
                var obj = {
                    sec: document.getElementById("sec"),
                    mini: document.getElementById("mini"),
                    hour: document.getElementById("hour"),
                    servertime: servertime,
                    finishCallback: function() {
                        $(".module-index-top .time").addClass("hidden");
                    }
                };
                flipclock.create(timerDate, obj);
                $(".module-index-top .time").removeClass("hidden");
            }
        }
    }
    function dispatchGoldItem(obj, scopeid, needTimer, index) {
        var startTime = obj.startTime;
        var endTime = obj.endTime;
        var nowTime = getNow(tempCdnDate);
        //直播中
        if (startTime.getTime() <= nowTime.getTime() && nowTime.getTime() < endTime.getTime()) {
            updateGoldLive(obj, scopeid, needTimer, index);
        } else if (startTime.getTime() > nowTime.getTime()) {
            //未开始
            updateGoldBefore(obj, scopeid, needTimer, index);
        } else if (endTime.getTime() <= nowTime.getTime()) {
            updateGoldEnd();
        }
    }
    function updateGoldLive(obj, scopeid, needTimer, index) {
        var tempDom = goldItems.eq(index);
        if (!!isClient) {
            tempDom.find("pic a").attr("href", obj.pc_link);
        } else {
            tempDom.find("pic a").attr("href", obj.web_link);
        }
        timer({
            startTime: getNow(tempCdnDate),
            endTime: obj.endTime,
            serverOffsetTime: serverOffsetTime,
            pageStartTime: pageStartTime,
            cdnDate: tempCdnDate,
            getServerSuccess: getServerSuccess,
            callback: function(status, times) {
                if (status == 2) {
                    //请求接口换dom
                    updateGoldEnd();
                }
            }
        });
        tempDom.find("a").attr("href", tempDom.attr("next-url"));
    }
    function updateGoldBefore(obj, scopeid, needTimer, index) {
        var $time = $(".time");
        var $h = $("#hour"), $m = $("#mini"), $s = $("#sec");
        var countstart = getNow(tempCdnDate);
        var countend = new Date($time.find(".js-timer-data").text().replace(/-/g, "/"));
        if (countstart < countend) {
            $time.removeClass("hidden");
            timer({
                startTime: countstart,
                endTime: countend,
                serverOffsetTime: serverOffsetTime,
                callback: function(status, times) {
                    $h.text(times.hours);
                    $m.text(times.minitues);
                    $s.text(times.seconds);
                    if (status == 2) {
                        $time.addClass("hidden");
                    }
                }
            });
        }
        timer({
            startTime: getNow(tempCdnDate),
            endTime: obj.startTime,
            serverOffsetTime: serverOffsetTime,
            pageStartTime: pageStartTime,
            cdnDate: tempCdnDate,
            getServerSuccess: getServerSuccess,
            callback: function(status, times) {
                if (status == 2) {
                    updateGoldLive(obj, scopeid, needTimer, index);
                }
            }
        });
    }
    function initGold() {
        var tempobj = {};
        tempobj.__config__ = {
            cdn: true,
            callback: "updateGoldList"
        };
        var scopeid = tempobj.scopeid = urlObj["scope"];
        tempobj.stage = currentStage;
        tempobj["scope"] = scopeid;
        loader.load(urls["interface"]["goldlist"], tempobj, function(data) {
            if (data.err === 0) {
                var data = data.data;
                var liveinfo = data.liveinfo;
                var start = uniformDate(liveinfo.start);
                var end = uniformDate(liveinfo.end);
                var data = data.playerinfo;
                var isEnd = false;
                for (var key in data) {
                    if (data[key]["g_stage"] == currentStage) {
                        isEnd = true;
                    }
                    break;
                }
                if (isEnd === false) {
                    for (var key in data) {
                        var tempObj = data[key];
                        tempObj.startTime = start;
                        tempObj.endTime = end;
                        dispatchGoldItem(tempObj, scopeid, true, key);
                        break;
                    }
                } else {
                    updateGoldEnd(true);
                }
            }
        });
    }
});

define("app/pc/tagpage/stagefive", [ "core/jquery/1.8.3/jquery", "util/vote/uniformDate", "util/others/getquery", "util/loader/loader", "util/log/log", "util/platform/plt", "util/browser/browser", "util/net/urlquery", "util/linkcfg/interfaceurl", "util/Timer/timer", "core/underscore/1.8.3/underscore", "app/pc/index/flipclock" ], function(require, exports) {
    var $ = require("core/jquery/1.8.3/jquery");
    var uniformDate = require("util/vote/uniformDate");
    var getUrlArgObject = require("util/others/getquery");
    var loader = require("util/loader/loader");
    var urls = require("util/linkcfg/interfaceurl");
    var timer = require("util/Timer/timer");
    var _ = require("core/underscore/1.8.3/underscore");
    var flipclock = require("app/pc/index/flipclock");
    var urlObj = getUrlArgObject();
    var isClient = function() {
        //是否是客户端
        try {
            if (external && external.GetObject) {
                return true;
            }
        } catch (e) {}
        return false;
    }();
    var currentStage = 5;
    var template_item = "<li>" + '<div class="pic">' + '<a href="<%= playurl%>" title="<%= showName %>" <%if(isClient==false){%>target="_blank"<%}%>></a>' + '<img src="<%= avatar%>" alt="<%= showName %>">' + "</div>" + '<h3><a href="<%= playurl%>" title="<%= avatar%>" <%if(isClient==false){%>target="_blank"<%}%>><%= showName %></a></h3>' + "<% if(isEnd == true && isOut==true) { %>" + '<i class="icon1"></i>' + " <% } %>" + "</li>";
    var tempFunc = _.template(template_item);
    var prefix = '<div class="module-pic-layout3"><div class="hd"><h3><i></i><span>10强</span>选手</h3></div><ul class="cf">';
    var suffix = "</ul></div>";
    function buildItemHtml(data, isEnd) {
        var tempObj = data;
        if (!!isClient) {
            tempObj.isClient = true;
        } else {
            tempObj.isClient = false;
        }
        if (tempObj.is_group == "1") {
            tempObj.showName = tempObj.group_name;
        } else {
            tempObj.showName = tempObj.real_name;
        }
        tempObj.isEnd = isEnd === true ? true : false;
        if (tempObj.g_status == "2" && tempObj.g_stage == currentStage || tempObj.g_status == "2" && tempObj.g_stage == 4) {
            tempObj.isOut = true;
        }
        if (!!isClient) {
            tempObj.playurl = "http://chang.pptv.com/pc/player?username=" + tempObj.username + "&plt=clt";
        } else {
            tempObj.playurl = "http://chang.pptv.com/pc/player?username=" + tempObj.username;
        }
        return tempFunc(tempObj);
    }
    var goldfourContainer = $("#gold-stage-tag5");
    var globalParent = goldfourContainer.parent();
    function updateDomGoldEnd(data, isEnd) {
        var tempHtml = "";
        tempHtml += prefix;
        for (var key in data) {
            tempHtml += buildItemHtml(data[key]["player1_info"], isEnd);
            tempHtml += buildItemHtml(data[key]["player2_info"], isEnd);
        }
        tempHtml += suffix;
        globalParent.html(tempHtml);
    }
    var serverOffsetTime = 0;
    var getServerSuccess = false;
    $.ajax({
        url: "http://time.pptv.com?time=" + new Date().getTime(),
        type: "GET",
        dataType: "jsonp",
        cache: true,
        jsonp: "cb",
        success: function(data) {
            serverOffsetTime = data * 1e3 - new Date().getTime();
            getServerSuccess = true;
            initTopTimer();
        },
        timeout: 1e3,
        error: function() {
            initTopTimer();
        }
    });
    //头部倒计时初始化
    function initTopTimer() {
        //首页倒计时
        var timeDom = $(".js-timer-data");
        if ($.trim(timeDom.html()) != "") {
            var servertime = new Date(new Date().getTime() + serverOffsetTime);
            //建立time对象如果不是合法的timer对象，跳出
            var timerDate = timeDom.text().replace(/-/g, "/");
            if (!!timerDate) {
                timerDate = new Date(timerDate);
            } else {
                return false;
            }
            if (servertime.getTime() < timerDate.getTime()) {
                var obj = {
                    sec: document.getElementById("sec"),
                    mini: document.getElementById("mini"),
                    hour: document.getElementById("hour"),
                    servertime: servertime,
                    finishCallback: function() {
                        $(".module-index-top .time").addClass("hidden");
                    }
                };
                flipclock.create(timerDate, obj);
                $(".module-index-top .time").removeClass("hidden");
            }
        }
    }
    //var freshTime=5*60;
    var freshTime = 10;
    function initGold() {
        var tempobj = {};
        tempobj.__config__ = {
            cdn: true,
            callback: "updateGoldList"
        };
        var scopeid = tempobj.scopeid = urlObj["scope"];
        tempobj.stage = 4;
        tempobj["scope"] = scopeid;
        loader.load(urls["interface"]["goldlist"], tempobj, function(data) {
            if (data.err === 0) {
                var data = data.data;
                var liveinfo = data.liveinfo;
                var start = uniformDate(liveinfo.start);
                var end = uniformDate(liveinfo.end);
                var data = data.playerinfo;
                var isEnd = false;
                for (var key in data) {
                    if (data[key]["player1_info"]["g_stage"] == currentStage) {
                        isEnd = true;
                        break;
                    }
                    if (data[key]["player2_info"]["g_stage"] == currentStage) {
                        isEnd = true;
                        break;
                    }
                }
                if (isEnd === true) {
                    updateDomGoldEnd(data, true);
                } else {
                    setTimeout(function() {
                        initGold();
                    }, freshTime * 1e3);
                }
            }
        });
    }
    initGold();
});

define("app/pc/tagpage/stagesix", [ "core/jquery/1.8.3/jquery", "util/vote/uniformDate", "util/others/getquery", "util/loader/loader", "util/log/log", "util/platform/plt", "util/browser/browser", "util/net/urlquery", "util/linkcfg/interfaceurl", "util/Timer/timer", "core/underscore/1.8.3/underscore", "app/pc/index/flipclock" ], function(require, exports) {
    var $ = require("core/jquery/1.8.3/jquery");
    var uniformDate = require("util/vote/uniformDate");
    var getUrlArgObject = require("util/others/getquery");
    var loader = require("util/loader/loader");
    var urls = require("util/linkcfg/interfaceurl");
    var timer = require("util/Timer/timer");
    var _ = require("core/underscore/1.8.3/underscore");
    var flipclock = require("app/pc/index/flipclock");
    var urlObj = getUrlArgObject();
    var isClient = function() {
        //是否是客户端
        try {
            if (external && external.GetObject) {
                return true;
            }
        } catch (e) {}
        return false;
    }();
    var currentStage = 5;
    var template_item = "<li>" + '<div class="pic">' + '<a href="<%= playurl%>" title="<%= showName %>" <%if(isClient==false){%>target="_blank"<%}%>></a>' + '<img src="<%= avatar%>" alt="<%= showName %>">' + "</div>" + '<h3><a href="<%= playurl%>" title="<%= avatar%>" <%if(isClient==false){%>target="_blank"<%}%>><%= showName %></a></h3>' + "<% if(isEnd == true && isOut==true) { %>" + '<i class="icon1"></i>' + " <% } %>" + "</li>";
    var tempFunc = _.template(template_item);
    var prefix = '<div class="module-pic-layout3"><div class="hd"><h3><i></i><span>10强</span>选手</h3></div><ul class="cf">';
    var suffix = "</ul></div>";
    function buildItemHtml(data, isEnd) {
        var tempObj = data;
        if (!!isClient) {
            tempObj.isClient = true;
        } else {
            tempObj.isClient = false;
        }
        if (tempObj.is_group == "1") {
            tempObj.showName = tempObj.group_name;
        } else {
            tempObj.showName = tempObj.real_name;
        }
        tempObj.isEnd = isEnd === true ? true : false;
        if (tempObj.g_status == "2" && tempObj.g_stage == currentStage || tempObj.g_status == "2" && tempObj.g_stage == 4) {
            tempObj.isOut = true;
        }
        if (!!isClient) {
            tempObj.playurl = "http://chang.pptv.com/pc/player?username=" + tempObj.username + "&plt=clt";
        } else {
            tempObj.playurl = "http://chang.pptv.com/pc/player?username=" + tempObj.username;
        }
        return tempFunc(tempObj);
    }
    var goldfourContainer = $("#gold-stage-tag5");
    var globalParent = goldfourContainer.parent();
    function updateDomGoldEnd(data, isEnd) {
        var tempHtml = "";
        tempHtml += prefix;
        for (var key in data) {
            tempHtml += buildItemHtml(data[key]["player1_info"], isEnd);
            tempHtml += buildItemHtml(data[key]["player2_info"], isEnd);
        }
        tempHtml += suffix;
        globalParent.html(tempHtml);
    }
    var serverOffsetTime = 0;
    var getServerSuccess = false;
    $.ajax({
        url: "http://time.pptv.com?time=" + new Date().getTime(),
        type: "GET",
        dataType: "jsonp",
        cache: true,
        jsonp: "cb",
        success: function(data) {
            serverOffsetTime = data * 1e3 - new Date().getTime();
            getServerSuccess = true;
            initTopTimer();
        },
        timeout: 1e3,
        error: function() {
            initTopTimer();
        }
    });
    //头部倒计时初始化
    function initTopTimer() {
        //首页倒计时
        var timeDom = $(".js-timer-data");
        if ($.trim(timeDom.html()) != "") {
            var servertime = new Date(new Date().getTime() + serverOffsetTime);
            //建立time对象如果不是合法的timer对象，跳出
            var timerDate = timeDom.text().replace(/-/g, "/");
            if (!!timerDate) {
                timerDate = new Date(timerDate);
            } else {
                return false;
            }
            if (servertime.getTime() < timerDate.getTime()) {
                var obj = {
                    sec: document.getElementById("sec"),
                    mini: document.getElementById("mini"),
                    hour: document.getElementById("hour"),
                    servertime: servertime,
                    finishCallback: function() {
                        $(".module-index-top .time").addClass("hidden");
                    }
                };
                flipclock.create(timerDate, obj);
                $(".module-index-top .time").removeClass("hidden");
            }
        }
    }
    //var freshTime=5*60;
    var freshTime = 10;
    function initGold() {
        var tempobj = {};
        tempobj.__config__ = {
            cdn: true,
            callback: "updateGoldList"
        };
        var scopeid = tempobj.scopeid = urlObj["scope"];
        tempobj.stage = 4;
        tempobj["scope"] = scopeid;
        loader.load(urls["interface"]["goldlist"], tempobj, function(data) {
            if (data.err === 0) {
                var data = data.data;
                var liveinfo = data.liveinfo;
                var start = uniformDate(liveinfo.start);
                var end = uniformDate(liveinfo.end);
                var data = data.playerinfo;
                var isEnd = false;
                for (var key in data) {
                    if (data[key]["player1_info"]["g_stage"] == currentStage) {
                        isEnd = true;
                        break;
                    }
                    if (data[key]["player2_info"]["g_stage"] == currentStage) {
                        isEnd = true;
                        break;
                    }
                }
                if (isEnd === true) {
                    updateDomGoldEnd(data, true);
                } else {
                    setTimeout(function() {
                        initGold();
                    }, freshTime * 1e3);
                }
            }
        });
    }
    initGold();
});

define("app/pc/tagpage/stageseven", [ "core/jquery/1.8.3/jquery", "util/vote/uniformDate", "util/others/getquery", "util/loader/loader", "util/log/log", "util/platform/plt", "util/browser/browser", "util/net/urlquery", "util/linkcfg/interfaceurl", "util/Timer/timer", "core/underscore/1.8.3/underscore", "app/pc/index/flipclock" ], function(require, exports) {
    var $ = require("core/jquery/1.8.3/jquery");
    var uniformDate = require("util/vote/uniformDate");
    var getUrlArgObject = require("util/others/getquery");
    var loader = require("util/loader/loader");
    var urls = require("util/linkcfg/interfaceurl");
    var timer = require("util/Timer/timer");
    var _ = require("core/underscore/1.8.3/underscore");
    var flipclock = require("app/pc/index/flipclock");
    var urlObj = getUrlArgObject();
    var isClient = function() {
        try {
            if (external && external.GetObject) {
                return true;
            }
        } catch (e) {}
        return false;
    }();
    var currentStage = 5;
    var template_item = "<li>" + '<div class="pic">' + '<a href="<%= playurl%>" title="<%= showName %>" <%if(isClient==false){%>target="_blank"<%}%>></a>' + '<img src="<%= avatar%>" alt="<%= showName %>">' + "</div>" + '<h3><a href="<%= playurl%>" title="<%= avatar%>" <%if(isClient==false){%>target="_blank"<%}%>><%= showName %></a></h3>' + "<% if(isEnd == true && isOut==true) { %>" + '<i class="icon1"></i>' + " <% } %>" + "</li>";
    var tempFunc = _.template(template_item);
    var prefix = '<div class="module-pic-layout3"><div class="hd"><h3><i></i><span>10强</span>选手</h3></div><ul class="cf">';
    var suffix = "</ul></div>";
    function buildItemHtml(data, isEnd) {
        var tempObj = data;
        if (!!isClient) {
            tempObj.isClient = true;
        } else {
            tempObj.isClient = false;
        }
        if (tempObj.is_group == "1") {
            tempObj.showName = tempObj.group_name;
        } else {
            tempObj.showName = tempObj.real_name;
        }
        tempObj.isEnd = isEnd === true ? true : false;
        if (tempObj.g_status == "2" && tempObj.g_stage == currentStage || tempObj.g_status == "2" && tempObj.g_stage == 4) {
            tempObj.isOut = true;
        }
        if (!!isClient) {
            tempObj.playurl = "http://chang.pptv.com/pc/player?username=" + tempObj.username + "&plt=clt";
        } else {
            tempObj.playurl = "http://chang.pptv.com/pc/player?username=" + tempObj.username;
        }
        return tempFunc(tempObj);
    }
    var goldfourContainer = $("#gold-stage-tag5");
    var globalParent = goldfourContainer.parent();
    function updateDomGoldEnd(data, isEnd) {
        var tempHtml = "";
        tempHtml += prefix;
        for (var key in data) {
            tempHtml += buildItemHtml(data[key]["player1_info"], isEnd);
            tempHtml += buildItemHtml(data[key]["player2_info"], isEnd);
        }
        tempHtml += suffix;
        globalParent.html(tempHtml);
    }
    var serverOffsetTime = 0;
    var getServerSuccess = false;
    $.ajax({
        url: "http://time.pptv.com?time=" + new Date().getTime(),
        type: "GET",
        dataType: "jsonp",
        cache: true,
        jsonp: "cb",
        success: function(data) {
            serverOffsetTime = data * 1e3 - new Date().getTime();
            getServerSuccess = true;
            initTopTimer();
        },
        timeout: 1e3,
        error: function() {
            initTopTimer();
        }
    });
    //头部倒计时初始化
    function initTopTimer() {
        //首页倒计时
        var timeDom = $(".js-timer-data");
        if ($.trim(timeDom.html()) != "") {
            var servertime = new Date(new Date().getTime() + serverOffsetTime);
            //建立time对象如果不是合法的timer对象，跳出
            var timerDate = timeDom.text().replace(/-/g, "/");
            if (!!timerDate) {
                timerDate = new Date(timerDate);
            } else {
                return false;
            }
            if (servertime.getTime() < timerDate.getTime()) {
                var obj = {
                    sec: document.getElementById("sec"),
                    mini: document.getElementById("mini"),
                    hour: document.getElementById("hour"),
                    servertime: servertime,
                    finishCallback: function() {
                        $(".module-index-top .time").addClass("hidden");
                    }
                };
                flipclock.create(timerDate, obj);
                $(".module-index-top .time").removeClass("hidden");
            }
        }
    }
    //var freshTime=5*60;
    var freshTime = 10;
    function initGold() {
        var tempobj = {};
        tempobj.__config__ = {
            cdn: true,
            callback: "updateGoldList"
        };
        var scopeid = tempobj.scopeid = urlObj["scope"];
        tempobj.stage = 4;
        tempobj["scope"] = scopeid;
        loader.load(urls["interface"]["goldlist"], tempobj, function(data) {
            if (data.err === 0) {
                var data = data.data;
                var liveinfo = data.liveinfo;
                var start = uniformDate(liveinfo.start);
                var end = uniformDate(liveinfo.end);
                var data = data.playerinfo;
                var isEnd = false;
                for (var key in data) {
                    if (data[key]["player1_info"]["g_stage"] == currentStage) {
                        isEnd = true;
                        break;
                    }
                    if (data[key]["player2_info"]["g_stage"] == currentStage) {
                        isEnd = true;
                        break;
                    }
                }
                if (isEnd === true) {
                    updateDomGoldEnd(data, true);
                } else {
                    setTimeout(function() {
                        initGold();
                    }, freshTime * 1e3);
                }
            }
        });
    }
    initGold();
});
