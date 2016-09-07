/*! 一唱成名 create by ErickSong */
/*
* @Author: WhiteWang
* @Date:   2015-08-18 19:15:32
* @Last Modified by:   weifengwang
* @Last Modified time: 2015-09-14 19:01:29
*/
define("app/pc/playpage/play", [ "./vod", "../../../util/pub/main", "core/underscore/1.8.3/underscore", "core/jquery/1.8.3/jquery", "../../../util/cookie/cookie", "../../../util/lazyload/delayload", "../../../util/lazyload/webp", "../../../util/login/login", "../../../util/user/user", "client", "../../../util/log/log", "./programList", "../index/group", "../index/group-controller", "../../../util/function/delay", "../../../util/event/event-aggregator", "../../../util/loader/loader", "../../../util/platform/plt", "../../../util/browser/browser", "../../../util/net/urlquery", "../../../util/linkcfg/interfaceurl", "../../../util/scroller/scroller", "../../../util/event/event-mouse-wheel", "../../../util/scroller/scroller.css", "../../../util/comment/comment", "../../../util/share/share", "../../../util/linkcfg/pcredirect", "../../../util/vote/vote", "../../../util/vote/voteupdate", "../index/common-joinvip" ], function(require, exports, module) {
    require("./vod");
    var ShareBox = require("../../../util/share/share");
    var urls = require("../../../util/linkcfg/interfaceurl");
    var loader = require("../../../util/loader/loader");
    var cookie = require("../../../util/cookie/cookie");
    var $ = require("core/jquery/1.8.3/jquery");
    //登录模块
    require("../../../util/linkcfg/pcredirect");
    //登录模块结束
    //分享模块
    (function() {
        var reg = /show\/(.*)\.html/;
        var playStr = window.location.pathname.match(reg);
        if (playStr != null) {
            playStr = playStr[1];
        } else {
            playStr = "";
        }
        var timershow = null, timerhide = null;
        $share = $(".module-set .share");
        $shareBox = $share.find(".sharebox");
        var tempObj = {
            box: $shareBox,
            url: "http://v.pptv.com/show/" + playStr + ".html"
        };
        if (!!webcfg.title) {
            tempObj.shareContent = webcfg.title;
        }
        var username = $.trim($(".module-info dd p").first().find("a").text());
        tempObj.shareContent = "#" + username + "#报名了#pptv一唱成名#音乐选秀，快来投上一票吧! [" + tempObj.shareContent + "]#一唱成名#（分享自@PPTV聚力）";
        new ShareBox(tempObj);
        $share.on("mouseenter", function() {
            clearTimeout(timerhide);
            timershow = setTimeout(function() {
                $shareBox.fadeIn();
            }, 300);
        }).on("mouseleave", function() {
            clearTimeout(timershow);
            timerhide = setTimeout(function() {
                $shareBox.fadeOut();
            }, 300);
        });
    })();
    var vote = require("../../../util/vote/vote");
    var voteMap = require("../../../util/vote/voteupdate");
    var jsVotes = $(".module-set .js-vote");
    var voteLength = jsVotes.length;
    if (voteLength > 0) {
        voteMap.init({
            selector: ".js-vote",
            voteAttr: "sid"
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
    //console.log('voteMap',voteMap);
    function updateUI(voteIdMap, arr) {
        // console.log('voteIdMap',voteIdMap);
        //console.log('arr',arr);
        for (var i = 0; i < arr.length; i++) {
            var tempObj = voteIdMap[arr[i]];
            var doms = tempObj["doms"];
            var len = doms.length;
            for (var j = 0; j < len; j++) {
                //更新的操作在这里
                //console.log('domj',doms[j]);
                var domParent = doms[j].parent();
                var text = "";
                if (domParent.hasClass("up")) {
                    text = addKannma(tempObj.data.counter);
                } else if (domParent.hasClass("down")) {
                    text = addKannma(tempObj.data.counter);
                }
                doms[j].siblings("span").html(text);
            }
        }
    }
    //投票配置
    var counterDefault = 3600;
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
    if (voteLength > 0) {
        new vote({
            dom: ".js-vote",
            voteAttr: "sid",
            beforeVote: function(data, dom) {},
            afterVote: function(data, dom) {
                //console.log(arguments);
                if (typeof data.counter != "undefined") {
                    //todo lock
                    //dom.data('isLocked',true);
                    var domParent = dom.parent();
                    var text = "";
                    var voteid = dom.attr("sid");
                    var relid = domParent.siblings(".rel").find(".js-vote").attr("sid");
                    var endCounter = getCounter(voteid);
                    voteAnimate(domParent, endCounter);
                    if (domParent.hasClass("up")) {
                        text = addKannma(data.counter);
                    } else if (domParent.hasClass("down")) {
                        text = addKannma(data.counter);
                    }
                    domParent.find("span").html(text);
                } else if (data.errors) {
                    if (data.errors.code == 88) {
                        alert("请休息一个小时再投票哦！");
                    }
                }
            }
        });
    }
    function formatCounter(count) {
        var end = count % 60;
        end = end.toString().length == 1 ? "0" + end : end;
        var start = Math.floor(count / 60);
        start = start.toString().length == 1 ? "0" + start : start;
        return start + ":" + end;
    }
    //常规倒计时
    function counter(dom, count, first, secondDom) {
        if (first == true) {
            dom.text(formatCounter(count));
            !!secondDom && secondDom.text(formatCounter(count));
        }
        setTimeout(function() {
            var tempCount = --count;
            dom.text(formatCounter(tempCount));
            !!secondDom && secondDom.text(formatCounter(tempCount));
            if (count != 0) {
                counter(dom, count, false, secondDom);
            } else {
                dom.hide();
                dom.html("");
                !!secondDom && secondDom.hide();
                !!secondDom && secondDom.html("");
            }
        }, 1e3);
    }
    function voteAnimate(domParent, originCounter, targetTop) {
        var relDom = domParent.siblings(".rel");
        var maskRel = relDom.find(".vote-mask");
        var maskDom = domParent.find(".vote-mask");
        var addDom = domParent.find(".vote-add");
        var originTop = addDom.css("top");
        var targetTop = targetTop || -50;
        maskDom.show();
        maskDom.text(originCounter);
        //maskRel.show();
        //maskRel.text(originCounter);
        counter(maskDom, originCounter, true);
        //counter(maskRel,originCounter,true);
        /*timer({
            startTime : new Date(),
            endTime:new Date(new Date().getTime()+10*1000),
            callback:function(status,time){
                if(status==2){
                    maskDom.hide();
                    maskDom.html('');
                }else{
                    maskDom.show();
                    maskDom.html(time.seconds);
                }
            }
        });*/
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
    if (voteLength > 0) {
        voteMap.getVotes({
            callback: updateUI
        });
        //新增投票锁定逻辑
        var checkvote = jsVotes.eq(0);
        var voteId = checkvote.attr("sid");
        var relDom = jsVotes.eq(1);
        var relId = relDom.attr("sid");
        var endCounter = getCounter(voteId, true);
        var endCounter2 = getCounter(relId, true);
        if (endCounter != counterDefault) {
            voteAnimate(checkvote.parent(), endCounter);
        }
        if (endCounter2 != counterDefault) {
            voteAnimate(relDom.parent(), endCounter2);
        }
        // 更新排名信息
        var updateDom = $(".module-set .tip span");
        var tempData = {
            id: webcfg["id"],
            scope: window.game_scope,
            sort: 3
        };
        tempData.__config__ = {
            cdn: true,
            callback: "videoRankUpdate"
        };
        loader.load(urls["interface"]["videoRank"], tempData, function(data) {
            if (data.err == 0) {
                //更新dom
                var tempObj = data.data;
                if (tempObj.current == null || tempObj.current == 1 && tempObj.prevVotes != 0 || tempObj.current == 0 && tempObj.prevVotes == 0) {
                    updateDom.eq(0).text("计算中").addClass("c-grey");
                    updateDom.eq(1).text("计算中").addClass("c-grey");
                } else if (tempObj.current != 1 && tempObj.prevVotes == 0) {
                    updateDom.eq(0).text(tempObj.current).removeClass("c-grey");
                    updateDom.eq(1).text("计算中").addClass("c-grey");
                } else {
                    updateDom.eq(0).text(tempObj.current).removeClass("c-grey");
                    updateDom.eq(1).text(addKannma(tempObj.prevVotes)).removeClass("c-grey");
                }
            }
        });
    }
    //加入vip模块
    require("../index/common-joinvip");
    //加入vip模块结束
    //5s 刷一次
    if (voteLength > 0) {
        var voteObj = voteMap.get();
        setInterval(function() {
            voteMap.getVotes({
                callback: updateUI
            });
        }, 30 * 1e3);
    }
});

define("app/pc/playpage/vod", [ "util/pub/main", "core/underscore/1.8.3/underscore", "core/jquery/1.8.3/jquery", "util/cookie/cookie", "util/lazyload/delayload", "util/lazyload/webp", "util/login/login", "util/user/user", "client", "util/log/log", "app/pc/playpage/programList", "app/pc/index/group", "app/pc/index/group-controller", "util/function/delay", "util/event/event-aggregator", "util/loader/loader", "util/platform/plt", "util/browser/browser", "util/net/urlquery", "util/linkcfg/interfaceurl", "util/scroller/scroller", "util/event/event-mouse-wheel", "util/comment/comment" ], function(require, exports, modules) {
    require("util/pub/main");
    var login = require("util/login/login");
    // webcfg 需要根据新的接口进行组装
    var $ = require("core/jquery/1.8.3/jquery"), log = require("util/log/log"), cookie = require("util/cookie/cookie"), user = require("util/user/user");
    playId = webcfg["id"], isJuji = !webcfg.playType ? false : true, DomPlayer = $("#pptv_playpage_box"), 
    DomPlayerSideBar = $("#player-sidebar"), BarrageHeight = 0, key = "theatremode", 
    isTheatreMode = false;
    if (!playId || !DomPlayer.length) {
        alert("缺少播放器频道ID!");
        return;
    }
    //弹幕输入
    (function() {
        var hasInited = false;
        //vodBarrage();
        player.onRegister("setupbarrage", function(data) {
            //这里会初始化2次，原因未知;
            var dataContent = data.body && data.body.data || {};
            log("player :: setupbarrage ==>", data, dataContent);
            //全局设置
            player.getPlayer().setCallback("barragesetting", {
                header: {
                    type: "barragesetting"
                },
                body: {
                    data: {
                        //alpha : 1,
                        visible: 0
                    }
                }
            });
            //判断是否支持弹幕 'mode' : 1  或 0  代表   有或无
            if (dataContent.mode !== 0) {
                vodBarrage();
            }
        });
        function vodBarrage() {
            if (hasInited) return;
            var DomPlayerParent = DomPlayer.parent(), h0 = DomPlayer.height();
            DomPlayerParent.append("<div id='vod-barrage' class='module-dm-input'><div class='form cf'><span class='t' id='setfont'></span><input type='text' name='' class='txt' id='dminput' maxlength='30'><a href='###' title='' class='submit' id='dmsubmit'>发送</a></div><div class='text'></div><iframe frameborder='0' src='about:blank' class='iframe-blank' style='position:absolute;top:-118px;left:0;display:none;background:#fff;opacity:0;width:210px;height:120px;z-index:1;'></iframe><div class='dm-input-pop' style='display:none;top:-118px;height:80px;'>   <!--<dl><dt>弹幕显示设置</dt><dd id='opacity'><span>透明度</span><a href='###' title='' class='now'>无</a><a href='###' title=''>低</a><a href='###' title=''>中</a><a href='###' title=''>高</a></dd></dl>--><dl><dt>我的弹幕设置</dt><dd><span>颜&nbsp;&nbsp;&nbsp;色</span><span class='rgb'>#ffffff</span><span class='color' style='background:#fff;'></span></dd></dl><div class='takecolor'><a href='###' title='' data-color='ffffff' style='background:#ffffff;'></a><a href='###' title='' data-color='ff0000' style='background:#ff0000;'></a><a href='###' title='' data-color='ff9900' style='background:#ff9900;'></a><a href='###' title='' data-color='fff100' style='background:#fff100;'></a><a href='###' title='' data-color='00ff12' style='background:#00ff12;'></a><a href='###' title='' data-color='00fcff' style='background:#00fcff;'></a><a href='###' title='' data-color='3399ff' style='background:#3399ff;'></a><a href='###' title='' data-color='8600ff' style='background:#8600ff;'></a><a href='###' title='' data-color='ff0096' style='background:#ff0096;'></a><a href='###' title='' data-color='c8b33c' style='background:#c8b33c;'></a></div><a href='###' title='' class='arrow'></a></div></div>");
            BarrageHeight = $("#vod-barrage").height();
            var DomPlayerSideBarWrap = DomPlayerSideBar.parent();
            DomPlayerSideBarWrap.height(DomPlayerSideBarWrap.height() + BarrageHeight);
            /*DomPlayerWraper.height(h0 + BarrageHeight);
            DomPlayerWraper.find('.player-bg').css({ height : h0 + BarrageHeight});*/
            /*DomPlayerSideBar.height(DomPlayerSideBar.height() + BarrageHeight);
            if(isTheatreMode){
                DomPlayerSideBar.parent().css('margin-top', 0);
            }else{
                DomPlayerSideBar.parent().css('margin-top', -(h0 + BarrageHeight + 10));
            }*/
            $.publish("player.resize");
            var submit = $("#dmsubmit"), inputTxt = $("#dminput"), curcolor = "ffffff", alpha = "1";
            var opaNum = [ 1, .85, .7, .55 ];
            $("#setfont").click(function() {
                if ($(".dm-input-pop").css("display") == "none") {
                    $(".dm-input-pop").show().parent().find(".iframe-blank").show();
                } else {
                    $(".dm-input-pop").hide().parent().find(".iframe-blank").hide();
                }
            });
            $("#opacity a").each(function(i, d) {
                $(this).click(function() {
                    $("#opacity a").removeClass("now");
                    $(this).addClass("now");
                    alpha = opaNum[i];
                });
            });
            $(".takecolor a").each(function(i, d) {
                $(this).click(function() {
                    curcolor = $(this).attr("data-color");
                    $(".rgb").html("#" + curcolor);
                    $(".color").css("background", "#" + curcolor);
                });
            });
            var vodInterval = null;
            var getValue = function() {
                words = inputTxt.val();
                if (/^\s|\S$/.test($.trim(words)) == false) {
                    return false;
                } else {
                    player.onNotification({
                        header: {
                            type: "sendbarrage"
                        },
                        body: {
                            data: {
                                userName: user.info.UserName,
                                nickName: user.info.Nickname,
                                playPoint: "",
                                vipType: 0,
                                visible: 0,
                                content: words,
                                color: "#" + curcolor
                            }
                        }
                    });
                    var count = 5;
                    submit.addClass("disable").html(count);
                    vodInterval = setInterval(function() {
                        count--;
                        submit.html(count);
                        if (count <= 0) {
                            clearInterval(vodInterval);
                            vodInterval = null;
                            submit.removeClass("disable").html("发送");
                        }
                    }, 1e3);
                }
            };
            submit.click(function() {
                if (!!vodInterval) {
                    return;
                }
                if (user.isLogined) {
                    getValue();
                    inputTxt.val("");
                } else {
                    login.check(function() {
                        getValue();
                    }, {
                        type: "login"
                    });
                }
            });
            inputTxt.on("keydown", function(e) {
                if (e.keyCode == 13) {
                    if (!!vodInterval) {
                        return;
                    }
                    if (user.isLogined) {
                        getValue();
                        inputTxt.val("");
                    } else {
                        login.check(function() {
                            getValue();
                        }, {
                            type: "login"
                        });
                    }
                }
            });
            hasInited = true;
        }
        //剧场模式
        player.onRegister("theatre", function(data) {
            log("onRegister ==> theatre ", data, data.body.data.mode);
            var dataContent = data.body && data.body.data || {};
            cookie.set(key, dataContent.mode, 1, "pptv.com", "/");
            /*window.scrollTo(0, 0);
            isSmallWindow = false;*/
            if (dataContent.mode === 1) {
                isTheatreMode = true;
                playForTheatre();
            } else {
                isTheatreMode = false;
                playForTheatre();
            }
        });
        function playForTheatre() {
            var DomPlayerParent = DomPlayer.parent();
            if (!!isTheatreMode) {
                DomPlayerSideBar.parent().css("display", "none");
                DomPlayerParent.addClass("player-theatre");
                DomPlayerParent.animate({
                    width: "100%"
                }, 400, "swing");
            } else {
                //DomPlayerParent.css('width','680px');
                DomPlayerParent.animate({
                    width: "680px"
                }, 400, "swing", function() {
                    DomPlayerParent.removeClass("player-theatre");
                    DomPlayerSideBar.parent().css("display", "block");
                });
            }
            $.publish("player.resize");
        }
        //剧场模式结束
        //输出节目列表开始
        require("app/pc/playpage/programList");
        //输出节目列表结束
        // 加载评论模块
        require("util/comment/comment");
    })();
});

/**
 * 通用模块
 **/
define("util/pub/main", [ "core/underscore/1.8.3/underscore", "core/jquery/1.8.3/jquery", "util/cookie/cookie", "util/lazyload/delayload", "util/lazyload/webp", "util/login/login", "util/user/user", "client" ], function(require) {
    var _ = require("core/underscore/1.8.3/underscore");
    var $ = require("core/jquery/1.8.3/jquery");
    var cookie = require("util/cookie/cookie");
    var blankSrc = "http://static9.pplive.cn/pptv/index/v_201202141528/images/no.gif";
    var isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry/i.test(navigator.userAgent);
    require("util/lazyload/delayload");
    function hasPlaceholderSupport() {
        return "placeholder" in document.createElement("input");
    }
    //placeholder
    $.fn.pholder2 = function(options) {
        var defaults = {};
        var opts = $.extend(defaults, options);
        return $(this).each(function() {
            var self = $(this), next = self.next(), _cache_holder = self.attr("placeholder"), msk;
            self.hide();
            if (!!next.length) {
                msk = next;
                msk.attr("value", _cache_holder).css("color", "#ccc");
                msk.show();
            } else {
                msk = $('<input type="text" class="place-holder" value="' + _cache_holder + '" tabindex="' + (self.attr("tabindex") || "") + '" />');
            }
            msk.appendTo(this.parentNode).bind({
                focus: function() {
                    $(this).hide().prev().show();
                    self.trigger("focus").parent().addClass("txt");
                }
            });
            self.bind({
                blur: function() {
                    if ($(this).val() === "") {
                        $(this).hide();
                        msk.show().end().parent().removeClass("txt");
                    }
                }
            });
        });
    };
    // Publish/Subscribe
    (function($) {
        var o = $({});
        // call比apply速度快
        $.subscribe = function(a, b) {
            o.on.call(o, a, b);
        };
        $.subscribe1 = function(a, b) {
            o.on.call(o, a, function() {
                //舍弃第一个参数event
                var a = arguments;
                b.call(o, a[1], a[2], a[3], a[4]);
            });
        };
        $.unsubscribe = function(a, b) {
            o.off.call(o, a, b);
        };
        $.publish = function(a, b) {
            o.trigger.call(o, a, b);
        };
        $.publish1 = function(a, b, c, d, e) {
            o.trigger.call(o, a, [ b, c, d, e ]);
        };
    })($);
    var _self, Util = _self = {
        isMobile: isMobile
    };
    var cfg = {
        src_userPic: "http://face.passport.pplive.com/",
        // 用户头像路径
        src_userPicDef: "http://face.passport.pplive.com/ppface.jpg",
        // 用户默认头像
        src_blankImg: "http://static9.pplive.cn/pptv/index/v_201202141528/images/no.gif",
        // 1 * 1透明图片
        isClient: decodeURIComponent(location.href).indexOf("plt=clt") > -1 ? true : false,
        // 是否客户端，没有用client模块判断，因为统计页面也需要走client的逻辑
        isMobile: isMobile
    };
    window.webcfg = $.extend({}, window.webcfg || {}, cfg);
    var lastPageSize;
    window.onPageResize = window.onPageResize || [];
    window.onPageResize.push(function(cn, w) {
        if (cn != lastPageSize) {
            lastPageSize = cn;
            $.publish("onBodyResize", [ cn ]);
        }
    });
    /*fix old login*/
    var login = require("util/login/login");
    var user = require("util/user/user");
    window.SeajsModuleInterface = {
        login: login,
        user: user
    };
    /* 为统计代码 */
    if (location.href.indexOf("http://analyze.admin.synacast.com") >= 0) {
        $("#sliderForStatistics").show();
    }
    //if(客户端){
    /*
        1.页面中需要设置客户端导航状态
            首页要设置导航“首页”激活 parent.nav_pl.setLight(0);

            var _pages = {
                'index': 0,
                'list' : 1
            }
            $.subscribe('onload/pagetitle', function(e, pageName){
                parent.nav_pl.setLight(_pages[pageName]);
            });

        2.顶部焦点图轮播
            7秒间隔，鼠标hover停止
            需要检测客户端的显示状态，hide的时候停止


        3.用户登录退出时需要刷新页面
            针对不同用户加载不同内容


        4.播放视频、用户登录退出、收藏记录变化等需要向客户端写log
            客户端提供接口ppLog

        5.客户端播放优先小窗口播放(不支持小窗则正常模式播放)

        6.用户信息、历史记录、收藏记录等通过客户端接口获取

        7.客户端打开页面，点击链接播放视频。浏览器打开页面，点击链接跳转页面

        */
    // }
    return Util;
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

define("util/lazyload/delayload", [ "core/jquery/1.8.3/jquery", "util/lazyload/webp" ], function(require, exports, module) {
    var $ = require("core/jquery/1.8.3/jquery");
    var Webp = require("util/lazyload/webp");
    function _getpos(e) {
        var g;
        if (e.parentNode === null || e.style.display == "none") {
            return false;
        }
        if (e.getBoundingClientRect) {
            g = e.getBoundingClientRect();
            var m = e.ownerDocument, h = m.body, b = m.documentElement, f = b.clientTop || h.clientTop || 0, i = b.clientLeft || h.clientLeft || 0;
            var a = Math.max(document.documentElement.scrollTop, document.body.scrollTop);
            var c = Math.max(document.documentElement.scrollLeft, document.body.scrollLeft);
            var l = g.left + c - i;
            var k = g.top + a - f;
            return {
                x: l,
                y: k,
                left: l,
                top: k
            };
        } else {
            if (document.getBoxObjectFor) {
                g = document.getBoxObjectFor(e);
                var j = e.style.borderLeftWidth ? parseInt(e.style.borderLeftWidth) : 0;
                var d = e.style.borderTopWidth ? parseInt(e.style.borderTopWidth) : 0;
                pos = [ g.x - j, g.y - d ];
            } else {
                pos = [ e.offsetLeft, e.offsetTop ];
                parent = e.offsetParent;
                if (parent != e) {
                    while (parent) {
                        pos[0] += parent.offsetLeft;
                        pos[1] += parent.offsetTop;
                        parent = parent.offsetParent;
                    }
                }
                if (e.style.position == "absolute") {
                    pos[0] -= document.body.offsetLeft;
                    pos[1] -= document.body.offsetTop;
                }
            }
        }
        if (e.parentNode) {
            parent = e.parentNode;
        } else {
            parent = null;
        }
        while (parent && parent.tagName != "BODY" && parent.tagName != "HTML") {
            pos[0] -= parent.scrollLeft;
            pos[1] -= parent.scrollTop;
            if (parent.parentNode) {
                parent = parent.parentNode;
            } else {
                parent = null;
            }
        }
        return {
            x: pos[0],
            y: pos[1],
            left: pos[0],
            top: pos[1]
        };
    }
    function _images_delay_load(element) {
        var e = element ? $(element).find("img") : document.images;
        var c = [];
        var b = null;
        for (var d = 0, a = e.length; d < a; d++) {
            if (e[d].getAttribute("data-src2") != null) {
                c.push(e[d]);
            }
        }
        function h(k, t) {
            var l = document.documentElement.scrollTop || document.body.scrollTop;
            var j = document.documentElement.clientHeight || document.body.clientHeight;
            if (typeof k == "number" && typeof t == "number") {
                l = k;
                j = t;
            }
            var q = l + j;
            var n, r, s, o;
            for (var m = 0, p = c.length; m < p; m++) {
                n = c[m];
                r = _getpos(n);
                s = r.y;
                o = n.offsetHeight;
                if (s + o > l && s < q) {
                    n.src = Webp.getWebp(n.getAttribute("data-src2"));
                    c.splice(m, 1);
                    m--;
                    p--;
                }
            }
        }
        function g() {
            clearTimeout(b);
            b = setTimeout(h, 100);
        }
        function f(k, j, i) {
            if (k.addEventListener) {
                k.addEventListener(j, i, false);
            } else {
                if (k.attachEvent) {
                    k.attachEvent("on" + j, i);
                }
            }
        }
        f(window, "scroll", g);
        f(window, "resize", g);
        h();
        _images_delay_load.update = h;
        _images_delay_load.add = function(elements) {
            if (!!Array.prototype.concat) {
                c = c.concat(elements);
            }
        };
    }
    exports.init = function(element) {
        _images_delay_load(element);
    };
    exports.update = function() {
        _images_delay_load.update();
    };
    exports.add = function(elements) {
        _images_delay_load.add(elements);
    };
});

/* 
* @Author: WhiteWang
* @Date:   2015-04-28 14:48:04
* @Last Modified by:   weifengwang
* @Last Modified time: 2015-05-27 10:37:03
* @Des 对于版本大于30的chrome或客户端，图片格式是jpg，用.webp压缩格式；冰哥需求
*/
define("util/lazyload/webp", [], function(require, exports, module) {
    var isClient = function() {
        try {
            if (this.external && external.GetObject("@pplive.com/ui/mainwindow;1")) {
                return true;
            }
        } catch (e) {}
        return false;
    }();
    function getImgFormat(url) {
        var match = /\.[^\.]+$/.exec(url);
        if (match != null) {
            return match[0];
        } else {
            return false;
        }
    }
    function getChromeVer() {
        var isChrome = window.navigator.userAgent.indexOf("Chrome") !== -1;
        if (!isChrome) {
            return 0;
        }
        return parseInt(window.navigator.appVersion.match(/Chrome\/(\d+)\./)[1], 10);
    }
    var Webp = {
        isBrowserSupport: function() {
            if (typeof this.webpSupport == "boolean") {
                return this.webpSupport;
            }
            if (isClient) {
                this.webpSupport = true;
                return this.webpSupport;
            }
            var el = new Image();
            el.src = "data:image/webp;base64,UklGRiIAAABXRUJQVlA4IBYAAAAwAQCdASoBAAEADsD+JaQAA3AAAAAA";
            this.webpSupport = el.height === 1;
            return this.webpSupport;
        },
        isFormatSupport: function(url) {
            //目前图片格式只支持jpg,jpeg
            var imgFormat = getImgFormat(url);
            if (imgFormat == ".jpg" || imgFormat == ".jpeg") {
                return true;
            } else {
                return false;
            }
        },
        isDomainSupport: function(url) {
            //域名支持
            var reg = /\/((img([1-3]|[5-9]|1[0-9]|2[0-8]|3[0-9]|4[0-5])|m\.imgx|v\.img|webpic)\.pplive\.cn|(img(1|[5-9]|1[0-9]|2[0-8])|res[1-4]?|sr[1-9]|img\.bkm)\.pplive\.com|(m\.imgx|focus)\.pptv\.com)\//;
            return reg.test(url);
        },
        splitUrl: function(url) {
            //http://sr1.pplive.com/cms/13/48/6aca0ee5be6a5f29861a2bfe90b26c5d.jpg
            //http://sr1.pplive.com/cms/13/48/6aca0ee5be6a5f29861a2bfe90b26c5d.jpg?id=88908
            //http://sr1.pplive.com/cms/13/48/6aca0ee5be6a5f29861a2bfe90b26c5d.jpg#88908
            var n = url.search(/\?|\#/);
            if (n == -1) {
                return [ url ];
            }
            return [ url.substr(0, n), url.substr(n) ];
        },
        getWebp: function(url) {
            //如果url带参数，将参数分离
            //检测浏览器是否支持
            //检测图片格式是否支持
            //检测图片域名是否支持
            if (!this.isBrowserSupport()) {
                return url;
            }
            var urlArray = this.splitUrl(url);
            if (!this.isFormatSupport(urlArray[0])) {
                return url;
            }
            if (!this.isDomainSupport(urlArray[0])) {
                return url;
            }
            urlArray[0] = urlArray[0] + ".webp";
            return urlArray.join("");
        }
    };
    return Webp;
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

define("app/pc/playpage/programList", [ "core/jquery/1.8.3/jquery", "app/pc/index/group", "core/underscore/1.8.3/underscore", "app/pc/index/group-controller", "util/function/delay", "util/event/event-aggregator", "util/loader/loader", "util/log/log", "util/platform/plt", "util/browser/browser", "util/net/urlquery", "util/linkcfg/interfaceurl", "util/scroller/scroller", "util/event/event-mouse-wheel" ], function(require, exports) {
    var username = window.username;
    if (!username) {
        return false;
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
    var $ = require("core/jquery/1.8.3/jquery");
    var Group = require("app/pc/index/group");
    var GroupController = require("app/pc/index/group-controller");
    var EventAggregator = require("util/event/event-aggregator");
    var loader = require("util/loader/loader");
    var urls = require("util/linkcfg/interfaceurl");
    require("util/scroller/scroller");
    var _ = require("core/underscore/1.8.3/underscore");
    // 视频分组方法
    var $wrap_preload;
    var collection = [];
    var title;
    var totalPage;
    var pageSize;
    var singleIdParam;
    var singleId = webcfg["id"];
    var pageIdx;
    var scroller;
    var isRirect = true;
    /*视频分组方法*/
    var groupCreater = {
        group_episode: function(page, pageSize, total) {
            var groupArray = [];
            var section = pageSize;
            var totalIndex = Math.ceil(total / pageSize);
            for (var i = 0; i < totalIndex; i++) {
                var from = section * i + 1;
                var to = section * (i + 1);
                if (to > total) {
                    to = total;
                }
                var title = from + "-" + to;
                var activePage = totalIndex - page;
                // console.log(activePage);
                groupArray[groupArray.length] = {
                    page: groupArray.length + 1,
                    title: title,
                    url: "",
                    data: []
                };
                for (var j = section * i; j < section * (i + 1); j++) {
                    if (!j) {
                        continue;
                    }
                    var data = groupArray[groupArray.length - 1].data;
                    data[data.length] = j;
                }
            }
            groupArray.reverse();
            var groups = _.map(groupArray, function(n) {
                var g = new Group(n);
                return new Group(n);
            });
            log("剧集分组：", groups);
            return groups;
        }
    };
    var $container = $("#player-sidebar");
    function renderGroup(page, pageSize, total, type) {
        var ea = new EventAggregator();
        if (pageSize >= total) {
            $wrap_preload.find("div.numbox").hide();
            return;
        } else {
            $wrap_preload.find("div.numbox").show();
        }
        var groupController = new GroupController(groupCreater.group_episode(page, pageSize, total), {
            eventAggregator: ea,
            $container: $wrap_preload.find("div.subnum"),
            $containerMore: $wrap_preload.find("div.morenum"),
            render: function($container, data) {
                $container.append(_.template("<% _.each(data, function(n, i){%>" + '<a href="javascript:void(0);" title="" <% if(n.active){print(\'class="now"\')} %>><%= n.title %></a>' + "<% }); %>")({
                    data: data
                }));
                return $container.find("a:last");
            },
            renderMore: function($containerMore, data) {
                $containerMore.append(_.template("<% _.each(data, function(n, i){%>" + '<a href="javascript:void(0);" title="<%= n.title %>" <% if(n.active){print(\'class="now"\')} %>><%= n.title %></a>' + "<% }); %>")({
                    data: data
                }));
            }
        });
        groupController.init({
            page: page
        });
        var sunBtns = $container.find(".numbox a").not(".more");
        sunBtns.removeClass("now");
        var curActiveBtn = sunBtns.eq(page);
        curActiveBtn.addClass("now");
        if (page < 3) {
            $(".subnum .more").removeClass("now");
        } else {
            $(".subnum .more").html(curActiveBtn.text() + "<i></i>");
            $(".subnum .more").addClass("now");
        }
        sunBtns.on("click", function() {
            var $obj = $(this);
            var sliceArr = $obj.text().split("-");
            var idx = sunBtns.index($obj);
            var renderCollection = collection.slice(sliceArr[0] - 1, sliceArr[1]);
            renderCollections(renderCollection, idx);
            if (idx < 3) {
                $(".subnum .more").removeClass("now");
            }
            sunBtns.removeClass("now");
            $obj.addClass("now");
        });
    }
    function renderCollections(renderCollection, page, first) {
        var videos = renderCollection;
        var template_container = '<div class="module-video-program-1408">' + '<div class="plist">' + // '<h3 title="<%= title %>"><%= title %></h3>' +
        '<div class="tabcon">' + '<div class="collection-wrap" data-scroller-class="ui-resp-pics">' + '<div class="numbox">' + '<div class="subnum cf"></div>' + '<div class="morenum cf"></div>' + "</div>" + '<div class="ui-resp-pics ui-80x45 cf v-container">' + "<ul><!-- template_item --></ul>" + "</div>" + "</div>" + "</div>" + "</div><!-- plist end -->" + "</div>";
        var template_video = '<li  id="video-<%= id %>" data-index="<%= count %>">' + '<a href="<%=link %>" title="<%= title %>" class="ui-list-ct" data-id="<%= id %>">' + '<dl class="cf">' + "<dt>" + '<img src="<%= picurl %>">' + "<i></i>" + "</dt>" + "<dd>" + '<p class="main-tt"><%= title %></p>' + "</dd>" + "<dd>" + '<p class="singer"><%= real_name %></p>' + "</dd>" + "</dl>" + "</a>" + "</li>";
        if (!$wrap_preload) {
            $wrap_preload = $(_.template(template_container)({
                title: title
            }));
            $container.append($wrap_preload);
        }
        //取username不对
        var domRealName = $.trim($(".module-info p:first a").html());
        var html = _.map(videos, function(video, i) {
            video.count = i + pageSize * (totalPage - page - 1);
            video.real_name = domRealName;
            var tempFunc = _.template(template_video);
            return tempFunc(video);
        }).join("");
        var maxHeight = $container.height() - $(".subnum").outerHeight() + 35;
        var option = {
            wheelPixel: 8,
            maxHeight: maxHeight,
            horizontal: false,
            slideBlockSelector: "ul",
            autoWrap: false,
            animate: true
        };
        $container.find("ul").html(html);
        scroller = $container.find(".ui-resp-pics").ppScroller(option).scroll();
        $.subscribe1("player.resize", resizeSideBar);
        //设定timer，不然ie6要崩溃
        var resiseTimer = null;
        function resizeSideBar() {
            if (resiseTimer != null) {
                clearTimeout(resiseTimer);
                resiseTimer = null;
            }
            resiseTimer = setTimeout(function() {
                var maxHeight = $container.height() - $(".subnum").outerHeight() + $("#vod-barrage").height();
                var nowBtn = $container.find("li.now");
                var option = {
                    wheelPixel: 8,
                    maxHeight: maxHeight,
                    horizontal: false,
                    slideBlockSelector: "ul",
                    autoWrap: false,
                    animate: false
                };
                scroller.destory();
                scroller = $container.find(".ui-resp-pics").ppScroller(option).scroll();
                scroller.scrollTo(nowBtn.position().top);
            }, 500);
        }
        var btns = $container.find("li");
        $container.find(".ui-resp-pics a").on("click", function(e) {
            e.preventDefault();
            if (!!isRirect) {
                var btn = $(this);
                var tempHref = btn.attr("href");
                window.location = tempHref;
            } else {
                var btn = $(this);
                var parent = btn.parent();
                if (!parent.hasClass("now")) {
                    var index = btn.attr("data-id");
                    scroller.scrollTo(btn.parent().position().top);
                    //播放视频，第二个参数表示没什么作用
                    player.goToAndPlay(index);
                    btns.removeClass("now");
                    parent.addClass("now");
                }
            }
        });
        //默认play 第一个
        if (!!first) {
            if (typeof singleIdParam != "undefined") {
                var curBtn = $("#video-" + singleId);
                var idx = curBtn.find("a").attr("data-id");
                curBtn.addClass("now");
            } else {
                var curBtn = btns.eq(0);
                curBtn.addClass("now");
                var idx = curBtn.find("a").attr("data-id");
            }
            //解决 chrome自动屏蔽插件导致用户不点视频，进而导致无法播放的问题
            if (player.isReady == true) {
                scroller.scrollTo(curBtn.position().top);
            } else {
                var timerInterval = setInterval(function() {
                    if (player.isReady == true) {
                        clearInterval(timerInterval);
                        timerInterval = null;
                        player.goToAndPlay(idx);
                    }
                }, 1e3);
            }
            player.onRegister("nextvideo", function() {
                var $list = $container.find(".ui-resp-pics");
                var curIndex = $list.find("li.now");
                var next = curIndex.next();
                var numboxVisible = true;
                if ($container.find(".numbox").css("display") == "none") {
                    numboxVisible = false;
                }
                //没有分页的btn,但是是最后一集
                if (next.length == 0 && numboxVisible == false) {
                    next = $list.find("li").first();
                    if (!!isRirect) {
                        nextIdx = next.find("a");
                        window.location = nextIdx.attr("href");
                    } else {
                        nextIdx = next.find("a").attr("data-id");
                        curIndex.removeClass("now");
                        next.addClass("now");
                        //console.log(nextIdx);
                        player.goToAndPlay(nextIdx);
                    }
                } else if (next.length == 0 && numboxVisible == true) {
                    var sunBtns = $container.find(".numbox a").not(".more");
                    //console.log(sunBtns);
                    var nowBtn = $container.find(".numbox a.now").not(".more");
                    //console.log('nowBtn',nowBtn);
                    var curIdx = sunBtns.index(nowBtn);
                    //console.log(curIdx);
                    var nextMoreBtn = sunBtns.eq(curIdx - 1);
                    nextMoreBtn.trigger("click");
                    var nextbtn = $container.find(".ui-resp-pics li").last();
                    if (!!isRirect) {
                        var playIdx = nextbtn.find("a");
                        window.location = playIdx.attr("href");
                    } else {
                        var playIdx = nextbtn.find("a").attr("data-id");
                        nextbtn.addClass("now");
                        player.goToAndPlay(playIdx);
                    }
                } else {
                    //正常下一集的逻辑
                    if (!!isRirect) {
                        var nextIdx = next.find("a");
                        window.location = nextIdx.attr("href");
                    } else {
                        curIndex.removeClass("now");
                        next.addClass("now");
                        var nextIdx = next.find("a").attr("data-id");
                        player.goToAndPlay(nextIdx);
                    }
                }
            });
        }
    }
    var returnObj;
    var tempData = {
        username: username,
        scope: window.game_scope
    };
    tempData.__config__ = {
        cdn: true,
        callback: "updatePlayerList"
    };
    tempData.plt = "pc";
    var params = {};
    loader.load(urls["interface"]["videoList"], tempData, function(data) {
        if (data.err == "0") {
            var data = data.data;
            if (!$.isEmptyObject(data.info)) {
                var returnObj = data.info;
                var newObj = {};
                _.each(returnObj, function(obj, key) {
                    if (obj.status == 1) {
                        newObj[key] = obj;
                    }
                });
                returnObj = newObj;
                //console.log(returnObj);
                /*returnObj={};
				//都是假数据
				for(i=0;i<500;i++){
					returnObj[i]={};
				}*/
                // 列表collection
                var page = 0;
                var specialPage;
                var singleIdx;
                //console.log(returnObj);
                //collection 需要额外处理
                for (var key in returnObj) {
                    var tempInfo = returnObj[key]["dpinfo"];
                    var tempObj = {};
                    //用户真实姓名
                    /*tempObj.real_name=returnObj[key].playerinfo.real_name;
					tempObj.picurl=returnObj[key].dpinfo.picurl;
					tempObj.title=returnObj[key].dpinfo.title;
					tempObj.id=returnObj[key].cid;*/
                    // fake json
                    //tempObj.real_name=returnObj[key]['playerinfo']['real_name'];
                    tempObj.picurl = tempInfo["picurl"];
                    tempObj.title = tempInfo["title"];
                    tempObj.type = returnObj[key]["type"];
                    tempObj.id = key;
                    if (!!isClient) {
                        tempObj.link = returnObj[key]["pc_link"];
                    } else {
                        tempObj.link = returnObj[key]["web_link"];
                    }
                    //tempObj.id=webcfg['id'];
                    //tempObj.id=17534497;
                    collection.push(tempObj);
                }
                var groupObj = _.groupBy(collection, function(obj) {
                    return obj.type;
                });
                var tempCollection = _.sortBy(groupObj, function(obj, key) {
                    return -key;
                });
                //console.log(tempCollection);
                collection = _.flatten(tempCollection);
                //console.log('collection',collection);
                //整理collection结束
                pageSize = data.pageSize ? data.pageSize : params.pageSize ? params.pageSize : 100;
                var total = collection.length;
                totalPage = Math.ceil(total / pageSize);
                var playList = _.map(collection, function(video, idx) {
                    //传入的必须是string 类型，不然就会报错
                    //console.log(video);
                    //console.log('singleId',singleId);
                    if (!!singleId && video.id == singleId) {
                        //console.log("找到id");
                        singleIdParam = video.id;
                        singleIdx = idx;
                        pageIdx = Math.floor(singleIdx / pageSize);
                        specialPage = totalPage - 1 - pageIdx;
                    }
                    return video.id.toString();
                });
                if (!!singleIdParam) {
                    player.resetList(playList, singleIdParam);
                } else {
                    player.resetList(playList, playList[0]);
                }
                var renderFirstCollection;
                if (total > pageSize) {
                    var size;
                    if ((size = -total % pageSize) == 0) {
                        size = -pageSize;
                    }
                    renderFirstCollection = collection.slice(size);
                } else {
                    renderFirstCollection = collection;
                }
                if (typeof specialPage != "undefined") {
                    page = specialPage;
                    renderFirstCollection = collection.slice(pageIdx * pageSize, (pageIdx + 1) * pageSize);
                }
                renderCollections(renderFirstCollection, page, true);
                renderGroup(page, pageSize, total, "collections");
            }
        }
    });
});

define("app/pc/index/group", [ "core/underscore/1.8.3/underscore" ], function(require, exports) {
    var _ = require("core/underscore/1.8.3/underscore");
    function Group(info) {
        _.extend(this, info);
    }
    _.extend(Group.prototype, {
        next: function() {},
        prev: function() {}
    });
    return Group;
});

define("app/pc/index/group-controller", [ "core/jquery/1.8.3/jquery", "core/underscore/1.8.3/underscore", "util/function/delay" ], function(require, exports) {
    var $ = require("core/jquery/1.8.3/jquery");
    var _ = require("core/underscore/1.8.3/underscore");
    var delay = require("util/function/delay");
    function GroupController(lists, option) {
        var self = this;
        var groups = this.groups = [];
        var self = this;
        var opt = _.extend(this, {
            activeClassName: "now",
            //active class
            tabTagName: "a",
            //tagName, for binding event
            tabMoreTagName: "a",
            //more tagName, for binding event
            $container: $(),
            //jquery object, the container of visible buttons
            $containerMore: $(),
            //jquery object, the container of hidden buttons
            showCount: 4,
            //count of visible buttons
            /*
			 * render [create group tabs]
			 * @param $container
			 * @param show tabs [object array]
			 * @return $btn [last tab]
			 */
            render: $.noop,
            /*
			 * renderMore [create group more]
			 * @param $container
			 * @param more group [object array]
			 */
            renderMore: $.noop
        }, option);
        this.groups = lists;
        /**
		 * [description]
		 * @param  {Function} callback
		 * @param  {int}   correction [index修正]
		 */
        this.eventAggregator && this.eventAggregator.subscribe("openNextPage", function(callback, correction) {
            var correction = correction || 0;
            //index修正，用于直播播放0点时重新读取当天数据
            //播放下一页第一集
            var index;
            //当前分组的index
            _.find(self.groups, function(n, i) {
                index = i;
                return n.active;
            });
            var callbacks = $.Callbacks();
            callbacks.add(function() {
                //先播放当前页视频
                // self.eventAggregator.publish('playCurrentPage');
                //在执行回调（刷新分页）
                callback && callback(index - 1);
            });
            if (index - 1 >= 0) {
                self._onSelect(index - 1 - correction, callbacks);
            } else {
                log("[group-controller] 没有下一集");
            }
        });
    }
    GroupController.prototype = {
        init: function(options) {
            var self = this;
            /**
			 * [option description]
			 * @page {[int]}
			 */
            var option = $.extend({
                page: this.groups.length - 1
            }, options);
            /*定义激活组*/
            var page = option.page;
            _.each(this.groups, function(n, i) {
                n.active = n.page == page ? true : false;
            });
            /* 渲染显示的group */
            var dataMore = this.groups.slice(0, this.showCount);
            var current = _.find(dataMore, function(s, i) {
                if (s.active == true) {
                    self.activeIndex = i;
                    return true;
                }
            });
            this.btn = this.render(this.$container, this.groups.slice(0, this.showCount));
            this.$container.find(this.tabTagName).each(function(i) {
                $(this).on("click", function(e) {
                    self.onSelectHandler(i);
                });
            });
            /* 渲染更多的group */
            var dataMore1 = this.groups.slice(this.showCount - 1);
            var current1 = _.find(dataMore1, function(s, i) {
                if (s.active == true) {
                    self.activeIndex = i + self.showCount - 1;
                    return true;
                }
            });
            this.renderMore(this.$containerMore.hide(), dataMore1);
            this.$containerMore.find(this.tabMoreTagName).each(function(i) {
                $(this).on("click", function(e) {
                    self.onSelectHandler(i + self.showCount - 1);
                });
            });
            /*渲染more按钮，并绑定事件*/
            if (this.groups.length > this.showCount) {
                this.btn.html(this.btn.html() + "<i></i>").addClass("more");
                this._eventBindMore();
            }
            /*激活页在more中，修改more按钮*/
            if (current1) {
                this.btn.html(current1.title + "<i></i>").addClass(this.activeClassName);
            }
        },
        /**
		 * [_eventBindMore bind events in more groups]
		 */
        _eventBindMore: function() {
            var self = this;
            /* 事件绑定 */
            this.btn.off("click").on("click", function(e) {
                if (self.btn.hasClass("morehover")) {
                    self._closeMore();
                } else {
                    self._openMore();
                }
            });
            var hide = delay(function() {
                self._closeMore();
            });
            this.btn.on("mouseleave", function(e) {
                hide();
            }).on("mouseenter", function(e) {
                hide.cancel();
            });
            this.$containerMore.on("mouseleave", function(e) {
                hide();
            }).on("mouseenter", function(e) {
                hide.cancel();
            });
        },
        _openMore: function() {
            // console.log('open');
            if (!!this.btn) {
                this.btn.addClass("morehover");
                this.$containerMore.show();
            }
        },
        _closeMore: function() {
            // console.log('close');
            if (!!this.btn) {
                this.btn.removeClass("morehover");
                this.$containerMore.hide();
            }
        },
        /**
		 * [_onSelect active the group]
		 * @param  {int} i    [the index of the active group]
		 * @param  {object} callbacks [$.Callbacks()]
		 */
        onSelectHandler: function(i, callbacks) {
            if (this.activeIndex != i) {
                this._onSelect(i, callbacks || $.Callbacks());
            }
        },
        _onSelect: function(i, callbacks) {
            var self = this;
            /*change the active group*/
            _.each(this.groups, function(n, j) {
                n.active = i == j ? true : false;
            });
            this.activeIndex = i;
            /*render the active group*/
            this._activeGroupByIndex(i);
            /*publish event for load now page data*/
            this.eventAggregator && this.eventAggregator.publish("changePage", self.groups[i], callbacks);
            this._closeMore();
        },
        _activeGroupByIndex: function(i) {
            var cn = this.activeClassName;
            this.$container.find(this.tabTagName).removeClass(cn);
            this.$containerMore.find(this.tabMoreTagName).removeClass(cn);
            if (i < this.showCount - 1) {
                /*in visible groups*/
                if (!!this.btn) {
                    this.btn.removeClass("now");
                    this.$container.find(this.tabTagName).eq(i).addClass(cn);
                }
            } else {
                /*in hidden groups*/
                if (!!this.btn) {
                    this.btn.addClass("now");
                    var title = this.$containerMore.find(this.tabMoreTagName).eq(i - this.showCount + 1).addClass(cn).attr("title");
                    this.btn.html(title + "<i></i>");
                }
            }
        }
    };
    return GroupController;
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

define("util/event/event-aggregator", [], function(require, exports) {
    var toString = Object.prototype.toString;
    var debug = location.href.indexOf("debug=events") > -1;
    function Event(name) {
        this.handlers = [];
        this.name = name;
    }
    Event.prototype = {
        getName: function() {
            return this.name;
        },
        addHandler: function(handler) {
            this.handlers.push(handler);
        },
        removeHandler: function(handler) {
            for (var i = 0; i < this.handlers.length; i++) {
                if (this.handlers[i] == handler) {
                    this.handlers.splice(i, 1);
                    break;
                }
            }
        },
        fire: function(eventArg1, eventArg2, eventArg3) {
            for (var i = 0, len = this.handlers.length; i < len; i++) {
                this.handlers[i](eventArg1, eventArg2, eventArg3);
            }
        }
    };
    function EventAggregator() {
        this.events = [];
    }
    EventAggregator.prototype = {
        _getEvent: function(eventName) {
            var names = [];
            for (var i = 0, len = this.events.length; i < len; i++) {
                var name = this.events[i].getName();
                if (name === eventName) {
                    names.push(this.events[i]);
                } else if (name.indexOf(eventName) === 0 && name.substr(eventName.length)[0] == ".") {
                    names.push(this.events[i]);
                }
            }
            return names;
        },
        publish: function(eventName, eventArg1, eventArg2, eventArg3) {
            var events = this._getEvent(eventName), event, i;
            if (!events.length) {
                event = new Event(eventName);
                this.events.push(event);
                events.push(event);
            }
            if (debug) {
                console.log("publish ------->", eventName, "(" + events.length + " receive)");
            }
            for (i = 0; evt = events[i++]; ) {
                evt.fire(eventArg1, eventArg2, eventArg3);
            }
        },
        subscribe: function(eventName, handler) {
            var events = this._getEvent(eventName), event, i;
            if (!events.length) {
                event = new Event(eventName);
                this.events.push(event);
                events.push(event);
            }
            if (debug) {
                console.log("subscribe <-----", eventName);
            }
            for (i = 0; evt = events[i++]; ) {
                evt.addHandler(handler);
            }
        },
        unSubscribe: function(eventName, handler) {
            var events = this._getEvent(eventName), event, i;
            if (!events.length) {
                event = new Event(eventName);
                this.events.push(event);
                events.push(event);
            }
            for (i = 0; evt = events[i++]; ) {
                evt.removeHandler(handler);
            }
        }
    };
    EventAggregator.prototype.on = EventAggregator.prototype.subscribe;
    EventAggregator.prototype.off = EventAggregator.prototype.unSubscribe;
    EventAggregator.prototype.trigger = EventAggregator.prototype.publish;
    EventAggregator.prototype.once = function(eventName, handler) {
        var self = this;
        var once = function() {
            self.off(eventName, handler);
            handler();
        };
        this.on(eventName, once);
    };
    return EventAggregator;
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

/**
 * @info:自定义滚动轴
 * @auth:yanyang
 * @email:yyfireman@163.com
 * @exmaple:
 *     $('#selecter').ppScroll().scroll();
 * @TODO
 *     return scroller document with event binding.
  **/
define("util/scroller/scroller", [ "core/underscore/1.8.3/underscore", "core/jquery/1.8.3/jquery", "util/event/event-mouse-wheel" ], function(require, exports) {
    var _ = require("core/underscore/1.8.3/underscore");
    var $ = require("core/jquery/1.8.3/jquery");
    var isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry/i.test(navigator.userAgent);
    require("util/event/event-mouse-wheel");
    require("util/scroller/scroller.css");
    var SHASH = {};
    //自定义滚动轴
    $.fn.ppScroller = function(option) {
        var _this = $(this);
        var opt = $.extend({
            maxHeight: 0,
            maxWidth: 0,
            horizontal: false,
            showScroller: true,
            wheelPixel: 8,
            animate: false,
            mouseWheel: true,
            autoWrap: false,
            slideBlockSelector: null,
            onScroll: function(index, scroll, location) {}
        }, option);
        var _onScroll = opt.onScroll;
        var _a, _b, _range;
        /**
         * [onScroll 滚动监听 - fix 负数问题]
         * @param  {[int]} a     [滚动序号]
         * @param  {[int]} b     [滚动距离]
         * @param  {[int]} range [可滚动距离]
         */
        opt.onScroll = function(a, b, range) {
            var a = parseInt(Math.abs(a));
            var b = parseInt(Math.abs(b));
            var range = Math.abs(b) === 0 ? 0 : Math.abs(b) / range;
            if ((a !== _a || b !== _b || range !== _range) && !isNaN(a + b + range)) {
                _onScroll(a, b, range);
                _a = a;
                _b = b;
                _range = range;
            }
        };
        /* 动画处理 */
        var doChange = opt.animate ? function($obj, attr, v) {
            var a = {};
            a[attr] = v;
            $obj.stop()["animate"](a);
        } : function($obj, attr, v) {
            $obj["css"](attr, v);
        };
        var max = !opt.horizontal ? opt.maxHeight || _this.height() : opt.maxWidth || _this.width();
        return _this.each(function() {
            var sid = parseInt(Math.random() * 1e6);
            if (!_this.attr("data-scroller-sid")) {
                _this.attr("data-scroller-sid", sid);
            } else {
                sid = _this.attr("data-scroller-sid");
                SHASH[sid].destory();
            }
            SHASH[sid] = _this;
            var Handler = {};
            var scrollHandler = $.Callbacks();
            _this.addClass("pp-scroller-container");
            if (opt.horizontal) {
                _this.addClass("pp-scroller-container-h");
            }
            var scroller;
            var inner, $temp;
            if (opt.slideBlockSelector) {
                inner = _this.find(opt.slideBlockSelector);
            } else {
                inner = _this.children(":first");
            }
            if (opt.autoWrap) {
                $temp = $("<div>").appendTo(_this);
                $temp.append(inner);
                inner = $temp;
            }
            inner.eq(0).css({
                position: "relative",
                height: inner.eq(0).height()
            });
            /* 计算宽度 */
            if (opt.horizontal) {
                var width = 0;
                inner.children().each(function(i, n) {
                    width += $(n).outerWidth(true);
                });
                inner.width(width);
            }
            /* 移动端使用默认的滚动轴 */
            if (isMobile) {
                _this.height(max).css(!opt.horizontal ? {
                    overflowY: "scroll",
                    overflowX: "hidden"
                } : {
                    overflowX: "scroll",
                    overflowY: "hidden"
                });
                _this.scroll = _this.destory = this.pause = function() {
                    return _this;
                };
                _this.scrollTo = function(xy, cb) {
                    var xy = parseInt(xy);
                    if (!opt.horizontal) {
                        _this.scrollTop(xy);
                    } else {
                        _this.scrollLeft(xy);
                    }
                    cb && cb();
                    return _this;
                };
                _this.scrollTo1 = function(i, cb) {
                    var xy = parseInt(opt.wheelPixel * i);
                    if (!opt.horizontal) {
                        _this.scrollTop(xy);
                    } else {
                        _this.scrollLeft(xy);
                    }
                    cb && cb();
                    return _this;
                };
                var scrollRange = !opt.horizontal ? inner.outerHeight() - max : inner.outerWidth() - max;
                var spaceing = parseInt(scrollRange / opt.wheelPixel);
                // 间隔数
                _this.on("scroll", function(e) {
                    opt.onScroll(parseInt(scrollRange / opt.wheelPixel), this.scrollTop, scrollRange);
                });
                // opt.onScroll = function(a, b, range){
                //     _onScroll(Math.abs(a), Math.abs(b), Math.abs(b) / range);
                // }
                return _this;
            }
            var offsetXY, // 鼠标按下按钮offset
            mouseXY, // 鼠标按下位置
            mkey = false, // 拖拽开关
            skey = false, // 初始化开关
            scale, // 容器 / 内容总宽高
            total, // 内容总宽高
            btn, // 滚动轴按钮
            scrollRange = !opt.horizontal ? inner.outerHeight() - max : inner.outerWidth() - max, spaceing = parseInt(scrollRange / opt.wheelPixel);
            var index = 0;
            /*
             * stop trigger de event handler when the scroller reach both sides;
             */
            if (opt.mouseWheel) {
                Handler.container_mousewheel = !opt.horizontal ? function(e, y) {
                    if (skey) {
                        index += y;
                        var top = -opt.wheelPixel * index;
                        if (index > 0) {
                            top = 0;
                            index = 0;
                        } else if (-index > spaceing) {
                            top = -max + inner.outerHeight();
                            index = -spaceing;
                        }
                        doChange(btn, "top", top * scale);
                        doChange(inner, "top", -top);
                        opt.onScroll(index, top, scrollRange);
                        return false;
                    }
                } : function(e, y) {
                    if (skey) {
                        index += y;
                        var left = -opt.wheelPixel * index;
                        if (index > 0) {
                            left = 0;
                            index = 0;
                        } else if (-index >= spaceing) {
                            left = -max + inner.outerWidth();
                            index = -spaceing;
                        }
                        doChange(btn, "left", left * scale);
                        doChange(inner, "left", -left);
                        opt.onScroll(index, left, scrollRange);
                        return false;
                    }
                };
                Handler.container_mousewheel_t = _this;
                _this.on("mousewheel", Handler.container_mousewheel);
            }
            scroller = $('<div class="pp-scroller">' + '<div style=""></div></div>');
            Handler.btn_mousedown = !opt.horizontal ? function(e) {
                mkey = true;
                mouseXY = parseInt(e.pageY);
                offsetXY = parseInt($(this).position().top);
                return false;
            } : function(e) {
                mkey = true;
                mouseXY = parseInt(e.pageX);
                offsetXY = parseInt($(this).position().left);
                return false;
            };
            btn = scroller.find("div").on("mousedown", Handler.btn_mousedown);
            Handler.btn_mousedown_t = btn;
            var btnWH;
            Handler.scroller_mousedown = !opt.horizontal ? function(e) {
                mkey = true;
                mouseXY = parseInt(e.pageY);
                offsetXY = parseInt(mouseXY - scroller.offset().top - btnWH / 2);
                $(document).trigger("mousemove", [ e.pageY ]);
            } : function(e) {
                mkey = true;
                mouseXY = parseInt(e.pageX);
                offsetXY = parseInt(mouseXY - scroller.offset().left - btnWH / 2);
                $(document).trigger("mousemove", [ e.pageX ]);
            };
            Handler.scroller_mousedown_t = scroller;
            scroller.appendTo(_this).on("mousedown", Handler.scroller_mousedown);
            Handler.document_mousemove = function(e, pageXY) {
                if (mkey) {
                    ss(parseInt((!opt.horizontal ? e.pageY : e.pageX) || pageXY));
                }
            };
            Handler.document_mousemove_t = $(document);
            Handler.document_mouseup = function(e) {
                mkey = false;
            };
            Handler.document_mouseup_t = $(document);
            Handler.document_selectstart = function(e) {
                if (mkey) {
                    e.preventDefault();
                }
            };
            Handler.document_selectstart_t = $(document);
            $(document).on("mousemove", Handler.document_mousemove).on("mouseup", Handler.document_mouseup).on("selectstart", Handler.document_selectstart);
            var offsetTop = parseInt($(_this).find(".pp-scroller").css("top")) / 2;
            var ss = !opt.horizontal ? function(pageY) {
                //                    console.log('btn',btn);
                var btnOffset = offsetXY + pageY - mouseXY;
                if (btnOffset <= 0) {
                    btnOffset = 0;
                } else if (btnOffset + parseInt(btn.outerHeight()) >= max - offsetTop) {
                    btnOffset = max - btn.outerHeight() - offsetTop;
                }
                index = -(btnOffset / scale / opt.wheelPixel);
                btn.css("top", btnOffset);
                inner.css("top", -btnOffset / scale);
                opt.onScroll(index, -btnOffset / scale, scrollRange);
            } : function(pageX) {
                var btnOffset = offsetXY + pageX - mouseXY;
                if (btnOffset <= 0) {
                    btnOffset = 0;
                } else if (btnOffset + parseInt(btn.outerWidth()) >= max) {
                    btnOffset = max - btn.outerWidth();
                }
                index = -(btnOffset / scale / opt.wheelPixel);
                btn.css("left", btnOffset);
                inner.css("left", -btnOffset / scale);
                opt.onScroll(index, -btnOffset / scale, scrollRange);
            };
            _this.scroll = function() {
                return function() {
                    _this.height("auto");
                    total = !opt.horizontal ? inner.height() : inner.width();
                    btn.css(!opt.horizontal ? "top" : "left", 0);
                    inner.css(!opt.horizontal ? "top" : "left", 0);
                    if (total <= max) {
                        skey = false;
                        scroller.hide();
                        if (!opt.horizontal) {
                            _this.height(max);
                        } else {
                            _this.width(max);
                        }
                    } else {
                        skey = true;
                        scale = max / total;
                        if (!opt.showScroller) {
                            scroller.css("visibility", "hidden");
                        }
                        if (!opt.horizontal) {
                            _this.height(max).css("overflow", "hidden");
                            scroller.show().height(max - 10).find("div").height(max * scale - 10);
                            inner.css("top", 0);
                        } else {
                            _this.width(max).css("overflow", "hidden");
                            scroller.show().width(max).find("div").width(max * scale);
                            inner.css("left", 0);
                        }
                    }
                    btnWH = !opt.horizontal ? btn.height() : btn.width();
                    return _this;
                };
            }();
            _this.scrollTo = function(xy, cb) {
                var xy = parseInt(xy);
                if (xy <= 0 || total < max) {
                    xy = 0;
                } else if (xy >= total - max) {
                    xy = total - max;
                }
                index = -(xy / opt.wheelPixel);
                doChange(btn, !opt.horizontal ? "top" : "left", xy * scale);
                doChange(inner, !opt.horizontal ? "top" : "left", -xy);
                opt.onScroll(index, -xy, scrollRange);
                cb && cb();
                return _this;
            };
            _this.scrollTo1 = function(i, cb) {
                var xy = parseInt(opt.wheelPixel * i);
                if (xy <= 0 || total < max) {
                    xy = 0;
                } else if (xy >= total - max) {
                    xy = total - max;
                }
                doChange(btn, !opt.horizontal ? "top" : "left", xy * scale);
                doChange(inner, !opt.horizontal ? "top" : "left", -xy);
                opt.onScroll(i, -xy, scrollRange);
                cb && cb();
                return _this;
            };
            _this.pause = Handler.pause;
            _this.destory = function() {
                for (var n in Handler) {
                    if (!/_t$/.test(n) && Handler[n + "_t"]) {
                        Handler[n + "_t"].off(n.replace(/.+_/, ""), Handler[n]);
                        Handler[n + "_t"] = null;
                        Handler[n] = null;
                    }
                }
                if (!opt.horizontal) {
                    _this.height("");
                } else {
                    _this.width("");
                }
                scroller.remove();
            };
            return _this;
        });
    };
});

/**
 * @info:自定义滚动轴
 * @auth:yanyang
 * @email:yyfireman@163.com
 * @exmaple:
 *      $('#selecter').ppScroll().scroll();
 **/
define("util/event/event-mouse-wheel", [ "core/jquery/1.8.3/jquery" ], function(require, exports) {
    var $ = require("core/jquery/1.8.3/jquery");
    // 鼠标中键
    (function($) {
        var types = [ "DOMMouseScroll", "mousewheel" ];
        $.event.special.mousewheel = {
            setup: function() {
                if (this.addEventListener) {
                    for (var i = types.length; i; ) {
                        this.addEventListener(types[--i], handler, false);
                    }
                } else {
                    this.onmousewheel = handler;
                }
            },
            teardown: function() {
                if (this.removeEventListener) {
                    for (var i = types.length; i; ) {
                        this.removeEventListener(types[--i], handler, false);
                    }
                } else {
                    this.onmousewheel = null;
                }
            }
        };
        $.fn.extend({
            mousewheel: function(fn) {
                return fn ? this.bind("mousewheel", fn) : this.trigger("mousewheel");
            },
            unmousewheel: function(fn) {
                return this.unbind("mousewheel", fn);
            }
        });
        function handler(event) {
            var orgEvent = event || window.event, args = [].slice.call(arguments, 1), delta = 0, returnValue = true, deltaX = 0, deltaY = 0;
            event = $.event.fix(orgEvent);
            event.type = "mousewheel";
            // Old school scrollwheel delta
            if (event.originalEvent.wheelDelta) {
                delta = event.originalEvent.wheelDelta / 120;
            }
            if (event.originalEvent.detail) {
                delta = -event.originalEvent.detail / 3;
            }
            // New school multidimensional scroll (touchpads) deltas
            deltaY = delta;
            // Gecko
            if (orgEvent.axis !== undefined && orgEvent.axis === orgEvent.HORIZONTAL_AXIS) {
                deltaY = 0;
                deltaX = -1 * delta;
            }
            // Webkit
            if (orgEvent.wheelDeltaY !== undefined) {
                deltaY = orgEvent.wheelDeltaY / 120;
            }
            if (orgEvent.wheelDeltaX !== undefined) {
                deltaX = -1 * orgEvent.wheelDeltaX / 120;
            }
            // Add event and delta to the front of the arguments
            args.unshift(event, delta, deltaX, deltaY);
            return $.event.handle.apply(this, args);
        }
    })($);
});

define("util/scroller/scroller.css", [], function() {
    seajs.importStyle(".pp-scroller-container{position:relative}.pp-scroller{display:none;box-sizing:border-box;width:8px;height:8px;border-radius:2px;background:#e6e6e6;position:absolute;right:0;top:0;overflow:hidden}.pp-scroller div{position:relative;box-sizing:border-box;border-radius:2px;width:8px;height:8px;background:#c5c5c5;border:1px solid #b4b4b4;position:absolute;right:0;top:0}.pp-scroller-container-h .pp-scroller{top:auto;bottom:0}.pp-scroller-container::-webkit-scrollbar{width:8px;background:#eee}.pp-scroller-container::-webkit-scrollbar-thumb{background:#ccc;border-radius:15px}.pp-scroller-container::-webkit-scrollbar-button{display:none}.pp-scroller-container::-webkit-scrollbar-track-piece{background:transparent}");
});

/**
 * @author  Erick Song
 * @email   ahschl0322@gmail.com
 * @info    评论模块整理
 */
define("util/comment/comment", [ "core/jquery/1.8.3/jquery", "util/cookie/cookie", "util/user/user", "client", "util/login/login" ], function(require, exports, modules) {
    var $ = require("core/jquery/1.8.3/jquery"), cookie = require("util/cookie/cookie"), user = require("util/user/user"), login = require("util/login/login");
    if ($.Comment) {
        return;
    }
    var _cmt_obj_index = 0;
    var loader = {
        load: function(opt) {
            var script = document.createElement("script");
            script.type = "text/javascript";
            script.src = opt.url;
            document.getElementsByTagName("head")[0].appendChild(script);
        }
    };
    var merge = function(o1, o2) {
        for (var o in o2) {
            o1[o] = o2[o];
        }
        return o1;
    };
    var VipStyle_ = "cursor:pointer;margin-top:5px;height: 10px;width: 20px;vertical-align:middle;overflow:hidden;display:inline-block;text-indent: -9999px;background:url(http://static9.pplive.cn/pptv/index/images/sprite.png) no-repeat;_background: url(http://static9.pplive.cn/pptv/index/images/sprite-ie6.png) no-repeat;", VipStyle = VipStyle_ + "background-position: -370px -169px;", VipStyleNO = VipStyle_ + "background-position: -370px -180px;", YearStyle_ = "margin-top:5px;width:13px;height:13px;margin-left:1px;cursor:pointer;display:inline-block;text-indent:-9999px;background:url(http://static9.pplive.cn/pptv/index/images/sprite.png) no-repeat;_background: url(http://static9.pplive.cn/pptv/index/images/sprite-ie6.png) no-repeat;", YearStyle = YearStyle_ + "vertical-align:middle;_vertical-align:-2px;background-position: -325px -246px;", YearStyleNO = YearStyle_ + "background-position: -345px -246px;";
    var UserIco = function(vip) {
        var viphtml, userName = user.info.UserName;
        var chtml = function(type, style) {
            if (type == "vip") {
                return '<a href="http://pay.vip.pptv.com/?plt=web&aid=commentviplogo&username=' + userName + '" target="_blank"><span style="float:left;' + style + '">vip</span></a>';
            } else {
                return '<a href="http://pay.vip.pptv.com/?plt=web&aid=commentyearlogo&username=' + userName + '" target="_blank"><span style="float:left;' + style + '">vip</span></a>';
            }
        };
        if (vip == 2) {
            viphtml = chtml("vip", VipStyle) + chtml("year", YearStyle);
        } else if (vip == 1) {
            viphtml = chtml("vip", VipStyle) + chtml("year", YearStyleNO);
        } else {
            viphtml = "";
        }
        return viphtml;
    };
    //comment中负责和服务器交互数据
    var dataModel = {
        getUrl: "http://comment.pptv.com/api/v1/show.json/",
        getReplyUrl: "http://comment.pptv.com/api/v1/reply.json/",
        postUrl: "http://p.comment.pptv.com/api/v1/comment.json/",
        voteUrl: "http://p.comment.pptv.com/api/v1/push.json",
        hotUrl: "http://comment.pptv.com/api/v1/hot.json/",
        singleUrl: "http://comment.pptv.com/api/v1/topic.json/",
        get: function(ids, page, pageSize, cb, tm, type) {
            //type 1是短评，2长评
            loader.load({
                url: dataModel.getUrl + "?ids=" + encodeURIComponent(ids) + "&pg=" + encodeURIComponent(page) + "&ps=" + encodeURIComponent(pageSize) + "&tm=" + encodeURIComponent(tm) + "&type=" + type + "&cb=" + cb
            });
        },
        post: function(ids, tgs, t, txt, pid, asy, tpc, ln, fb, cb) {
            loader.load({
                url: dataModel.postUrl + "?ids=" + encodeURIComponent(ids) + "&tgs=" + encodeURIComponent(tgs) + "&t=" + encodeURIComponent(t) + "&txt=" + encodeURIComponent(txt) + "&pid=" + encodeURIComponent(pid) + "&asy=" + encodeURIComponent(asy) + "&tpc=" + encodeURIComponent(tpc) + "&ln=" + encodeURIComponent(ln) + "&fb=" + encodeURIComponent(fb) + "&cb=" + cb
            });
        },
        vote: function(id, v, cb, tid) {
            loader.load({
                url: dataModel.voteUrl + "?id=" + encodeURIComponent(id) + "&tid=" + encodeURIComponent(tid) + "&v=" + encodeURIComponent(v) + "&cb=" + cb
            });
        },
        getReply: function(tid, id, tm, pg, ps, cb) {
            loader.load({
                url: dataModel.getReplyUrl + "?tid=" + encodeURIComponent(tid) + "&id=" + encodeURIComponent(id) + "&tm=" + encodeURIComponent(tm) + "&pg=" + encodeURIComponent(pg) + "&ps=" + encodeURIComponent(ps) + "&cb=" + cb
            });
        },
        getHot: function(id, type, cb) {
            loader.load({
                url: dataModel.hotUrl + "?id=" + encodeURIComponent(id) + "&type=" + type + "&cb=" + cb
            });
        },
        getSingle: function(id, cid, cb) {
            loader.load({
                url: dataModel.singleUrl + "?id=" + encodeURIComponent(id) + "&cid=" + cid + "&cb=" + cb
            });
        }
    };
    $.dataModel = dataModel;
    //CommentObject 对象
    var CommentObject = function(ids, tags, pageSize) {
        this.cmtIndex = "cmt_" + _cmt_obj_index;
        _cmt_obj_index++;
        if (ids[0]) {
            this.ids = ids;
        } else {
            this.ids = [ ids ];
        }
        this.tags = tags;
        this.et = 0;
        this.pageSize = pageSize || 10;
        this.fb = "";
        this.topic = encodeURIComponent(document.title);
        this.link = encodeURIComponent(window.location.href);
    };
    CommentObject.prototype = {
        constructor: CommentObject,
        getList: function(cb, page, type) {
            var self = this;
            dataModel.get(self.ids.join(","), page, self.pageSize, cb, self.et, type);
        },
        post: function(txt, asy, cb) {
            if (!this.tags) {
                this.tags = [];
            }
            dataModel.post(this.ids.join(","), this.tags.join(","), "", txt, "", asy, this.topic, this.link, this.fb, cb);
        },
        longPost: function() {},
        reply: function(pid, txt, asy, cb) {
            dataModel.post(this.ids, this.tags, "", txt, pid, asy, this.topic, this.link, this.fb, cb);
        },
        up: function(id, cb, tid) {
            if (tid) {
                dataModel.vote(id, 1, cb, tid);
            } else {
                dataModel.vote(id, 1, cb, this.ids[0]);
            }
        },
        down: function(id, cb, tid) {
            if (tid) {
                dataModel.vote(id, 2, cb, tid);
            } else {
                dataModel.vote(id, 2, cb, this.ids[0]);
            }
        },
        getReply: function(tid, id, pg, ps, cb) {
            dataModel.getReply(tid, id, this.et, pg, ps, cb);
        },
        getHot: function(type, cb) {
            dataModel.getHot(this.ids[0], type, cb);
        },
        getSingle: function(cid, cb) {
            dataModel.getSingle(this.ids[0], cid, cb);
        }
    };
    $.CommentObject = CommentObject;
    //counter
    var counter = function() {
        var counter = function(input, infoBox, max) {
            this.input = input;
            this.infoBox = infoBox;
            this.max = max || 300;
            this.over = false;
            //init
            var self = this, loop;
            if (!this.infoBox) {
                return;
            }
            $(input).on("focus", function() {
                var l;
                loop = setInterval(function() {
                    l = self.count();
                    if (l <= max) {
                        self.infoBox.html("还可输入<strong>" + (max - l) + "</strong>个字");
                        self.over = false;
                    } else {
                        self.infoBox.html("已超过<strong>" + (l - max) + "</strong>个字");
                        self.over = true;
                    }
                }, 100);
            }).on("blur", function() {
                clearInterval(loop);
            }).focus();
        };
        counter.prototype = {
            constructor: counter,
            count: function() {
                var val = this.input.value, i, l, res = 0;
                for (i = 0, l = val.length; i < l; i++) {
                    if (val.charCodeAt(i) > 255) {
                        res++;
                    } else {
                        res += .5;
                    }
                }
                return Math.ceil(res);
            }
        };
        return counter;
    }();
    var pager = function() {
        var pager = function(container, total, perPage, onChange) {
            this.pageBar = $(container);
            this.total = total;
            this.perPage = perPage;
            this.pages = Math.ceil(total / perPage);
            this.pages == 0 && (this.pages = 1);
            this.current = 0;
            this.onChange = onChange;
            this.createPager(0);
            var self = this;
            this.pageBar.on("click", function(e) {
                e.preventDefault();
                var tgt = $(e.target);
                if (tgt.hasClass("js_cmt_pager_index")) {
                    self.current = parseInt(tgt.attr("_index"), 10);
                } else if (tgt.hasClass("js_cmt_pager_pre")) {
                    self.current = self.current == 0 ? 0 : self.current - 1;
                } else if (tgt.hasClass("js_cmt_pager_next")) {
                    self.current = self.current == self.pages - 1 ? self.pages - 1 : self.current + 1;
                } else {
                    return;
                }
                self.createPager(self.current);
                self.onChange(self.current);
            });
        };
        pager.prototype = {
            constructor: pager,
            createPager: function(cur) {
                var html = "", pre = "<a href='javascript:void(0);' onclick='return false;' class='js_cmt_pager_pre' title='上一页'>上一页</a>", i, l, next = "<a onclick='return false;' href='javascript:void(0);' class='js_cmt_pager_next' title='下一页'>下一页</a>";
                var span = "<span>…</span>", first = "<a onclick='return false;' href='' class='js_cmt_pager_index' _index='0' title='第1页'>1</a>", last = "<a onclick='return false;' href='' class='js_cmt_pager_index' _index='" + (this.pages - 1) + "' title='第" + this.pages + "页'>" + this.pages + "</a>";
                if (this.pages <= 8) {
                    for (i = 1, l = this.pages; i <= l; i++) {
                        html += "<a onclick='return false;' href='javascript:void(0);' class='js_cmt_pager_index' _index=" + (i - 1) + " title='第" + i + "页'>" + i + "</a>";
                    }
                    html = pre + html + next;
                } else {
                    if (cur - 3 <= 0) {
                        for (i = 1, l = 8; i < l; i++) {
                            html += "<a onclick='return false;' href='javascript:void(0);' class='js_cmt_pager_index' _index=" + (i - 1) + " title='第" + i + "页'>" + i + "</a>";
                        }
                        html = pre + html + span + last + next;
                    } else if (cur + 3 >= this.pages - 1) {
                        for (i = this.pages, l = this.pages - 7; i > l; i--) {
                            html = "<a onclick='return false;' href='javascript:void(0);' class='js_cmt_pager_index' _index=" + (i - 1) + " title='第" + i + "页'>" + i + "</a>" + html;
                        }
                        html = pre + first + span + html + next;
                    } else {
                        for (i = cur - 3, l = cur + 3; i <= l; i++) {
                            html = html + "<a onclick='return false;' href='javascript:void(0);' class='js_cmt_pager_index' _index=" + i + " title='第" + (i + 1) + "页'>" + (i + 1) + "</a>";
                        }
                        html = pre + first + span + html + span + last + next;
                    }
                }
                this.pageBar.html(html);
                var links = this.pageBar.find("a");
                for (i = 0, l = links.length; i < l; i++) {
                    if (links[i].getAttribute("_index") == cur) {
                        $(links[i]).addClass("now");
                        break;
                    }
                }
            }
        };
        return pager;
    }();
    //CommentUI 对象,抽象出公用的UI部分
    var CommentUI = {
        faceBox: {
            hasInit: false,
            hasLoadPic: false,
            box: null,
            isShow: false,
            target: null,
            faceUrl: "http://static1.pplive.cn/oth/11/11/comment/images/faces/",
            faces: {
                no: "no.gif",
                OK: "OK.gif",
                "爱心": "aixin.gif",
                "傲慢": "aoman.gif",
                "白眼": "baiyan.gif",
                "鄙视": "bishi.gif",
                "闭嘴": "bizui.gif",
                "便便": "bianbian.gif",
                "擦汗": "cahan.gif",
                "菜刀": "caidao.gif",
                "差劲": "chajin.gif",
                "承让": "chengrang.gif",
                "吃饭": "chifan.gif",
                "呲牙": "ciya.gif",
                "大兵": "dabing.gif",
                "大哭": "daku.gif",
                "呆": "dai.gif",
                "刀": "dao.gif",
                "得意": "deyi.gif",
                "发怒": "fanu.gif",
                "奋斗": "fengdou.gif",
                "尴尬": "ganga.gif",
                "勾引": "gouyin.gif",
                "鼓掌": "guzhang.gif",
                "哈欠": "haqian.gif",
                "害羞": "haixiu.gif",
                "憨笑": "hanxiao.gif",
                "哼右": "hengyou.gif",
                "哼左": "hengzuo.gif",
                "坏笑": "huaixiao.gif",
                "惊恐": "jingkong.gif",
                "惊讶": "jingya.gif",
                "咖啡": "kafei.gif",
                "可爱": "keai.gif",
                "可怜": "kelian.gif",
                "抠鼻": "koubi.gif",
                "骷髅": "kulou.gif",
                "酷": "ku.gif",
                "快哭了": "kuaikule.gif",
                "困": "kun.gif",
                "篮球": "lanqiu.gif",
                "冷汗": "lenghan.gif",
                "礼物": "liwu.gif",
                "流泪": "liulei.gif",
                "难过": "nanguo.gif",
                "呕吐": "outu.gif",
                "啤酒": "bijiu.gif",
                "瓢虫": "piaochong.gif",
                "撇嘴": "piezui.gif",
                "乒乓": "pingpang.gif",
                "强": "qiang.gif",
                "敲打": "qiaoda.gif",
                "亲亲": "qinqin.gif",
                "糗": "qiu.gif",
                "拳头": "quantou.gif",
                "弱": "ruo.gif",
                "色": "se.gif",
                "闪电": "shandian.gif",
                "生日": "shengri.gif",
                "胜利": "shengli.gif",
                "衰": "shuai.gif",
                "睡": "shui.gif",
                "太阳": "taiyang.gif",
                "调皮": "tiaopi.gif",
                "偷笑": "touxiao.gif",
                "晚安": "wanan.gif",
                "微笑": "weixiao.gif",
                "委屈": "weiqu.gif",
                "吻": "wen.gif",
                "握手": "woshou.gif",
                "西瓜": "xigua.gif",
                "吓": "xia.gif",
                "鲜花": "xianhua.gif",
                "谢了": "xiele.gif",
                "心碎": "xinsui.gif",
                "嘘": "xu.gif",
                "疑问": "yiwen.gif",
                "晕": "yun.gif",
                "再见": "zaijian.gif",
                "炸弹": "zhadan.gif",
                "折磨": "zhemo.gif",
                "咒骂": "zhouma.gif",
                "猪头": "zhutou.gif",
                "抓狂": "zhuakuang.gif",
                "足球": "zuqiu.gif"
            },
            perPage: 27,
            loadPic: function() {
                $(this.box).find("h4")[0].innerHTML += " 加载中...";
                var self = this, o, i = 0, l, html, faces = this.faces, pg = this.perPage, url = this.faceUrl, pager, holder;
                html = "<div class='bd fc'>";
                for (o in faces) {
                    if (i % pg === 0) {
                        html += "<ul class='c_b js_cmt_face_ul' style='display:none;'>";
                    }
                    html += "<li><a onclick='return false;' href='javascript:void(0)'  title='" + o + "'><img alt='" + o + "' class='js_cmt_face_facer' src='" + url + faces[o] + "' /></a></li>";
                    if (i % pg == pg - 1) {
                        html += "</ul>";
                    }
                    i++;
                }
                if (html.lastIndexOf("</ul>") !== html.length - 5) {
                    html += "</ul>";
                }
                html += "<div class='page_con'>";
                l = Math.ceil(i / pg);
                for (i = 0; i < l; i++) {
                    html += "<a onclick='return false;' href='javascript:void(0);' title='" + (i + 1) + "' class='js_cmt_face_pager' _index='" + i + "'>" + (i + 1) + "</a>";
                }
                html += "</div></div>";
                this.box[0].innerHTML += html;
                holder = this.box.find(".js_cmt_face_ul");
                pager = this.box.find(".js_cmt_face_pager");
                pager.length && pager.eq(0).addClass("now");
                holder.length && holder.eq(0).css("display", "block");
                this.box.on("click", function(e) {
                    e.preventDefault();
                    var tgt = $(e.target), ps, val;
                    if (tgt.hasClass("js_cmt_face_facer")) {
                        CommentUI.insertAtCursor(self.target, "[" + tgt.attr("alt") + "]");
                        self.hide();
                    } else if (tgt.hasClass("js_cmt_face_pager")) {
                        holder.css("display", "none");
                        holder[tgt.attr("_index")].style.display = "block";
                        pager.removeClass("now");
                        tgt.addClass("now");
                    }
                    return false;
                });
                this.box.find("h4")[0].innerHTML = "常用表情";
                this.hasLoadPic = true;
            },
            init: function() {
                var fb = $(".js_cmt_facebox");
                if (fb.length) {
                    this.box = fb.eq(0);
                } else {
                    var f = CommentUI.createDom("div", "facebox js_cmt_facebox", document.body);
                    this.box = $(f);
                }
                this.box[0].innerHTML = "<div class='hd'><h4>常用表情</h4><span class='arrow'></span></div>";
                this.hasInit = true;
                $(document).on("click", function(e) {
                    e.preventDefault();
                    CommentUI.faceBox.hide();
                });
            },
            show: function(btn, input) {
                this.target = input;
                if (!this.hasInit) {
                    this.init();
                }
                if (!this.hasLoadPic) {
                    this.loadPic();
                }
                var pos = $(btn).offset(), x = pos.left, y = pos.top;
                this.box.css({
                    display: "block",
                    left: x - 15 + "px",
                    top: y + 25 + "px"
                });
                this.isShow = true;
            },
            hide: function() {
                this.box.css("display", "none");
                this.isShow = false;
            },
            decode: function(str) {
                var self = this;
                str = str.replace(/\[([^\[^\]]+)\]/g, function(w, w1) {
                    if (self.faces[w1]) {
                        return "<img title='" + w1 + "' src='" + self.faceUrl + self.faces[w1] + "' />";
                    }
                    return w;
                });
                return str;
            },
            urlToChar: function(_html) {
                //标签图片转换为文字
                _html = _html.replace(/<img\stitle=\"?([^"^\s]+)\"?[^>]*>/gi, function(w, w1) {
                    return "[" + w1 + "]";
                });
                return _html;
            },
            bind: function(btn, input) {
                if (!btn) {
                    return;
                }
                var self = this;
                $(btn).on("click", function(e) {
                    if (self.isShow) {
                        self.hide();
                    } else {
                        self.show(btn, input);
                    }
                    return false;
                });
            }
        },
        loginBox: {
            hasInit: false,
            isLoged: false,
            box: null,
            usernameel: null,
            passwordel: null,
            loginUrl: "http://passport.pptv.com/weblogin.do",
            init: function() {
                var box = $(".js_cmt_logBox"), html, self = this;
                if (box.length) {
                    this.box = box.eq(0);
                } else {
                    //html
                    var url = encodeURIComponent(window.location.href);
                    html = '<div class="hd"><h4>登录PPTV</h4><a onclick="return false;" title="关闭" class="close js_cmt_log_close"></a></div><div class="bd c_b"><div class="left"><div class="logform"><p>登录后才可以发表评论，请先登录。</p><p><label>用户名</label><input type="text" class="js_cmt_log_username"></p><p><label>密码</label><input type="password" class="js_cmt_log_password"></p><p class="forget"><a target="_blank" title="忘记密码" href="http://passport.pptv.com/fetchpassworduser.aspx">忘记密码</a><a class="log_btn js_cmt_log_login" title="登录" href="javascript:void(0);" >登录</a></p></div><div class="oth_type"><p>使用其他帐号登录</p><a class="log2" title="新浪微博" href="http://passport.pptv.com/doSnsSinaLogin.do?returnURL=' + url + '"></a><a class="log1" title="QQ帐号" href="http://passport.pptv.com/doSnsQQLogin.do?returnURL=' + url + '"></a><a class="log3" title="人人网" href="http://passport.pptv.com/doSnsRenrenLogin.do?returnURL=' + url + '"></a></div></div><div class="right""><p>没有帐号？立即注册。</p><a class="reg_btn" target="_blank" title="注册" href="http://passport.pptv.com/registerandlogin.do">注册</a></div></div>';
                    this.box = $(CommentUI.createDom("div", "lay js_cmt_logBox", document.body));
                    this.box.html(html);
                    this.box.id = "loginBox";
                }
                this.usernameel = this.box.find(".js_cmt_log_username");
                this.passwordel = this.box.find(".js_cmt_log_password");
                // user.onLogin(function(){
                //     self.isLoged = true;
                // });
                // user.onLogout(function(){
                //     self.isLoged = false;
                // });
                user.loginEvents.add(function() {
                    self.isLoged = true;
                });
                user.logoutEvents.add(function() {
                    self.isLoged = false;
                });
                // user.loginEvents.add(function(){ window.location.reload(); });
                // user.logoutEvents.add(function(){ window.location.reload(); });
                var isFocus = false;
                this.usernameel.on("focus", function() {
                    isFocus = true;
                }).on("blur", function() {
                    isFocus = false;
                });
                this.passwordel.on("focus", function() {
                    isFocus = true;
                }).on("blur", function() {
                    isFocus = false;
                });
                this.box.on("click", function(e) {
                    e.preventDefault();
                    var tgt = $(e.target);
                    if (tgt.hasClass("js_cmt_log_close")) {
                        self.hide();
                    } else if (tgt.hasClass("js_cmt_log_login")) {
                        self.login();
                    } else if (tgt.hasClass("js_cmt_log_othlog")) {}
                }).on("keyup", function(e) {
                    if (e.key === "enter" && isFocus) {
                        self.login();
                    }
                });
                this.hasInit = true;
            },
            show: function(showFrom) {
                var self = this;
                this.showFrom = showFrom;
                login.check(function() {
                    setTimeout(function() {
                        self.onSuccess(self.showFrom);
                    }, 50);
                }, {
                    type: "login",
                    from: "web_comt",
                    tip: encodeURIComponent("亲，需要登录后才能评论哦")
                });
                user.readInfo(true);
                return cookie.get("PPName");
            },
            hide: function() {
                this.box.css("display", "none");
            },
            onSuccess: function() {},
            login: function() {
                var un = this.usernameel, psd = this.passwordel, self = this;
                if (un.value.replace(/\s/g, "") == "") {
                    CommentUI.blink(un, "red");
                    un.focus();
                    return;
                }
                if (psd.value.replace(/\s/g, "") == "") {
                    CommentUI.blink(psd, "red");
                    psd.focus();
                    return;
                }
            }
        },
        counter: counter,
        defaultValue: function(input, value) {
            input.value = value;
            input.on("focus", function() {
                if (this.value === value) {
                    this.value = "";
                }
            }).on("blur", function() {
                if (this.value === "") {
                    this.value = value;
                }
            });
        },
        blink: function(dom, color) {
            dom = $(dom);
            color = color ? color : "#D0E5FF";
            var oColor = dom.css("border-color"), shadow = "0 0 5px " + color;
            dom.css({
                "border-color": color,
                "box-shadow": shadow
            });
            setTimeout(function() {
                dom.css({
                    "border-color": oColor,
                    "box-shadow": "none"
                });
                setTimeout(function() {
                    dom.css({
                        "border-color": color,
                        "box-shadow": shadow
                    });
                    setTimeout(function() {
                        dom.css({
                            "border-color": oColor,
                            "box-shadow": "none"
                        });
                    }, 500);
                }, 200);
            }, 500);
        },
        pager: pager,
        updown: {
            //cookie 格式 commentid=updown
            uped: function(tid) {
                var value = cookie.get("cmtupdown");
                return value && value.indexOf("," + tid) != -1;
            },
            write: function(tid) {
                var value = cookie.get("cmtupdown");
                value = value ? value : "";
                cookie.set("cmtupdown", value + "," + tid, 1, "pptv.com", "/");
            }
        },
        createDom: function(type, clsName, parent) {
            var dom = document.createElement(type);
            clsName && (dom.className = clsName);
            parent && parent.appendChild(dom);
            return dom;
        },
        showInMiddle: function(dom) {
            dom = $(dom);
            dom.css("display", "block");
            var st = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop, sl = window.pageXOffset || document.documentElement.scrollLeft || document.body.scrollLeft;
            var h = parseInt(dom.css("height"), 10), w = parseInt(dom.css("width"), 10);
            dom.css({
                "margin-top": st - h / 2 + "px",
                "margin-left": sl - w / 2 + "px"
            });
        },
        setCursor: function(dom, ps) {
            ps = ps < dom.value.length ? ps : dom.value.length;
            if (dom.selectionStart || dom.selectionStart == 0) {
                dom.focus();
                dom.selectionStart = dom.selectionEnd = ps;
            } else if (document.selection) {
                var oTextRange = dom.createTextRange();
                oTextRange.moveStart("character", ps);
                oTextRange.moveEnd("character", ps);
                oTextRange.collapse(true);
                oTextRange.select();
                dom.focus();
            }
        },
        insertAtCursor: function(dom, value) {
            if (dom.selectionStart || dom.selectionStart == "0") {
                var startPos = dom.selectionStart, endPos = dom.selectionEnd, val = dom.value;
                dom.value = val.substring(0, startPos) + value + val.substring(endPos);
                dom.focus();
                dom.selectionStart = dom.selectionEnd = dom.value.length - val.length + endPos;
            } else if (document.selection) {
                dom.focus();
                sel = document.selection.createRange();
                sel.text = value;
                sel.select();
            } else {
                dom.value += value;
            }
        },
        timer: function(time) {
            var now = +new Date(), arr = time.split(/-|\s|:/), oTime, l, loop, aMinute = 60 * 1e3, anHour = 60 * 60 * 1e3, aDay = 24 * 60 * 60 * 1e3;
            oTime = new Date(+arr[0], --arr[1], +arr[2], +arr[3], +arr[4], +arr[5]);
            l = now - oTime;
            if (l > aDay) {
                return time;
            } else if (l < aDay && l > anHour) {
                return parseInt(l / 1e3 / 60 / 60) + "小时前";
            } else if (l < anHour && l > aMinute) {
                return parseInt(l / 1e3 / 60) + "分钟前";
            } else {
                return "刚刚";
            }
        },
        postCheck: function(postBox, postCounter, postBtn) {
            if (postBox.val().replace(/\s/g, "") == "" || postCounter && postCounter.over) {
                CommentUI.blink(postBox);
                return false;
            }
            CommentUI.loginBox.onSuccess = function(btn) {
                if (typeof btn === "function") {
                    btn();
                } else {
                    $(btn).trigger("click");
                }
            };
            if (!CommentUI.loginBox.show(postBtn)) {
                return false;
            }
            return true;
        },
        prePend: function(parent, node) {
            if (!parent) {
                return;
            }
            var fst;
            if (fst = parent.childNodes[0]) {
                parent.insertBefore(node, fst);
            } else {
                parent.appendChild(node);
            }
        },
        fadeOut: function(dom) {
            dom = $(dom);
            var opct = parseInt(dom.css("opacity"), 10), l = setInterval(function() {
                if (opct < 100) {
                    dom.css("opacity", opct++);
                } else {
                    dom.css("opacity", 100);
                    clearInterval(l);
                }
            }, 20);
        },
        dftFace: "http://face.passport.pptv.com/ppface_black.jpg",
        decodeName: function(name, ip) {
            if (name || !ip) {
                return name;
            }
            return ip.replace(/(\d+.\d+.)\d+.\d+/, function(w, w1) {
                return w1 + "*";
            });
        }
    };
    $.CommentUI = CommentUI;
    //评论列表
    var Comment = function(boxId, ids, tags, options) {
        this.options = {
            pageSize: 10,
            defaultText: "",
            maxNum: 300,
            tabs: [ "" ],
            defaultShow: 0,
            //默认显示第几个tab
            type: "short-pages",
            // long short onpage pages
            showFrom: false,
            showHot: false,
            show: [ 0 ],
            moreUrl: ""
        };
        if (options) {
            this.options = merge(this.options, options);
        }
        this.hotLoaded = false;
        this.box = $("#" + boxId);
        if (!this.box) return;
        //判断是否存在有评论ID
        this.postBtn = this.box.find(".js_cmt_post_btn");
        this.postBtn && (this.isPosting = false);
        this.asy = this.box.find(".js_cmt_asy")[0];
        this.postBox = this.box.find(".js_cmt_post_area");
        this.tabInit = [];
        this.postCount = this.box.find(".js_cmt_post_count");
        this.commentNone = this.box.find(".js_cmt_none");
        this.commentCount = this.box.find(".js_cmt_count");
        this.sccs = this.box.find(".js_cmt_sccs");
        this.comment = new CommentObject(ids, tags, this.options.pageSize);
        this.inited = false;
        this.init();
    };
    Comment.prototype = {
        constructor: Comment,
        init: function() {
            var self = this, opt = self.options, box = self.box, tab, listDiv, pice, data, loadingBox, hotBox, newBox;
            self.loadingBox = $(CommentUI.createDom("div", "js_cmt_loading", self.box[0]));
            self.loadingBox.html("评论加载中..");
            CommentUI.faceBox.bind($(".js_cmt_facebtn")[0], self.postBox[0]);
            //表情
            if (this.postBox && this.postCount) {
                this.postCounter = new CommentUI.counter(this.postBox[0], this.postCount, opt.maxNum);
                CommentUI.defaultValue(this.postBox, opt.defaultText);
            }
            //字数统计，默认值
            if (!self.sccs.length) {
                self.sccs = CommentUI.createDom("div", "success js_cmt_sccs", box[0]);
                self.sccs.style.display = "none";
                self.sccs.innerHTML = "<em>发布成功</em>";
            }
            listDiv = box.find(".js_cmt_list");
            if (!listDiv.length) {
                listDiv = $(CommentUI.createDom("div", "cmt_list js_cmt_list", box[0]));
            }
            this.list = listDiv;
            this.list[0].innerHTML = "";
            if (self.options.showHot) {
                this.loadShortHot();
            }
            //抢沙发链接 焦点
            if (this.commentNone) {
                this.commentNone.find("a").on("click", function(e) {
                    e.preventDefault();
                    if (self.postBox) {
                        self.postBox.focus();
                    }
                });
            }
            //创建最新的容器
            this.newBox = newBox = $(CommentUI.createDom("div", "cmt_list_new", listDiv[0]));
            newBox.hide();
            //newBox.style.display = "none";
            newBox[0].innerHTML = '<div class="hd"><h2>最新评论</h2><em class="arrow"></em></div><div class="bd cmt_new_holder"></div>';
            this.newHolder = newBox.find(".cmt_new_holder");
            //get list
            if (opt.type.indexOf("short") != -1) {
                //短评
                this.getPage(0, "short");
            } else if (opt.type.indexOf("long") != -1) {
                //长评
                this.getPage(0, "long");
            }
            //post
            if (this.postBtn) {
                this.postBtn.on("click", function(e) {
                    e.preventDefault();
                    var bt = this;
                    if (bt.isPosting) {
                        return;
                    }
                    if (!CommentUI.postCheck(self.postBox, self.postCounter, bt)) {
                        return;
                    }
                    bt.isPosting = true;
                    window[self.comment.cmtIndex + "_doPost"] = function(res) {
                        if (res.error !== undefined) {
                            alert(res.message);
                            return;
                        }
                        var tmp = self.postBox.val();
                        self.postBox.val("");
                        self.postCount[0].innerHTML = "还可输入<strong>" + self.options.maxNum + "</strong>个字";
                        self.sccs.style.display = "block";
                        self.hideNone();
                        setTimeout(function() {
                            self.sccs.style.display = "none";
                            //显示新增的信息
                            if (opt.type.indexOf("short") != -1) {
                                self.addShort(tmp);
                            }
                            self.newBox.show();
                            self.commentCount[0].innerHTML = +self.commentCount[0].innerHTML + 1;
                        }, 3e3);
                        bt.isPosting = false;
                    };
                    self.comment.post(self.postBox.val(), +self.asy.checked, self.comment.cmtIndex + "_doPost");
                    setTimeout(function() {
                        bt.isPosting = false;
                    }, 1e4);
                });
            }
        },
        voteCallBack: function(res, btn) {
            if (res.error !== undefined) {
                alert(res.message);
            } else {
                var n = $(btn.parentNode).find("span");
                n[0].innerHTML = parseInt(n[0].innerHTML) + 1;
            }
        },
        getPage: function(n, shortOrLong) {
            var self = this, opt = this.options, tab = self.tab, _type = shortOrLong == "short" ? 1 : 2;
            window[self.comment.cmtIndex + "_getPage"] = function(res) {
                if (res.error) {
                    self.loadingBox.css("display", "block").html(res.message);
                } else {
                    self.comment.fb = res.fb;
                    self.comment.et = res.tm;
                    self.loadingBox.css("display", "none").html("");
                    var o, i = 0, list, j, l, pice, data;
                    data = res.data;
                    for (o in data) {
                        list = data[o].list;
                        if (data[o].count === 0) {
                            self.showNone();
                        } else {
                            self.hideNone();
                            self.newBox.show();
                        }
                        pice = document.createDocumentFragment();
                        var pageWrap, div = self.newHolder;
                        pageWrap = CommentUI.createDom("div", "js_cmt_page_holder", pice);
                        //pageWrap = $('<div class="js_cmt_page_holder" />');
                        pageWrap.setAttribute("_index", data[o].page - 1);
                        if (shortOrLong == "short") {
                            self.getShortPage(pageWrap, pice, list, o);
                        } else {
                            self.getLongPage(pageWrap, pice, list, o);
                        }
                        if (opt.type.indexOf("onepage") != -1) {
                            //显示查看更多
                            var a = CommentUI.createDom("a", "notes", pageWrap);
                            a.title = "查看更多";
                            a.href = opt.moreUrl;
                            //window.location.href.replace('onepage', 'pages');
                            a.target = "_blank";
                            a.innerHTML = "查看更多";
                        } else if (opt.type.indexOf("pages") != -1) {
                            //显示分页
                            if (!div.find(".page_con").length) {
                                var pager = CommentUI.createDom("div", "page_con js_cmt_out_pager", div[0]);
                                new CommentUI.pager(pager, data[o].count, opt.pageSize, function(i) {
                                    //获取某页
                                    var pages = $(pager.parentNode).find(".js_cmt_page_holder"), k, l;
                                    for (k = 0, l = pages.length; k < l; k++) {
                                        if (pages[k].getAttribute("_index") == i) {
                                            pages.css("display", "none");
                                            pages[k].style.display = "block";
                                            return;
                                        }
                                    }
                                    pages.css("display", "none");
                                    if (opt.type.indexOf("short") != -1) {
                                        self.getPage(i, "short");
                                    } else if (opt.type.indexOf("long") != -1) {
                                        self.getPage(i, "long");
                                    }
                                });
                            }
                        }
                        div.find(".js_cmt_page_holder").css("display", "none");
                        //连续翻页bug
                        div[0].insertBefore(pice, div.find(".js_cmt_out_pager")[0]);
                        self.commentCount && i == 0 && (self.commentCount[0].innerHTML = data[o].count);
                        i++;
                        break;
                    }
                    self.inited = true;
                }
            };
            self.comment.getList(self.comment.cmtIndex + "_getPage", n + 1, _type);
        },
        getShortPage: function(pageWrap, pice, list, topicid) {
            pageWrap.innerHTML = "";
            var self = this, opt = self.options, j, l;
            for (j = 0, l = list.length; j < l; j++) {
                var dl, dt, dd, qt, bar, item = list[j], userName, vip, viphtml;
                dl = $(CommentUI.createDom("dl", "c_b"));
                dl.attr("cid", item.comment_id);
                dl.attr("tid", topicid);
                dl.attr("pid", item.parent_id);
                dl.attr("count", item.reply_count);
                userName = CommentUI.decodeName(item.user.nickname || item.user.username, item.ip);
                vip = parseInt(item.user.vip) ? "ico_1" : "ico_0";
                //http://viptv.pptv.com/year_vip/?web_pl=vip
                var isvip = parseInt(item.user.vip);
                viphtml = UserIco(isvip);
                //viphtml = "<a class='" + vip +"' href='http://viptv.pptv.com/?web_pl=vip' target='_blank'></a>";
                dl.html("<dt><a onclick='return false;' title='" + userName + "' href='javascript:void(0);'><img width='40' height='40' title='" + userName + "' src='" + (item.user.avatar || CommentUI.dftFace) + "'></a></dt>");
                dd = CommentUI.createDom("dd", "", dl[0]);
                if (item.ifdel) {
                    dd.innerHTML = "该评论已被删除";
                } else {
                    dd.innerHTML += "<div class='cmt_con js_cmt_info'><div class='userInfo c_b'><span class='user'>" + userName + "：</span>" + viphtml + "</div>" + CommentUI.faceBox.decode(item.content) + "</div>";
                    qt = item.quote;
                    if (qt && typeof qt === "object") {
                        viphtml = UserIco(qt.user.vip);
                        var qtUserName = CommentUI.decodeName(qt.user.nickname || qt.user.username, qt.ip);
                        if (qt.ifdel) {
                            dd.innerHTML += "<div class='quotebox'><span class='arrow'></span><div class='quotelist'><div class='quote end'><div class='cmt_con'><span class='user'>" + qtUserName + "：</span>该评论已被删除</div><div class='pub_sta c_b' style='display:none;'><span class='put_time js_cmt_time' time='" + qt.create_time + "'>" + CommentUI.timer(qt.create_time) + "</span>" + (opt.showFrom ? "<span class='from'>来自<a title='" + item.topic_title + "' href='" + decodeURIComponent(item.topic_link) + "'>" + item.topic_title + "</a></span>" : "") + "<div class='state'><a onclick='return false;' href='javascript:void(0);' class='js_cmt_qt_reply' title='回复'>回复</a></div></div></div></div></div>";
                        } else {
                            dd.innerHTML += "<div class='quotebox'><span class='arrow'></span><div class='quotelist'><div class='quote end'><div class='cmt_con'><div class='userInfo c_b'><span class='user'>" + qtUserName + "：</span>" + viphtml + "</div>" + CommentUI.faceBox.decode(qt.content.substring(0, 300)) + "</div><div class='pub_sta c_b'><span class='put_time js_cmt_time' time='" + qt.create_time + "'>" + CommentUI.timer(qt.create_time) + "</span>" + (opt.showFrom ? "<span class='from'>来自<a title='" + item.topic_title + "' href='" + decodeURIComponent(item.topic_link) + "'>" + item.topic_title + "</a></span>" : "") + "<div class='state'><a onclick='return false;' href='javascript:void(0);' class='js_cmt_qt_reply' title='回复'>回复</a></div></div></div></div></div>";
                        }
                    }
                    dd.innerHTML += "<div class='pub_sta c_b'><span class='put_time js_cmt_time' time='" + item.create_time + "'>" + CommentUI.timer(item.create_time) + "</span>" + (opt.showFrom ? "<span class='from'>来自<a title='" + item.topic_title + "' href='" + decodeURIComponent(item.topic_link) + "'>" + item.topic_title + "</a></span>" : "") + "<div class='state'><a onclick='return false;' title='回复' href='javascript:void(0);' class='js_cmt_reply'>回复</a></div></div>";
                }
                dl.on("click", function(e) {
                    e.preventDefault();
                    var tgt = $(e.target), _dl = $(this);
                    if (tgt.hasClass("js_cmt_up")) {
                        if (!CommentUI.updown.uped(_dl.attr("cid"))) {
                            window[self.comment.cmtIndex + "_up"] = function(res) {
                                self.voteCallBack(res, tgt);
                                CommentUI.updown.write(_dl.attr("cid"));
                            };
                            self.comment.up(_dl.attr("cid"), self.comment.cmtIndex + "_up", _dl.attr("tid"));
                        }
                    } else if (tgt.hasClass("js_cmt_down")) {
                        if (!CommentUI.updown.uped(_dl.attr("cid"))) {
                            window[self.comment.cmtIndex + "_down"] = function(res) {
                                self.voteCallBack(res, tgt);
                                CommentUI.updown.write(_dl.attr("cid"));
                            };
                            self.comment.down(_dl.attr("cid"), self.comment.cmtIndex + "_down", _dl.attr("tid"));
                        }
                    } else if (tgt.hasClass("js_cmt_reply")) {
                        _dl.find(".js_cmt_reply_qtpost").css("display", "none");
                        _dl.find(".js_cmt_reply_qtlist").css("display", "none");
                        _dl.attr("qtshow", "false");
                        if (_dl.attr("show") == "true") {
                            _dl.find(".js_cmt_reply_post").css("display", "none");
                            _dl.find(".js_cmt_reply_list").css("display", "none");
                            _dl.attr("show", "false");
                        } else {
                            self.showReply(_dl, false);
                        }
                    } else if (tgt.hasClass("js_cmt_qt_reply")) {
                        _dl.find(".js_cmt_reply_post").css("display", "none");
                        _dl.find(".js_cmt_reply_list").css("display", "none");
                        _dl.attr("show", "false");
                        if (_dl.attr("qtshow") == "true") {
                            _dl.find(".js_cmt_reply_qtpost").css("display", "none");
                            _dl.find(".js_cmt_reply_qtlist").css("display", "none");
                            _dl.attr("qtshow", "false");
                        } else {
                            self.showReply(_dl, true);
                        }
                    }
                });
                $(pageWrap).append(dl);
            }
        },
        getLongPage: function(pageWrap, pice, list, topicid) {
            var ul = CommentUI.createDom("ul", "", pageWrap);
            for (j = 0, l = list.length; j < l; j++) {
                var li, dd, qt, bar, item = list[j], userName, url = "http://comment.aplusapi.pptv.com/yingping/?topic_id=" + topicid + "&cmt_id=" + item.comment_id;
                li = $(CommentUI.createDom("li", "", ul));
                li.attr("cid", item.comment_id);
                li.attr("tid", topicid);
                if (item.ifdel) {
                    li.html("该评论已被删除");
                } else {
                    userName = CommentUI.decodeName(item.user.nickname || item.user.username, item.ip);
                    item.content = item.content.substring(0, 150);
                    li.html("<p class='cmt_tit'><a class='title' title='" + item.title + "' href='" + url + "'>" + item.title + "</a><span class='time js_cmt_time'>" + CommentUI.timer(item.create_time) + "</span></p><p class='cmt_con'>" + CommentUI.faceBox.decode(item.content) + "(<a class='all' title='查看全文' href='" + url + "'>查看全文</a>)</p><p class='cmt_panel c_b'><span class='name'>" + userName + "</span><span class='status'><a class='cmt_reply' title='回复' href='" + url + "'>回复</a></span></p>");
                }
            }
        },
        showReply: function(dl, isQt) {
            var _qt = isQt ? "qt" : "";
            if (dl.attr(_qt + "loaded")) {
                dl.find(".js_cmt_reply_" + _qt + "post").css("display", "block");
                dl.find(".js_cmt_reply_" + _qt + "list").css("display", "block");
                CommentUI.setCursor(dl.find(".js_cmt_reply_" + _qt + "post textarea")[0], 0);
            } else {
                var self = this, opt = this.options, dd = dl.find("dd"), tid = dl.attr("tid"), cid = isQt ? dl.attr("pid") : dl.attr("cid"), area, asy;
                window[self.comment.cmtIndex + "_showReply"] = function(res) {
                    if (res.error != undefined) {
                        alert(res.message);
                        return;
                    }
                    dd[0].innerHTML += "<div class='add js_cmt_reply_" + _qt + "post'><div class='txt_con'><em class='arrow'></em><div><textarea class='js_cmt_reply_" + _qt + "area' ></textarea></div></div><div class='pub_link'><a onclick='return false;' class='input_face js_cmt_" + _qt + "facebtn' title='插入表情' href='javascript:void(0)'>插入表情</a><label><input class='js_cmt_" + _qt + "asy' type='checkbox' checked='checked'>同步到微博</label><div class='btn'><span class='js_cmt_" + _qt + "reply_count'>还可输入<strong>" + opt.maxNum + "</strong>个字</span><a onclick='return false;' class='pub_btn js_cmt_" + _qt + "reply_btn' href='javascript:void(0);'>发布</a></div></div></div>";
                    var pice, quotebox, pageholder, list, i, l, pager, pages, loaded = false;
                    pice = document.createDocumentFragment();
                    quotebox = CommentUI.createDom("div", "quotebox js_cmt_reply_" + _qt + "list", pice);
                    quotebox.innerHTML = "<span class='arrow'></span>";
                    pageholder = CommentUI.createDom("div", "quotelist js_cmt_reply_" + _qt + "page_holder", quotebox);
                    pageholder.setAttribute("_index", "0");
                    list = res.list;
                    for (i = 0, l = list.length; i < l; i++) {
                        var item = list[i], qt, userName;
                        qt = CommentUI.createDom("div", "quote", pageholder);
                        qt.setAttribute("cid", item.comment_id);
                        userName = CommentUI.decodeName(item.user.nickname || item.user.username, item.ip);
                        if (item.ifdel) {
                            qt.innerHTML = "<p class='cmt_con'>该评论已被删除</p><div class='pub_sta c_b' style='display:none;'><span class='put_time js_cmt_time' time='" + item.create_time + "'>" + CommentUI.timer(item.create_time) + "</span><div class='state'><a onclick='return false;' title='回复' class='js_cmt_reply_" + _qt + "reply' href='javascript:void(0);'>回复</a></div></div>";
                        } else {
                            qt.innerHTML = "<p class='cmt_con'>" + userName + "：" + CommentUI.faceBox.decode(item.content.substring(0, 300)) + "</p><div class='pub_sta c_b'><span class='put_time js_cmt_time' time='" + item.create_time + "'>" + CommentUI.timer(item.create_time) + "</span><div class='state'><a onclick='return false;' title='回复' class='js_cmt_reply_" + _qt + "reply' href='javascript:void(0);'>回复</a></div></div>";
                        }
                    }
                    //pager
                    area = dl.find(".js_cmt_reply_" + _qt + "area");
                    if (res.count > 10) {
                        pager = CommentUI.createDom("div", "page_con js_cmt_reply_" + _qt + "pager", quotebox);
                        new CommentUI.pager(pager, res.count, 10, function(j) {
                            pages = quotebox.find(".js_cmt_reply_" + _qt + "page_holder");
                            pages.css("display", "none");
                            for (i = 0, l = pages.length; i < l; i++) {
                                if (pages[i].attr("_index") == j) {
                                    pages[i].css("display", "block");
                                    area.focus();
                                    return;
                                }
                            }
                            self.getReply(tid, cid, j, quotebox, isQt);
                            CommentUI.setCursor(area[0], 0);
                        });
                    }
                    CommentUI.setCursor(area[0], 0);
                    dd[0].appendChild(pice);
                    dl.attr(_qt + "loaded", "true");
                    CommentUI.faceBox.bind(dl.find(".js_cmt_" + _qt + "facebtn"), area[0]);
                    //字数统计
                    asy = dl.find(".js_cmt_" + _qt + "asy")[0];
                    dl[_qt + "postCounter"] = new CommentUI.counter(area[0], dl.find(".js_cmt_" + _qt + "reply_count"), opt.maxNum);
                    //事件
                    dl.on("click", function(e) {
                        var tgt = $(e.target);
                        e.preventDefault();
                        if (tgt.hasClass("js_cmt_" + _qt + "reply_btn")) {
                            e.preventDefault();
                            //发表按钮
                            var bt = tgt;
                            if (bt.isPosting) {
                                return;
                            }
                            window[self.comment.cmtIndex + "_reply"] = function(res) {
                                window[self.comment.cmtIndex + "_reply"] = function() {};
                                //防止重复提交alert错误提示
                                if (res.error !== undefined) {
                                    alert(res.message);
                                    return;
                                }
                                var tmp = area[0].value;
                                self.addReply(dl, tmp, isQt);
                                area[0].value = "";
                                bt.isPosting = false;
                            };
                            if (!CommentUI.postCheck(area, dl[_qt + "postCounter"], function() {
                                self.comment.reply(cid, area[0].value, +asy.checked, self.comment.cmtIndex + "_reply");
                            })) {
                                return;
                            }
                            bt.isPosting = true;
                            self.comment.reply(cid, area[0].value, +asy.checked, self.comment.cmtIndex + "_reply");
                            setTimeout(function() {
                                bt.isPosting = false;
                            }, 1e4);
                        } else if (tgt.hasClass("js_cmt_reply_" + _qt + "reply")) {
                            //回复按钮
                            area[0].value = "|| " + $.CommentUI.faceBox.urlToChar($(tgt[0].parentNode.parentNode.parentNode).find("p").html());
                            CommentUI.setCursor(area[0], 0);
                        }
                    });
                };
                this.comment.getReply(tid, cid, 1, 10, self.comment.cmtIndex + "_showReply");
            }
            dl.attr(_qt + "show", "true");
        },
        getReply: function(tid, cid, pg, quotebox, isQt) {
            var _qt = isQt ? "qt" : "";
            var self = this;
            window[self.comment.cmtIndex + "_getReply"] = function(res) {
                var pice, pageholder, list, i, l;
                pice = document.createDocumentFragment();
                pageholder = CommentUI.createDom("div", "quotelist js_cmt_reply_" + _qt + "page_holder", pice);
                pageholder.setAttribute("_index", pg);
                list = res.list;
                for (i = 0, l = list.length; i < l; i++) {
                    var item = list[i], qt, userName;
                    qt = CommentUI.createDom("div", "quote", pageholder);
                    userName = CommentUI.decodeName(item.user.nickname || item.user.username, item.ip);
                    if (item.ifdel) {
                        qt.innerHTML = "该评论已被删除";
                    } else {
                        qt.innerHTML = "<p class='cmt_con'>" + userName + "：" + CommentUI.faceBox.decode(item.content) + "</p><div class='pub_sta c_b'><span class='put_time js_cmt_time' time='" + item.create_time + "'>" + CommentUI.timer(item.create_time) + "</span><div class='state'><a onclick='return false;' title='回复' class='js_cmt_reply_" + _qt + "reply' href='javascript:void(0);'>回复</a></div></div>";
                    }
                }
                quotebox.insertBefore(pice, quotebox.find(".js_cmt_reply_" + _qt + "pager"));
            };
            this.comment.getReply(tid, cid, pg + 1, 10, self.comment.cmtIndex + "_getReply");
        },
        addShort: function(value, qouteText) {
            var self = this, pageHolders = self.list.find(".js_cmt_page_holder"), current, i, l, dl, userInfo, qtHtml, vip, viphtml;
            for (i = 0, l = pageHolders.length; i < l; i++) {
                if ($(pageHolders[i]).css("display") == "block") {
                    current = pageHolders[i];
                    break;
                }
            }
            if (!current) {
                current = pageHolders[0];
            }
            qtHtml = '<div class="quotebox"><span class="arrow"></span><div class="quotelist"><div class="quote end"><div class="cmt_con">' + qouteText + "</div></div></div></div>";
            dl = $(document.createElement("dl"));
            dl.className = "c_b";
            dl.css("opacity", "0");
            CommentUI.prePend(current, dl[0]);
            CommentUI.fadeOut(dl);
            userInfo = user.info;
            vip = parseInt(userInfo.isVip) ? "ico_1" : "ico_0";
            //http://viptv.pptv.com/year_vip/?web_pl=vip
            var isvip = parseInt(userInfo.isVip);
            viphtml = UserIco(isvip);
            //viphtml = "<a class='" + vip +"' href='http://viptv.pptv.com/?web_pl=vip' target='_blank'></a>";
            dl[0].innerHTML = "<dt><a onclick='return false;' href='javascript:void(0);' title='" + (userInfo.Nickname || userInfo.UserName) + "'><img width='48' height='48' src='http://face.passport.pplive.com/" + userInfo.HeadPic + "' title='" + (userInfo.Nickname || userInfo.UserName) + "'></a></dt><dd><div class='cmt_con js_cmt_info'><div class='userInfo c_b'><span class='user'>" + (userInfo.Nickname || userInfo.UserName) + "：</span>" + viphtml + "</div>" + CommentUI.faceBox.decode(value) + "</div>" + (qouteText ? qtHtml : "") + "<div class='pub_sta c_b'><span class='put_time js_cmt_time'>刚刚</span></div></dd>";
        },
        addReply: function(dl, value, isQt) {
            var self = this, qt = isQt ? "qt" : "", pageHolders = dl.find(".js_cmt_reply_" + qt + "page_holder"), current, i, l, quote, userInfo;
            for (i = 0, l = pageHolders.length; i < l; i++) {
                if ($(pageHolders[i]).is(":visible")) {
                    current = pageHolders[i];
                    break;
                }
            }
            //假的回复
            quote = document.createElement("div");
            quote.className = "quote";
            //  quote.css("opacity", "0");
            CommentUI.prePend(current, quote);
            //    CommentUI.fadeOut(quote);
            //          dl.closeTimer =   setTimeout(function(){
            dl.find(".js_cmt_reply_" + qt + "post").css("display", "none");
            dl.find(".js_cmt_reply_" + qt + "list").css("display", "none");
            if (!qt) {
                var _curCount = parseInt(dl.attr("count"));
                dl.attr("count", _curCount + 1);
                dl.find(".js_cmt_reply").html("回复");
            }
            //              clearInterval(dl.closeTimer)
            dl.attr("qtshow", "false");
            dl.attr("show", "false");
            //            }, 3000);
            userInfo = user.info;
            quote.innerHTML = "<div class='quote' ><p class='cmt_con'>" + (userInfo.Nickname || userInfo.UserName) + "：" + CommentUI.faceBox.decode(value) + "</p><div class='pub_sta c_b'><span class='put_time js_cmt_time'>刚刚</span><div class='state' style='display:none;'><a onclick='return false;' href='javascript:void(0);' class='js_cmt_reply_" + qt + "reply' title='回复'>回复</a></div></div></div>";
            //假的评论
            var cmt_con = dl.find(".cmt_con"), _index = isQt ? 1 : 0;
            if (cmt_con && cmt_con[_index]) {
                self.addShort(value, cmt_con[_index].innerHTML);
            }
        },
        loadShortHot: function() {
            var self = this, hotBox;
            hotBox = $(CommentUI.createDom("div", "cmt_list_hot"));
            hotBox.innerHTML = '<div class="hd"><h2>最热评论</h2><em class="arrow"></em></div><div class="bd cmt_hot_holder"></div>';
            self.hotHolder = hotBox.find(".cmt_hot_holder");
            window[self.comment.cmtIndex + "_getHot"] = function(data) {
                if (data.result == 0 || !data || !data.list || data.list.length === 0) {
                    return;
                } else {
                    $.CommentUI.prePend(self.list[0], hotBox[0]);
                    var list = data.list;
                    self.getShortPage(self.hotHolder, "", list.slice(0, 2), self.comment.ids[0]);
                    self.hotLoaded = true;
                }
            };
            this.comment.getHot(1, self.comment.cmtIndex + "_getHot");
        },
        showNone: function() {
            this.commentNone && this.commentNone.css("display", "block");
        },
        hideNone: function() {
            this.commentNone && this.commentNone.css("display", "none");
        }
    };
    $.Comment = Comment;
    var singleComment = function(boxId, ids, tags, cid, options) {
        this.options = {
            pageSize: 10,
            defaultText: "",
            maxNum: 300
        };
        if (options) {
            this.options = merge(this.options, options);
        }
        this.ids = ids;
        this.commentId = cid;
        this.box = $("#" + boxId);
        this.ctn = this.box.find(".js_cmt_container");
        this.list = this.box.find(".js_cmt_reply_list");
        this.postBtn = this.box.find(".js_cmt_post_btn");
        this.postBtn && (this.isPosting = false);
        this.asy = this.box.find(".js_cmt_asy");
        this.postBox = this.box.find(".js_cmt_post_area");
        this.postCount = this.box.find(".js_cmt_post_count");
        this.replyCount = this.box.find(".js_cmt_reply_count");
        this.singleComment = new CommentObject(ids, tags, this.options.pageSize);
        //用于获取单条评论
        this.ids.push(cid);
        //发表回复的时候用post接口，同时发表到ids和cid
        this.postComment = new CommentObject(this.ids, tags, this.options.pageSize);
        //用于发表
        this.getComment = new CommentObject([ cid ], "", this.options.pageSize);
        //用于获取评论列表
        this.init();
    };
    singleComment.prototype = {
        constructor: singleComment,
        init: function() {
            var self = this, opt = self.options, box = self.box, tab, listDiv, pice, data;
            window[self.singleComment.cmtIndex + "_getSingle"] = function(res) {
                var userName = CommentUI.decodeName(res.user.nickname || res.user.username, res.ip);
                if (res.error) {
                    return;
                }
                if (box.find("#js_cmt_headpic")) {
                    box.find("#js_cmt_headpic").html('<a onclick="return false;" title="' + userName + '" href="javascript:void(0);"><img width="48" height="48" alt="' + userName + '" src="' + res.user.avatar + '"></a>');
                }
                if (box.find("#js_cmt_author")) {
                    box.find("#js_cmt_author").html(userName);
                }
                if (box.find("#js_cmt_time")) {
                    box.find("#js_cmt_time").html(res.user.create_time);
                }
                if (box.find("#js_cmt_content")) {
                    box.find("#js_cmt_content").html(res.content);
                }
                if (box.find("#js_cmt_up_num")) {
                    box.find("#js_cmt_up_num").html(res.good);
                }
                if (box.find("#js_cmt_down_num")) {
                    box.find("#js_cmt_down_num").html(res.bad);
                }
            };
            this.singleComment.getSingle(this.commentId, self.singleComment.cmtIndex + "_getSingle");
            CommentUI.faceBox.bind($(".js_cmt_facebtn")[0], self.postBox);
            //表情按钮
            if (this.postBox && this.postCount) {
                this.postCounter = new CommentUI.counter(this.postBox[0], this.postCount, opt.maxNum);
                CommentUI.defaultValue(this.postBox, opt.defaultText);
            }
            //字数统计//default value
            if (!this.ctn) {
                this.ctn = $(CommentUI.createDom("div", "cmt_list js_cmt_container", box));
            }
            if (!this.list) {
                this.list = $(CommentUI.createDom("div", "cmt_film js_cmt_reply_list", ctn));
            }
            if (this.postBtn) {
                this.postBtn.on("click", function(e) {
                    e.preventDefault();
                    var bt = this;
                    if (bt.isPosting) {
                        return;
                    }
                    if (!CommentUI.postCheck(self.postBox, self.postCounter, bt)) {
                        return;
                    }
                    bt.isPosting = true;
                    window[self.postComment.cmtIndex + "_post"] = function(res) {
                        if (res.error !== undefined) {
                            alert(res.message);
                            return;
                        }
                        var tmp = self.postBox.val();
                        self.postBox.val("");
                        self.addNew(tmp);
                        bt.isPosting = false;
                    };
                    self.postComment.post(self.postBox.val(), +self.asy.checked, self.postComment.cmtIndex + "_post");
                    setTimeout(function() {
                        bt.isPosting = false;
                    }, 1e4);
                });
            }
            box.on("click", function(e) {
                e.preventDefault();
                var tgt = $(e.target), info;
                if (tgt.hasClass("js_cmt_reply_reply")) {
                    if (self.postBox) {
                        info = $(tgt.parentNode.parentNode.parentNode);
                        self.postBox.value = "|| " + info.find("span").html() + info.find("p").html();
                        CommentUI.setCursor(self.postBox[0], 0);
                    }
                } else if (tgt.hasClass("js_cmt_up")) {
                    if (!CommentUI.updown.uped(self.commentId)) {
                        window[self.singleComment.cmtIndex + "_up"] = function(res) {
                            self.voteCallBack(res, tgt);
                            CommentUI.updown.write(self.commentId);
                        };
                        self.singleComment.up(self.commentId, self.singleComment.cmtIndex + "_up");
                    }
                } else if (tgt.hasClass("js_cmt_down")) {
                    if (!CommentUI.updown.uped(self.commentId)) {
                        window[self.singleComment.cmtIndex + "_down"] = function(res) {
                            self.voteCallBack(res, tgt);
                            CommentUI.updown.write(self.commentId);
                        };
                        self.singleComment.down(self.commentId, self.singleComment.cmtIndex + "_down");
                    }
                } else if (tgt.hasClass("js_cmt_reply")) {
                    self.postBox && self.postBox.focus();
                }
            });
            this.getReply(0);
        },
        getReply: function(pg) {
            var self = this, box = self.box;
            window[self.getComment.cmtIndex + "_getList"] = function(res) {
                if (res.error != undefined) {
                    alert(res.message);
                    return;
                }
                self.getComment.fb = res.fb;
                self.getComment.et = res.tm;
                var list = self.list, ctn = self.ctn, pice, pageholder, pager = list.find(".js_cmt_reply_pager"), i, l, data;
                pice = document.createDocumentFragment();
                pageholder = CommentUI.createDom("div", "js_cmt_reply_page_holder", pice);
                pageholder.setAttribute("_index", pg);
                data = res.data[self.commentId];
                box.find(".js_cmt_reply_count").html(data.count);
                for (i = 0, l = data.list.length; i < l; i++) {
                    var item = data.list[i], dl, userName;
                    dl = CommentUI.createDom("dl", "c_b", pageholder);
                    userName = CommentUI.decodeName(item.user.nickname || item.user.username, item.ip);
                    if (item.ifdel) {
                        dl.innerHTML = "<dt><a onclick='return false;' title='" + userName + "' href='javascript:void(0);'><img width='48' height='48' alt='' src='" + (item.user.avatar || CommentUI.dftFace) + "'></a></dt><dd><div class='cmt_con  js_cmt_info'><span class='user'>" + userName + ":</span><p>该评论已被删除</p></div><div class='pub_sta c_b' style='display;none;'><span class='put_time js_cmt_time'>" + CommentUI.timer(item.create_time) + "</span><div class='state'><a onclick='return false;' title='回复' class='js_cmt_reply_reply' href='javascript:void(0);'>回复</a></div></div></dd>";
                    }
                    dl.innerHTML = "<dt><a onclick='return false;' title='" + userName + "' href='javascript:void(0);'><img width='48' height='48' alt='' src='" + (item.user.avatar || CommentUI.dftFace) + "'></a></dt><dd><div class='cmt_con  js_cmt_info'><span class='user'>" + userName + ":</span><p>" + CommentUI.faceBox.decode(item.content) + "</p></div><div class='pub_sta c_b'><span class='put_time js_cmt_time'>" + CommentUI.timer(item.create_time) + "</span><div class='state'><a onclick='return false;' title='回复' class='js_cmt_reply_reply' href='javascript:void(0);'>回复</a></div></div></dd>";
                }
                if (!pager && data.count > self.options.pageSize) {
                    //分页
                    var pageCtn = CommentUI.createDom("div", "page_con js_cmt_reply_pager", pice);
                    new CommentUI.pager(pageCtn, data.count, self.options.pageSize, function(n) {
                        pages = list.find(".js_cmt_reply_page_holder");
                        pages.css("display", "none");
                        for (i = 0, l = pages.length; i < l; i++) {
                            if (pages[i].attr("_index") == n) {
                                pages[i].css("display", "block");
                                return;
                            }
                        }
                        self.getReply(n);
                    });
                }
                pager ? list.insertBefore(pice, pager) : list.appendChild(pice);
            };
            this.getComment.getList(self.getComment.cmtIndex + "_getList", pg + 1, 1);
        },
        voteCallBack: function(res, btn) {
            if (res.error !== undefined) {
                alert(res.message);
            } else {
                var n = $(btn.parentNode).find("span");
                n.innerHTML = parseInt(n.innerHTML) + 1;
            }
        },
        addNew: function(value) {
            var self = this, pageHolders = self.list.find(".js_cmt_reply_page_holder"), current, i, l, dl, userInfo;
            for (i = 0, l = pageHolders.length; i < l; i++) {
                if (pageHolders[i].css("display", "block")) {
                    current = pageHolders[i];
                    break;
                }
            }
            dl = $(document.createElement("dl"));
            dl.className = "c_b";
            dl.css("opacity", "0");
            CommentUI.prePend(current, dl);
            CommentUI.fadeOut(dl);
            userInfo = user.info;
            dl.innerHTML = "<dt><a onclick='return false;' href='javascript:void(0);' title='" + (userInfo.Nickname || userInfo.UserName) + "'><img width='48' height='48' src='http://face.passport.pplive.com/" + userInfo.HeadPic + "' alt=''></a></dt><dd><div class='cmt_con  js_cmt_info'><span class='user'>" + (userInfo.Nickname || userInfo.UserName) + ":</span><p>" + value + "</p></div><div class='pub_sta c_b'><span class='put_time js_cmt_time'>刚刚</span><div class='state' style='display:none;'><a onclick='return false;' href='javascript:void(0);' class='js_cmt_reply_reply' title='回复'>回复</a></div></div></dd>";
        }
    };
    $.singleComment = singleComment;
    //运行comment
    (function() {
        var el = $("#comment");
        if (webcfg.comment && el) {
            var done = false, sleep;
            function initComment() {
                if (done) return;
                var st = document.documentElement.scrollTop || document.body.scrollTop, ch = document.documentElement.clientHeight || document.body.clientHeight;
                var top = el.offset().top;
                if (st + ch >= top) {
                    var cmt = new $.Comment("comment", webcfg.comment.ids, webcfg.comment.tags, webcfg.comment.config);
                    done = true;
                }
            }
            initComment();
            function delay() {
                clearTimeout(sleep);
                sleep = setTimeout(initComment, 100);
            }
            $(window).on("scroll", delay);
            $(window).on("resize", delay);
        }
    })();
});

/*
* @Author: WhiteWang
* @Date:   2015-08-18 15:53:13
* @Last Modified by:   weifengwang
* @Last Modified time: 2015-09-11 12:12:13
*/
define("util/share/share", [ "core/jquery/1.8.3/jquery", "core/underscore/1.8.3/underscore", "util/cookie/cookie", "util/user/user", "client" ], function(require, exports, module) {
    var $ = require("core/jquery/1.8.3/jquery");
    var _ = require("core/underscore/1.8.3/underscore");
    var cookie = require("util/cookie/cookie");
    var user = require("util/user/user");
    var _template = _.template("" + '<a href="http://connect.qq.com/widget/shareqq/index.html?title=<%=title%>&url=<%=url%>QQ&site=http%3A%2F%2Fwww.pptv.com%2F&desc=<%=shareContent%><%if(pics!=null){%>&pics=<%=pics%><%}%>" external_url="_t=share" target="_blank" title="分享到qq" class="ui-share qq s2"></a>' + '<a href="http://sns.qzone.qq.com/cgi-bin/qzshare/cgi_qzshare_onekey?url=<%=url%>QQ%E7%A9%BA%E9%97%B4&desc=<%=shareContent%><%if(pics!=null){%>&pics=<%=pics%><%}%>" external_url="_t=share" target="_blank" title="分享到qq空间" class="ui-share qzone s3"></a>' + '<a href="http://v.t.sina.com.cn/share/share.php?c=spr_web_bd_pplive_weibo&url=<%=url%>%E6%96%B0%E6%B5%AA%E5%BE%AE%E5%8D%9A&title=<%=shareContent%>&source=PPLive%E7%BD%91%E7%BB%9C%E7%94%B5%E8%A7%86&sourceUrl=http%3A%2F%2Fwww.pptv.com%2F&content=utf-8&appkey=1938876518<%if(pics!=null){%>&pic=<%=pics%><%}%>" external_url="_t=share" target="_blank" title="分享到微博" class="ui-share weibo s4"></a>');
    var UserInfo = user.info || {}, puid = cookie.get("PUID") || "", uid = UserInfo.UserName || "";
    var platform = "web";
    try {
        if (external && external.GetObject) {
            platform = "clt";
        }
    } catch (e) {}
    function ShareBox(options) {
        var opt = $.extend({
            box: "#shareBox",
            shareContent: "来PPTV看视频吧",
            title: document.getElementsByTagName("title")[0].innerHTML,
            url: window.location.href,
            pics: null
        }, options || {});
        var $box = $(opt.box);
        if (opt.url.indexOf("?") === -1) {
            opt.url += "?";
        } else {
            opt.url += "&";
        }
        opt.url += "suid=" + puid + "&uid=" + uid + "&splt=" + platform + "&sapp=";
        $box.append(_template({
            shareContent: encodeURIComponent(opt.shareContent),
            title: encodeURIComponent(opt.title),
            url: encodeURIComponent(opt.url),
            pics: opt.pics === null ? null : encodeURIComponent(opt.pics)
        }));
    }
    return ShareBox;
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

/**
 * @author  Erick Song
 * @email   ahschl0322@gmail.com
 * @info    VIP跳广告
 */
define("app/pc/index/common-joinvip", [ "core/jquery/1.8.3/jquery", "util/user/user", "client", "util/cookie/cookie", "util/login/login" ], function(require, exports, modules) {
    var $ = require("core/jquery/1.8.3/jquery"), user = require("util/user/user"), cookie = require("util/cookie/cookie"), login = require("util/login/login");
    var lastOpenUrl = null;
    (function() {
        //跳广告
        var JoinVip = function() {
            var div = $("#joinVipBox");
            if (!div) return;
            var iframe = div.find("iframe")[0], now = +new Date(), loginCall = "joinvip_" + now, loginUrl = "http://passport.aplusapi.pptv.com/registerandlogin_vip/registerandlogin.html?jscall=" + loginCall, joinUrl = "http://passport.aplusapi.pptv.com/registerandlogin_vip/openvip.html?jscall=" + loginCall, //joinUrl = 'http://local.pptv.com/html/2011/12/noad/openvip.html?jscall='+loginCall;
            loginUrl2 = "http://passport.aplusapi.pptv.com/registerandlogin_vip/openvipfornonregistered?jscall=" + loginCall, joinUrl2 = "http://passport.aplusapi.pptv.com/registerandlogin_vip/openvipforregistered?jscall=" + loginCall;
            window[loginCall] = function(action) {
                if (action == "close") {
                    JoinVip.close();
                    return;
                }
                user.tryReadUserInfo();
                var userInfo = $.IKan.User2.userInfo;
                window.PLAYER.setUserName(userInfo.UserName);
                if (parseInt(userInfo.isVip, 10)) {
                    JoinVip.close();
                } else {
                    JoinVip.showJoin(($("#pptv_playpage_box") || $("#pptv_playpage_box"))["position"]().y);
                }
            };
            $(".btn_close").on("click", function(ev) {
                ev.preventDefault();
                JoinVip.close();
            });
            $(iframe).on("load", function() {
                if (iframe.contentDocument && iframe.contentDocument.body.offsetHeight) {
                    iframe.height = iframe.contentDocument.body.scrollHeight;
                } else if (iframe.Document && iframe.Document.body.scrollHeight) {
                    iframe.height = iframe.Document.body.scrollHeight;
                }
            });
            return {
                show: function(src, top) {
                    var parent = div.parent();
                    if (parent.length != 0) {
                        parent.css("display", "none");
                    }
                    login.logout();
                    login.check(function() {
                        //vip会员和有相应特权的非vip用户通过相应的入口进入不再显示开通会员覆层
                        if (parseInt(user.info.isVip, 10) || playerVipSource == "1" && user.info.IsNoad == "true" || playerVipSource == "2" && user.info.IsSpdup == "true" || playerVipSource == "3" && user.info.IsRtmp == "true") {
                            return;
                        }
                        if (src = "http://pub.aplus.pptv.com/wwwpub/weblogin/?tab=login&from=web_adskip&app=undefined") {
                            src = lastOpenUrl;
                        }
                        JoinVip.showJoin(null, src);
                    }, {
                        type: "login",
                        from: "web_adskip",
                        tip: ""
                    }, {
                        top: div.css("top") || "280px"
                    });
                },
                //添加后跟的参数src，如果src存在则显示，如果不存在则使用原来的joinUrl2
                showJoin: function(top, src) {
                    var parent = div.parent();
                    if (parent.length != 0) {
                        parent.css("display", "block");
                    }
                    div.css("display", "block");
                    if (top) {
                        div.css("top", top);
                    } else {
                        //保持和登陆框的位置一致  设置margin-top为-225px
                        var fw = $(iframe).width();
                        div.css({
                            top: "50%",
                            left: "50%",
                            "margin-left": -fw / 2 + "px",
                            "margin-top": -225 + "px"
                        });
                    }
                    iframe.src = lastOpenUrl = src || joinUrl2;
                },
                showJoinInfo: function(src, top) {
                    var parent = div.parent();
                    if (parent.length != 0) {
                        parent.css("display", "block");
                    }
                    div.css("display", "block");
                    $(".btn_close").css("display", "none");
                    if (top) {
                        div.css("top", top);
                    } else {
                        //保持和登陆框的位置一致  设置margin-top为-225px
                        var fw = $(iframe).width();
                        div.css({
                            top: "50%",
                            left: "50%",
                            "margin-left": -fw / 2 + "px",
                            "margin-top": -225 + "px"
                        });
                    }
                    var logined = document.cookie.indexOf("PPName");
                    if (logined > 0) {
                        iframe.src = lastOpenUrl = src || joinUrl2;
                    } else {
                        iframe.src = lastOpenUrl = src || loginUrl2;
                    }
                },
                close: function() {
                    var parent = div.parent();
                    if (parent.length != 0) {
                        parent.css("display", "none");
                    }
                    div.css("display", "none");
                },
                changeFixframe: function(s) {
                    if (s) {
                        $(iframe).attr("height", s);
                        return;
                    }
                    $(iframe).attr("height", 250);
                }
            };
        }();
        window.JoinVip = JoinVip;
        var urls = {
            removeAd: "http://viptv.pptv.com/vipprivilege/noad/",
            speedUp: "http://viptv.pptv.com/vipprivilege/spdup",
            liveNotLay: "http://viptv.pptv.com/vipprivilege/rtmp"
        };
        window.playerVipSource = -1;
        //播放器内跳广告类型标识 跳广告 蓝光 加速
        player && player.onVipValidate && player.onVipValidate.add(function(s) {
            playerVipSource = s;
            //vip登录来源,全局变量，用于setuserinfo
            var logimg = new Image();
            window["_temp_img_" + +new Date()] = logimg;
            logimg.src = "http://pay.vip.pptv.com/paylogin?web_ad=tggg&" + +new Date();
            //统计请求
            if (window.pluginFlyobject) {
                //如果有小窗飞出，关掉,仅针对32IE浏览器内核
                try {
                    pluginFlyobject.CloseFlyOutWnd();
                } catch (e) {}
            }
            if (s === "1") {
                JoinVip.changeFixframe("270");
                JoinVip.showJoinInfo(urls.removeAd);
                return;
            }
            if (s === "2") {
                JoinVip.changeFixframe("270");
                JoinVip.showJoinInfo(urls.speedUp);
                return;
            }
            if (s === "4") {
                JoinVip.changeFixframe("270");
                JoinVip.showJoinInfo(urls.liveNotLay);
                return;
            }
            if (s === "5") {
                //播放器内pbar登录
                login.check();
                return;
            }
            JoinVip.showJoinInfo(null);
        });
        /* 播放器需要 */
        var playerUserInfo = {};
        user.onLogin(function() {
            playerUserInfo = {
                PPKey: encodeURIComponent(cookie.get("PPKey")),
                PPName: encodeURIComponent(cookie.get("PPName")),
                ppToken: encodeURIComponent(cookie.get("ppToken")),
                UDI: encodeURIComponent(cookie.get("UDI"))
            };
            if (user.info.isVip != 0) {
                if (playerVipSource > 0) playerUserInfo.source = playerVipSource;
            }
            player && player.onNotification({
                header: {
                    type: "userinfo"
                },
                body: {
                    data: playerUserInfo
                }
            });
        });
    })();
});
