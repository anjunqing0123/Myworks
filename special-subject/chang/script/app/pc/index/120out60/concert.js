/*! 一唱成名 create by ErickSong */
define("app/pc/index/120out60/concert", [ "core/jquery/1.8.3/jquery", "../../../../util/lazyload/delayload", "../../../../util/lazyload/webp", "../../../../util/flexSlider/flexSlider", "../../../../util/photoslide/photoslide", "../flipclock", "../../../../util/loader/loader", "../../../../util/log/log", "../../../../util/platform/plt", "../../../../util/browser/browser", "../../../../util/net/urlquery", "../../../../util/vote/voteupdate", "../../../../util/sidemao/sidemao", "../../../../util/linkcfg/interfaceurl", "core/underscore/1.8.3/underscore", "../../../../util/vote/uniformDate", "../../../../util/date/format", "../../../../util/vote/formatVote", "../../personspace/limit", "../../../../util/Timer/timer" ], function(require, exports) {
    var $ = require("core/jquery/1.8.3/jquery");
    var delayload = require("../../../../util/lazyload/delayload");
    //图片后加载初始化
    delayload.init();
    require("../../../../util/flexSlider/flexSlider")($);
    var ps = require("../../../../util/photoslide/photoslide");
    var flipclock = require("../flipclock");
    var loader = require("../../../../util/loader/loader");
    var voteMap = require("../../../../util/vote/voteupdate");
    var isClient = function() {
        //是否是客户端
        try {
            if (external && external.GetObject) {
                return true;
            }
        } catch (e) {}
        return false;
    }();
    //明星脱口秀
    ps.init($(".talkshow"), {
        perTime: 1,
        showNum: 3,
        outer: ".tkshow",
        inner: ".module-animation180x100 ul",
        autoSwitchTime: 7e3
    });
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
    //右侧锚点
    require("../../../../util/sidemao/sidemao");
    var flashTime = 45;
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
                doms[j].html(addKannma(exceptionCounter(tempObj.data.counter)));
            }
        }
    }
    function exceptionCounter(counter) {
        if (typeof counter == "undefined" || counter == null) {
            return 0;
        } else {
            return counter;
        }
    }
    //时间轴tab切换
    /*var tab=require('../../../../util/scroller/tab');
    tab(".module-timeline ul",{
        evt:'click',
        activeClass:'active',
        beforeSwitch:function(idx,tab,btn){
            if(btn.hasClass('past')||btn.hasClass('now')){
                return true;
            }else{
                return false;
            }
        }
    });*/
    var mapId = {
        "0": "haixuan",
        "1": "pk",
        "2": "concert"
    };
    var mapUrl = {
        haixuan: "http://chang.pptv.com/api/sea_history",
        pk: "http://chang.pptv.com/api/pk_history",
        concert: "http://chang.pptv.com/api/concert_history"
    };
    var prefix = "history";
    // 写死阶段
    var firstChildren = null;
    var curIndex = 2;
    var timeLineParent = $("#timeline_stage");
    function showHistoryTab(targetTab, btn) {
        $("#timeline_stage").children().addClass("hidden");
        targetTab.removeClass("hidden");
    }
    function showtab(targetTab, btn) {
        $(".tabconWrap").children().addClass("hidden");
        btn.siblings().removeClass("cur");
        btn.addClass("cur");
        targetTab.removeClass("hidden");
    }
    var scopeid = $(".module-myconcert-index").attr("data-scope");
    function calculateReward(scopeid) {
        var tempObj = {};
        tempObj["__config__"] = {
            cdn: true,
            callback: "updateRewardIndex"
        };
        tempObj["scope"] = scopeid;
        tempObj["stage"] = 3;
        loader.load("http://chang.pptv.com/api/reward_index", tempObj, function(data) {
            if (data.err === 0) {
                var countdata = data.data;
                var totalVote = 0;
                var count = 0;
                for (var key in countdata) {
                    totalVote += parseInt(Number(countdata[key]), 10);
                    count++;
                }
                if (count !== 10) {
                    //异常数据
                    return false;
                }
                $(".js-vote").each(function() {
                    var obj = $(this);
                    var voteid = obj.attr("data-id");
                    if (typeof voteid != "undefined") {
                        var singleVote = countdata[voteid];
                        if (typeof singleVote != "undefined") {
                            if (totalVote == 0) {
                                var num = 0;
                            } else {
                                var num = Math.round(Number(singleVote) / totalVote * 1e3) / 10;
                                if (Number(singleVote) != 0 && num == 0) {
                                    num = "0.0";
                                }
                            }
                            var tempParent = obj.parents(".pinfo");
                            if (num === 0) {
                                tempParent.find(".money").addClass("nomoney");
                            } else {
                                tempParent.find(".money").removeClass("nomoney");
                            }
                            if (num != 0 && num.toString().indexOf(".") == -1) {
                                num += ".0";
                            }
                            var finalHtml = '<p style="width:' + num + '%">' + num + '%<i class="bl"></i><i class="br"></i></p>';
                            tempParent.find(".js-vote").html(addKannma(singleVote));
                            tempParent.find(".bar").html(finalHtml);
                        }
                    }
                });
            }
        });
    }
    //头部演唱会幻灯重写
    $(".module-myconcert-index .tabs li").on("click", function() {
        var obj = $(this);
        var idx = obj.index();
        var tabid = obj.attr("data-tabid");
        var username = obj.attr("data-name");
        var targetTab = $("#" + tabid);
        if (!!isClient) {
            var platform = "clt";
        } else {
            var platform = "pc";
        }
        if (targetTab.length == 0) {
            //ajax请求
            loader.ajax({
                type: "get",
                dataType: "html",
                cache: true,
                url: "http://chang.pptv.com/api/concert_person",
                data: {
                    username: username,
                    plt: platform,
                    scopeid: scopeid
                },
                success: function(data) {
                    var tempObj = $(data);
                    $(".tabconWrap").append(tempObj);
                    tempObj.attr("id", "concert_icon_" + idx);
                    showtab($("#concert_icon_" + idx), obj);
                }
            });
        } else {
            showtab(targetTab, obj);
        }
    });
    //头图幻灯
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
    //PK赛开始
    var urls = require("../../../../util/linkcfg/interfaceurl");
    var _ = require("core/underscore/1.8.3/underscore");
    var uniformDate = require("../../../../util/vote/uniformDate");
    var browser = require("../../../../util/browser/browser");
    var formatDate = require("../../../../util/date/format");
    var formatVote = require("../../../../util/vote/formatVote");
    //放省略号
    var limit = require("../../personspace/limit");
    var timer = require("../../../../util/Timer/timer");
    function uuid() {
        var count = 0;
        return function(prefix) {
            return prefix + "_" + count++;
        };
    }
    var timerUID = uuid();
    //获取服务器时间,模块global
    var serverOffsetTime = 0;
    //用于服务器时间获取失败记录的页面本地打开时间
    var pageStartTime = new Date().getTime();
    var getServerSuccess = false;
    $.ajax({
        url: "http://time.pptv.com",
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
    //暂时作为阶段判定
    var concertContainer = $(".module-pic-layout2");
    var phpNowDate = uniformDate(concertContainer.attr("data-date"));
    if (!!phpNowDate) {
        var tempCdnDate = uniformDate(phpNowDate);
    } else {
        var tempCdnDate = null;
    }
    var concertItems;
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
    function initTopTimer() {
        //首页倒计时
        //jstimer可能存在2个，取页面顶部的倒计时
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
    //获取字符串长度
    function strLen(str) {
        if (!str) {
            return 0;
        }
        var aMatch = str.match(/[^\x00-\xff]/g);
        return str.length + (!aMatch ? 0 : aMatch.length);
    }
    //演唱会js开始
    var globalInProgress = null;
    function updateConcertLive(obj, scopeid, needTimer, index) {
        var targetDom = concertItems.eq(index);
        targetDom.addClass("now");
        var targetP = targetDom.find("p");
        targetP.html("<a>观看直播</a>");
        var userlinkDom = targetDom.children("a");
        var targetA = targetP.find("a");
        if (!!isClient) {
            targetA.attr("href", obj.pc_link);
            userlinkDom.each(function() {
                var tempObj = $(this);
                tempObj.attr("spaceurl", tempObj.attr("href"));
                tempObj.attr("href", obj.pc_link);
            });
            userlinkDom.removeAttr("target");
            targetA.removeAttr("target");
        } else {
            targetA.attr("href", obj.web_link);
            targetA.attr("target", "_blank");
            userlinkDom.each(function() {
                var tempObj = $(this);
                tempObj.attr("spaceurl", tempObj.attr("href"));
                tempObj.attr("href", obj.web_link);
                tempObj.attr("target", "_blank");
            });
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
                        targetDom.find("p").html("直播已结束");
                        targetDom.removeClass("now");
                        userlinkDom.each(function() {
                            var tempObj = $(this);
                            tempObj.attr("href", tempObj.attr("spaceurl"));
                        });
                    }
                }
            });
        }
    }
    function updateConcertBefore(obj, scopeid, needTimer, index) {
        var targetDom = concertItems.eq(index);
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
                        updateConcertLive(obj, scopeid, needTimer, index);
                    } else {}
                }
            });
        }
    }
    function updateConcertEnd(obj, scopeid, needTimer, index) {
        var targetDom = concertItems.eq(index);
        targetDom.find("p").html("直播已结束");
    }
    function dispatchConcertItem(obj, scopeid, needTimer, index) {
        var startTime = obj.startTime = uniformDate(obj.start);
        var endTime = obj.endTime = uniformDate(obj.end);
        var nowTime = getNow(tempCdnDate);
        //var startTime=obj.startTime=new Date(new Date().getTime()+10*1000);
        //var endTime=obj.endTime=new Date(new Date().getTime()+20*1000);
        //直播中
        if (startTime.getTime() <= nowTime.getTime() && nowTime.getTime() < endTime.getTime()) {
            updateConcertLive(obj, scopeid, needTimer, index);
        } else if (startTime.getTime() > nowTime.getTime()) {
            //未开始
            updateConcertBefore(obj, scopeid, needTimer, index);
        } else if (endTime.getTime() <= nowTime.getTime()) {
            //演唱会结束
            updateConcertEnd(obj, scopeid, needTimer, index);
        }
    }
    function updateConcertResult(obj) {
        var scopeData = obj["data"];
        var scopeId = obj["id"];
        for (var key in scopeData) {
            dispatchConcertItem(scopeData[key], scopeId, true, key);
        }
    }
    //演唱会js结束
    // time 等待 1s 初始化
    function updateBottom(data) {
        var concertData = data.data.lists;
        var scopeId = firstChildren.find(".plist").attr("data-scope");
        concertItems = firstChildren.find(".plist li");
        if (scopeId == "0" || !scopeid) {
            return false;
        }
        if (concertData == null) {
            return false;
        }
        if (!concertData[scopeId]) {
            return false;
        }
        var result = {
            data: concertData[scopeId],
            id: scopeId
        };
        updateConcertResult(result);
    }
    function updateConcertTopBefore(obj, scopeid) {
        timer({
            startTime: getNow(tempCdnDate),
            endTime: obj.startTime,
            serverOffsetTime: serverOffsetTime,
            pageStartTime: pageStartTime,
            cdnDate: tempCdnDate,
            getServerSuccess: getServerSuccess,
            callback: function(status, times) {
                if (status == 2) {
                    updateConcertTopLive(obj, scopeid);
                } else {}
            }
        });
    }
    function updateConcertTopLive(obj, scopeid) {
        calculateReward(scopeid);
        globalInProgress = setInterval(function() {
            calculateReward(scopeid);
        }, 1e3 * flashTime);
        timer({
            startTime: getNow(tempCdnDate),
            endTime: obj.endTime,
            serverOffsetTime: serverOffsetTime,
            pageStartTime: pageStartTime,
            cdnDate: tempCdnDate,
            getServerSuccess: getServerSuccess,
            callback: function(status, times) {
                if (status == 2) {
                    if (globalInProgress != null) {
                        setTimeout(function() {
                            clearInterval(globalInProgress);
                        }, 1e3 * 50 * 3);
                    }
                } else {}
            }
        });
    }
    function updateTop(data) {
        var concertData = data.data.lists;
        var scopeId = $(".module-myconcert-index").attr("data-scope");
        if (scopeId == "0" || !scopeid) {
            return false;
        }
        if (concertData == null) {
            return false;
        }
        if (!concertData[scopeId]) {
            return false;
        }
        var matchItem = concertData[scopeId]["0"];
        var startTime = matchItem.startTime = uniformDate(matchItem.start);
        var endTime = matchItem.endTime = uniformDate(matchItem.end);
        var nowTime = getNow(tempCdnDate);
        //var startTime=matchItem.startTime=new Date(new Date().getTime()+10*1000);
        // var endTime=matchItem.endTime=new Date(new Date().getTime()+20*1000);
        //直播中
        if (startTime.getTime() <= nowTime.getTime() && nowTime.getTime() < endTime.getTime()) {
            updateConcertTopLive(matchItem, scopeId);
        } else if (startTime.getTime() > nowTime.getTime()) {
            //未开始
            updateConcertTopBefore(matchItem, scopeId);
        } else if (endTime.getTime() <= nowTime.getTime()) {
            //演唱会结束
            return false;
        }
    }
    function init() {
        //不存在直接return false
        var topContainer = $(".module-myconcert-index");
        var earlyCount = 0;
        var endCount = 0;
        var endObj = null;
        var earlyTime = null;
        var earlyObj = null;
        var endTime = null;
        if (concertContainer.length == 0 && topContainer.length == 0) {
            return false;
        }
        var timeLineObj = timeLineParent.children();
        for (var k = 0; k < timeLineObj.length; k++) {
            var tempObj = timeLineObj.eq(k);
            var tempStart = new Date(tempObj.attr("data-start") * 1e3);
            var tempEnd = new Date(tempObj.attr("data-end") * 1e3);
            var now = getNow(tempCdnDate);
            if (now.getTime() >= tempStart.getTime() && now.getTime() < tempEnd.getTime()) {
                //直播中
                firstChildren = tempObj;
                break;
            } else if (tempStart.getTime() > now.getTime()) {
                //未开始
                if (earlyObj == null) {
                    earlyObj = tempObj;
                    earlyTime = tempStart;
                } else if (earlyTime.getTime() > tempStart.getTime()) {
                    earlyObj = tempObj;
                    earlyTime = tempStart;
                }
                earlyCount++;
            } else if (now.getTime() >= tempEnd.getTime()) {
                //已经结束
                //未开始
                if (endObj == null) {
                    endObj = tempObj;
                    endTime = tempEnd;
                } else if (endTime.getTime() < tempEnd.getTime()) {
                    endObj = tempObj;
                    endTime = tempEnd;
                }
                endCount++;
            }
        }
        if (firstChildren == null) {
            //没找到直播的
            if (earlyCount == 1 && endCount == 1) {
                firstChildren = earlyObj;
            } else if (earlyCount == 2) {
                firstChildren = earlyObj;
            } else {
                firstChildren = endObj;
            }
        }
        timeLineObj.css("display", "none");
        firstChildren.css("display", "block");
        $(".module-timeline ul li").on("click", function() {
            var obj = $(this);
            var idx = obj.index();
            if (obj.index() < curIndex) {
                obj.addClass("pastactive");
                obj.siblings().removeClass("pastactive");
                //ajax 请求或者showtab
                var mapName = mapId[idx];
                var requestUrl = mapUrl[mapName];
                var targetDom = $("#" + prefix + mapName);
                if (targetDom.length == 0) {
                    loader.ajax({
                        type: "get",
                        dataType: "html",
                        cache: true,
                        url: requestUrl,
                        success: function(data) {
                            var tempObj = $(data);
                            $("#timeline_stage").append(tempObj);
                            tempObj.attr("id", prefix + mapName);
                            var tempDom = $("#" + prefix + mapName);
                            delayload.add(tempDom.find("img[data-src2]").toArray());
                            $("#timeline_stage").children().addClass("hidden");
                            tempDom.removeClass("hidden");
                            delayload.update();
                        }
                    });
                } else {
                    targetDom.siblings().addClass("hidden");
                    targetDom.removeClass("hidden");
                }
            } else if (obj.hasClass("now")) {
                obj.siblings().removeClass("pastactive");
                firstChildren.siblings().addClass("hidden");
                firstChildren.removeClass("hidden");
            } else {
                return false;
            }
        });
        loader.load(urls["interface"]["concertAll"], {
            __config__: {
                cdn: true,
                callback: "updateConcertList"
            }
        }, function(data) {
            //var data=require('../../../phone/index/testconcert');
            if (data.err == 0) {
                if (concertContainer.length != 0) {
                    updateBottom(data);
                }
                if (topContainer.length != 0) {
                    updateTop(data);
                }
            }
        });
    }
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

define("util/photoslide/photoslide", [ "core/jquery/1.8.3/jquery" ], function(require) {
    var jq = require("core/jquery/1.8.3/jquery");
    var ua = navigator.userAgent;
    var android = ua.match(/(Android);?[\s\/]+([\d.]+)?/), ipad = ua.match(/(iPad).*OS\s([\d_]+)/), ipod = ua.match(/(iPod)(.*OS\s([\d_]+))?/), iphone = !ipad && ua.match(/(iPhone\sOS)\s([\d_]+)/);
    var isTouchable = android || ipad || ipod || iphone;
    var _container;
    var PhotoSlide = function(container, ops) {
        this.ops = ops;
        this.pageCount = 0;
        this.selectedPageNum = 0;
        this.container = container;
        this.init();
    };
    PhotoSlide.prototype = {
        init: function() {
            var i, len, children, s = [], self = this, perTime = this.ops.perTime, showNum = this.ops.showNum, container = jq(this.container);
            this.outLayer = container.find(this.ops.outer);
            this.innerLayer = this.outLayer.find(this.ops.inner);
            this.preBtn = container.find(this.ops.pre);
            this.nextBtn = container.find(this.ops.next);
            this.btnsEl = container.find(this.ops.btns);
            if (container.length != 1 || this.outLayer.length != 1 || this.innerLayer.length != 1) {
                return;
            }
            children = this.innerLayer.children();
            this.size = children.length;
            if (this.size < 2) {
                this.preBtn && this.preBtn.length == 1 && this.preBtn.addClass("no_pre");
                this.nextBtn && this.nextBtn.length == 1 && this.nextBtn.addClass("no_next");
                return;
            }
            if (perTime > this.size || perTime < 1) {
                perTime = this.size;
                this.ops.perTime = perTime;
            }
            if (showNum > this.size || showNum < perTime) {
                showNum = perTime;
            }
            this.pageCount = Math.ceil((this.size - showNum) / perTime) + 1;
            if (this.pageCount < 1) {
                return;
            }
            if (this.ops.direction === "vertical") {
                this.height = jq(children[1]).offset().top - jq(children[0]).offset().top;
                this.height = this.ops.height || this.height || jq(children[0]).height();
                this.innerLayer.css("height", this.height * this.size);
                this.outLayer.css("height", this.height * this.ops.showNum);
                this.height = this.height * perTime;
            } else {
                this.width = jq(children[1]).offset().left - jq(children[0]).offset().left;
                this.width = this.ops.width || this.width || jq(children[0]).width();
                this.innerLayer.css("width", this.width * this.size);
                this.outLayer.css("width", this.width * this.ops.showNum);
                this.width = this.width * perTime;
            }
            this.outLayer.css("overflow", "hidden");
            if (this.btnsEl && this.btnsEl.length == 1) {
                if (this.ops.fillBtns) {
                    for (i = 0, len = this.pageCount; i < len; i++) {
                        s.push([ '<a href="javascript:;">', i + 1, "</a>" ].join(""));
                    }
                    this.btnsEl.html(s.join(""));
                }
                this.btns = this.btnsEl.children();
                this.btns.each(function(n) {
                    jq(this).bind(self.ops.btnTriggerEvent, function(e) {
                        e.preventDefault();
                        self.changePage(n);
                    });
                });
            }
            if (this.preBtn && this.preBtn.length == 1) {
                this.preBtn.click(function(e) {
                    e.preventDefault();
                    self.changePage(self.selectedPageNum - 1);
                });
            }
            if (this.nextBtn && this.nextBtn.length == 1) {
                this.nextBtn.click(function(e) {
                    e.preventDefault();
                    self.changePage(self.selectedPageNum + 1);
                });
            }
            container.hover(function() {
                self.stopAutoSwitch();
            }, function() {
                self.beginAutoSwitch();
            });
            this.changePage(0);
            if (this.ops.autoSwitchTime > 0) {
                this.beginAutoSwitch();
            }
        },
        beginAutoSwitch: function() {
            if (this.ops.autoSwitchTime < 1 || this.pageCount < 2) {
                return;
            }
            clearInterval(this.sid);
            var self = this;
            this.sid = setInterval(function() {
                var pn = 0;
                if (self.selectedPageNum < self.pageCount - 1) {
                    pn = self.selectedPageNum + 1;
                }
                self.changePage(pn);
            }, this.ops.autoSwitchTime);
        },
        stopAutoSwitch: function() {
            clearInterval(this.sid);
        },
        changePage: function(ix) {
            if (ix < 0 || ix > this.pageCount - 1) {
                return;
            }
            if (this.btnsEl.length > 0) {
                this.btns.removeClass("now");
                this.btns[ix].className = "now";
            }
            this.selectedPageNum = ix;
            this.ops.onChangePage.call(null, ix * this.ops.perTime);
            if (ix == 0) {
                this.preBtn && this.preBtn.addClass("no_pre");
            } else {
                this.preBtn && this.preBtn.removeClass("no_pre");
            }
            if (ix == this.pageCount - 1) {
                this.nextBtn && this.nextBtn.addClass("no_next");
            } else {
                this.nextBtn && this.nextBtn.removeClass("no_next");
            }
            if (this.ops.direction == "horizontal") {
                this.innerLayer.animate({
                    marginLeft: -(this.selectedPageNum * this.width)
                }, this.ops.duration);
            } else {
                this.innerLayer.animate({
                    marginTop: -(this.selectedPageNum * this.height)
                }, this.ops.duration);
            }
        }
    };
    var PhotoSlide2 = function(container, ops) {
        this.ops = ops;
        this.firstIndex = 1;
        this.lastIndex = 0;
        this.container = container;
        this.init();
    };
    PhotoSlide2.prototype = {
        init: function() {
            var children, self = this, perTime = this.ops.perTime, showNum = this.ops.showNum, container = jq(this.container);
            this.outLayer = container.find(this.ops.outer);
            this.innerLayer = container.find(this.ops.inner);
            this.preBtn = container.find(this.ops.pre);
            this.nextBtn = container.find(this.ops.next);
            if (container.length != 1 || this.outLayer.length != 1 || this.innerLayer.length != 1) {
                return;
            }
            children = this.innerLayer.children();
            this.size = children.length;
            if (this.size < 2) {
                this.lastIndex = this.size;
                //fix bug -> 当this.size为1时, nextBtn为不可点击
                this.checkPreNext();
                return;
            }
            if (perTime > this.size || perTime < 1) {
                perTime = this.size;
                this.ops.perTime = perTime;
            }
            /*if (showNum > this.size || showNum <  perTime ) {
                showNum =  perTime;
                this.ops.showNum = showNum;
            }*/
            if (this.ops.direction === "vertical") {
                this.height = jq(children[1]).offset().top - jq(children[0]).offset().top;
                this.height = this.ops.height || this.height || jq(children[0]).height();
                this.innerLayer.css("height", this.height * this.size);
                this.outLayer.css("height", this.height * showNum);
            } else {
                this.width = jq(children[1]).offset().left - jq(children[0]).offset().left;
                this.width = this.ops.width || this.width || jq(children[0]).width();
                this.innerLayer.css("width", this.width * this.size);
                this.outLayer.css("width", this.width * showNum);
            }
            if (this.preBtn && this.preBtn.length == 1) {
                this.preBtn.bind("click", function(e) {
                    e.preventDefault();
                    self.chagePage(true);
                });
            }
            if (this.nextBtn && this.nextBtn.length == 1) {
                this.nextBtn.bind("click", function(e) {
                    e.preventDefault();
                    self.chagePage(false);
                });
            }
            this.outLayer.css("overflow", "hidden");
            this.lastIndex = showNum;
            this.checkPreNext();
            container.hover(function() {
                self.stopAutoSwitch();
            }, function() {
                self.beginAutoSwitch();
            });
            if (this.ops.autoSwitchTime > 0) {
                this.beginAutoSwitch();
            }
        },
        beginAutoSwitch: function() {
            if (this.ops.autoSwitchTime < 1 || this.size <= this.ops.showNum) {
                return;
            }
            clearInterval(this.sid);
            var self = this;
            this.sid = setInterval(function() {
                if (self.lastIndex >= self.size) {
                    if (self.ops.direction == "horizontal") {
                        self.innerLayer.animate({
                            marginLeft: 0
                        }, self.ops.duration);
                    } else {
                        self.innerLayer.animate({
                            marginTop: 0
                        }, self.ops.duration);
                    }
                    self.firstIndex = 1;
                    self.lastIndex = self.ops.showNum > self.size ? self.size : self.ops.showNum;
                    self.checkPreNext();
                    return;
                }
                self.chagePage(false);
            }, this.ops.autoSwitchTime);
        },
        stopAutoSwitch: function() {
            clearInterval(this.sid);
        },
        chagePage: function(pre) {
            var count = this.ops.perTime;
            if (pre) {
                if (this.firstIndex <= 1) {
                    return;
                }
                if (this.firstIndex - count >= 1) {
                    this.lastIndex = this.lastIndex - count;
                    this.firstIndex -= count;
                } else {
                    this.firstIndex = 1;
                    this.lastIndex = this.ops.showNum;
                }
            } else {
                if (this.lastIndex >= this.size) {
                    return;
                }
                if (this.lastIndex + count < this.size) {
                    this.firstIndex += count;
                    this.lastIndex += count;
                } else {
                    this.lastIndex = this.size;
                    this.firstIndex = this.lastIndex - this.ops.showNum + 1;
                }
            }
            if (this.ops.direction == "horizontal") {
                this.innerLayer.animate({
                    marginLeft: -(this.firstIndex - 1) * this.width
                }, this.ops.duration);
            } else {
                this.innerLayer.animate({
                    marginTop: -(this.firstIndex - 1) * this.height
                }, this.ops.duration);
            }
            this.checkPreNext();
            this.ops.onChangePage.call(null, this.firstIndex - 1);
        },
        checkPreNext: function() {
            this.firstIndex <= 1 ? this.preBtn.addClass("no_pre") : this.preBtn.removeClass("no_pre");
            this.lastIndex >= this.size ? this.nextBtn.addClass("no_next") : this.nextBtn.removeClass("no_next");
        }
    };
    var PhotoSlide3 = function(container, ops) {
        this.ops = ops;
        this.firstIndex = 1;
        this.changed = true;
        this.container = container;
        this.init();
    };
    //todo: 无限循环模式目前暂不支持纵向和分页按钮
    PhotoSlide3.prototype = {
        init: function() {
            var i, l, cloneNode, s = [], self = this, showNum = this.ops.showNum, perTime = this.ops.perTime, container = jq(this.container);
            this.selectedPageIndex = 1;
            this.outLayer = container.find(this.ops.outer);
            this.innerLayer = container.find(this.ops.inner);
            this.preBtn = container.find(this.ops.pre);
            this.nextBtn = container.find(this.ops.next);
            this.btnsEl = container.find(this.ops.btns);
            this.pageCount = Math.ceil(this.innerLayer.children().length / showNum);
            this.container = container;
            if (container.length != 1 || this.outLayer.length != 1 || this.innerLayer.length != 1) {
                return;
            }
            this.children = this.innerLayer.children();
            this.size = this.children.length;
            if (this.ops.perTime > this.size) {
                this.ops.perTime = this.size;
            }
            if (showNum > this.size || this.size < 2 || this.ops.perTime < 1) {
                return;
            }
            if (showNum < 1 || showNum < this.ops.perTime) {
                this.ops.showNum = this.ops.perTime;
                showNum = this.ops.showNum;
            }
            if (this.btnsEl && this.btnsEl.length == 1 && (this.size - showNum) % this.ops.perTime == 0) {
                if (this.ops.fillBtns) {
                    this.pageCount = (this.size - showNum) / this.ops.perTime + 1;
                    this.page = 0;
                    for (i = 0, len = this.pageCount; i < len; i++) {
                        s.push([ '<a href="javascript:;">', i + 1, "</a>" ].join(""));
                    }
                    this.btnsEl.html(s.join(""));
                }
                this.btns = this.btnsEl.children();
                var finish = true;
                this.btns.each(function(n) {
                    jq(this).bind(self.ops.btnTriggerEvent, function(e) {
                        e.preventDefault();
                        if (!finish) {
                            return;
                        }
                        var pre = Math.abs(len - n + self.page) % len, next = Math.abs(len + n - self.page) % len, min = next > pre ? pre : next, flag = next > pre ? true : false;
                        speed = self.speed;
                        if (min) {
                            finish = false;
                            self.speed = parseInt(self.speed / min, 10);
                            min--;
                            self.chagePage(flag);
                            jq(self).bind("onOneSlideEnd", function(e) {
                                if (min > 0) {
                                    self.chagePage(flag);
                                } else {
                                    jq(self).unbind("onOneSlideEnd");
                                    self.speed = speed;
                                    finish = true;
                                }
                                min--;
                            });
                        }
                    });
                });
            }
            this.preBtnFunction = function(e) {
                e.preventDefault();
                self.changed = false;
                self.chagePage(true);
            };
            if (this.preBtn && this.preBtn.length == 1) {
                this.preBtn.bind("click", this.preBtnFunction);
            }
            this.nextBtnFunction = function(e) {
                e.preventDefault();
                self.changed = false;
                self.chagePage(false);
            };
            if (this.nextBtn && this.nextBtn.length == 1) {
                this.nextBtn.bind("click", this.nextBtnFunction);
            }
            //新增，如果传递'oreder:asc'则在最后一页的前面补齐空白，否则在后面
            if (this.ops.order == "asc") {
                var num = this.size - (this.pageCount - 1) * showNum;
                for (var i = 0; num < showNum; num++, i++) {
                    var prePageLast = this.children[(this.pageCount - 1) * showNum - 1];
                    var cloneNode = this.children[(this.pageCount - 1) * showNum - i - 1];
                    jq(prePageLast).after(cloneNode.cloneNode(true));
                }
            } else {
                //补齐最后一页的空白
                for (var i = this.children.length, len = this.pageCount * showNum, j = 0; i < len; i++) {
                    this.innerLayer.append(this.children[j++].cloneNode(true));
                }
            }
            //当页数只有一页的时候，不进行页面元素的添加
            if (this.pageCount > 1) {
                this.children = this.innerLayer.children();
                //头上添加最后一页，尾部添加第一页
                for (var i = 0, len = perTime, length = this.children.length; i < len; i++) {
                    this.innerLayer.prepend(this.children[length - i - 1].cloneNode(true));
                }
                for (var i = 0, len = perTime; i < len; i++) {
                    this.innerLayer.append(this.children[i].cloneNode(true));
                }
                this.size = this.innerLayer.children().length;
                if (this.ops.direction === "vertical") {
                    this.height = jq(this.children[1]).offset().top - jq(this.children[0]).offset().top;
                    this.height = this.ops.height || this.height || jq(this.children[0]).height();
                    this.innerLayer.css("height", this.height * this.size * 2);
                    this.outLayer.css("height", this.height * showNum);
                } else {
                    this.width = jq(this.children[1]).offset().left - jq(this.children[0]).offset().left;
                    this.width = this.ops.width || this.width || jq(this.children[0]).width();
                    this.innerLayer.css("width", this.width * this.size);
                    this.outLayer.css("width", this.width * showNum);
                    //如果设置了指定页面，则显示指定页面
                    if (this.ops.showPageCount && this.ops.showPageCount <= this.pageCount && this.ops.showPageCount >= 1) {
                        this.innerLayer.css("margin-left", -this.width * perTime * this.ops.showPageCount);
                        this.selectedPageIndex = this.ops.showPageCount;
                    } else {
                        this.innerLayer.css("margin-left", -this.width * perTime);
                    }
                }
            }
            this.children = this.innerLayer.children();
            this.outLayer.css("overflow", "hidden");
            this.containerFunction = function() {};
            this.containerEnter = function() {
                self.stopAutoSwitch();
            };
            this.containerLeave = function() {
                self.beginAutoSwitch();
            };
            container.hover(this.containerEnter, this.containerLeave);
            switch (this.ops.duration) {
              case "slow":
                this.speed = 3e3;
                break;

              case "normal":
                this.speed = 500;
                break;

              case "fast":
                this.speed = 200;
                break;

              default:
                this.speed = parseInt(this.ops.duration, 10);
                if (isNaN(this.speed) || this.speed < 1) {
                    return;
                }
                break;
            }
            if (this.speed > this.ops.autoSwitchTime) {
                return;
            }
            if (this.ops.autoSwitchTime) {
                this.beginAutoSwitch();
            }
            if (isTouchable) {
                this.enableTouch();
            }
        },
        enableTouch: function() {
            var self = this;
            var count = this.pageCount;
            this.container.swipeLeft(function() {
                self.chagePage(false);
            });
            this.container.swipeRight(function() {
                self.chagePage(true);
            });
        },
        beginAutoSwitch: function() {
            if (this.ops.autoSwitchTime < 1 || this.size <= this.ops.showNum) {
                return;
            }
            clearInterval(this.sid);
            var self = this;
            this.sid = setInterval(function() {
                self.chagePage(false);
            }, this.ops.autoSwitchTime);
        },
        stopAutoSwitch: function() {
            clearInterval(this.sid);
        },
        chagePage: function(pre) {
            var self = this;
            if (self.animating) return;
            var margin = 0, flag = false, stop = false;
            if (pre) {
                this.selectedPageIndex -= 1;
            } else {
                this.selectedPageIndex += 1;
            }
            if (this.pageCount > 1 && this.btns) {
                this.btns.removeClass("now");
                jq(this.btns[this.page]).addClass("now");
            }
            if (this.ops.direction == "horizontal") {
                if (this.selectedPageIndex == this.pageCount + 1) {
                    this.innerLayer.css("margin-left", 0);
                    this.selectedPageIndex = 1;
                } else if (this.selectedPageIndex == 0) {
                    this.innerLayer.css("margin-left", -this.width * this.ops.showNum * (this.pageCount + 1));
                    this.selectedPageIndex = this.pageCount;
                }
                self.animating = true;
                this.innerLayer.animate({
                    "margin-left": -this.selectedPageIndex * this.width * this.ops.showNum
                }, 500, function() {
                    self.animating = false;
                });
            } else {}
            this.ops.onChangePage.call(null, this.firstIndex - 1);
        },
        destroy: function() {
            //解除已绑定的事件
            if (this.preBtn && this.preBtn.length == 1) {
                this.preBtn.unbind("click", this.preBtnFunction);
            }
            if (this.nextBtn && this.nextBtn.length == 1) {
                this.nextBtn.unbind("click", this.nextBtnFunction);
            }
            this.container.unbind("mouseenter", this.containerEnter);
            this.container.unbind("mouseleave", this.containerLeave);
            //恢复inner子元素的个数
            if (this.pageCount > 1) {
                this.children[0].remove();
                this.children[this.children.length - 1].remove();
            }
        }
    };
    function init(containers, ops) {
        this.ops = {
            btnTriggerEvent: "click",
            //切换按钮触发事件
            autoSwitchTime: 5e3,
            //自动切换频率时间,小于1为不自动切换
            direction: "horizontal",
            //横向or竖向    horizontal|vertical
            onChangePage: function() {},
            perTime: 1,
            //每次翻几张
            showNum: 1,
            //默认显示几张
            fillBtns: true,
            blank: true,
            loop: false,
            width: null,
            height: null,
            outer: ".pics",
            inner: ".picsMove",
            pre: ".pre",
            next: ".next",
            btns: ".btns",
            duration: "slow",
            display: "block"
        };
        jq.extend(this.ops, ops);
        _container = containers;
        var obj = this.ops.onChangePage;
        if (!(obj && obj.constructor && obj.call && obj.apply)) {
            this.ops.onChangePage = function() {};
        }
        var ps;
        if (containers && containers.length == 1) {
            if (this.ops.display == "block") {
                jq(containers).css("display", this.ops.display);
            }
            if (this.ops.loop) {
                ps = new PhotoSlide3(containers, this.ops);
            } else if (!this.ops.blank) {
                ps = new PhotoSlide2(containers, this.ops);
            } else {
                ps = new PhotoSlide(containers, this.ops);
            }
        }
        if (containers && containers.length > 1) {
            for (var i = 0, l = containers.length; i < l; i++) {
                jq(containers[i]).css("display", "block");
                if (this.ops.loop) {
                    ps = new PhotoSlide3(containers, this.ops);
                } else if (!this.ops.blank) {
                    ps = new PhotoSlide2(containers, this.ops);
                } else {
                    ps = new PhotoSlide(containers[i], this.ops);
                }
            }
        }
        return ps;
    }
    //添加手势支持库 zepto_touch.js
    if (isTouchable) {
        (function($) {
            var touch = {}, touchTimeout, tapTimeout, swipeTimeout, longTapTimeout, longTapDelay = 750, gesture;
            function swipeDirection(x1, x2, y1, y2) {
                return Math.abs(x1 - x2) >= Math.abs(y1 - y2) ? x1 - x2 > 0 ? "Left" : "Right" : y1 - y2 > 0 ? "Up" : "Down";
            }
            function longTap() {
                longTapTimeout = null;
                if (touch.last) {
                    touch.el.trigger("longTap");
                    touch = {};
                }
            }
            function cancelLongTap() {
                if (longTapTimeout) clearTimeout(longTapTimeout);
                longTapTimeout = null;
            }
            function cancelAll() {
                if (touchTimeout) clearTimeout(touchTimeout);
                if (tapTimeout) clearTimeout(tapTimeout);
                if (swipeTimeout) clearTimeout(swipeTimeout);
                if (longTapTimeout) clearTimeout(longTapTimeout);
                touchTimeout = tapTimeout = swipeTimeout = longTapTimeout = null;
                touch = {};
            }
            function isPrimaryTouch(event) {
                return (event.pointerType == "touch" || event.pointerType == event.MSPOINTER_TYPE_TOUCH) && event.isPrimary;
            }
            function isPointerEventType(e, type) {
                return e.type == "pointer" + type || e.type.toLowerCase() == "mspointer" + type;
            }
            $(document).ready(function() {
                var now, delta, deltaX = 0, deltaY = 0, firstTouch, _isPointerType;
                if ("MSGesture" in window) {
                    gesture = new MSGesture();
                    gesture.target = document.body;
                }
                _container.bind("MSGestureEnd", function(e) {
                    var swipeDirectionFromVelocity = e.velocityX > 1 ? "Right" : e.velocityX < -1 ? "Left" : e.velocityY > 1 ? "Down" : e.velocityY < -1 ? "Up" : null;
                    if (swipeDirectionFromVelocity) {
                        touch.el.trigger("swipe");
                        touch.el.trigger("swipe" + swipeDirectionFromVelocity);
                    }
                }).on("touchstart MSPointerDown pointerdown", function(e) {
                    e = e.originalEvent;
                    if ((_isPointerType = isPointerEventType(e, "down")) && !isPrimaryTouch(e)) return;
                    firstTouch = _isPointerType ? e : e.touches[0];
                    if (e.touches && e.touches.length === 1 && touch.x2) {
                        // Clear out touch movement data if we have it sticking around
                        // This can occur if touchcancel doesn't fire due to preventDefault, etc.
                        touch.x2 = undefined;
                        touch.y2 = undefined;
                    }
                    now = Date.now();
                    delta = now - (touch.last || now);
                    touch.el = $("tagName" in firstTouch.target ? firstTouch.target : firstTouch.target.parentNode);
                    touchTimeout && clearTimeout(touchTimeout);
                    touch.x1 = firstTouch.pageX;
                    touch.y1 = firstTouch.pageY;
                    if (delta > 0 && delta <= 250) touch.isDoubleTap = true;
                    touch.last = now;
                    longTapTimeout = setTimeout(longTap, longTapDelay);
                    // adds the current touch contact for IE gesture recognition
                    if (gesture && _isPointerType) gesture.addPointer(e.pointerId);
                }).on("touchmove MSPointerMove pointermove", function(e) {
                    e = e.originalEvent;
                    if ((_isPointerType = isPointerEventType(e, "move")) && !isPrimaryTouch(e)) return;
                    firstTouch = _isPointerType ? e : e.touches[0];
                    cancelLongTap();
                    touch.x2 = firstTouch.pageX;
                    touch.y2 = firstTouch.pageY;
                    deltaX += Math.abs(touch.x1 - touch.x2);
                    deltaY += Math.abs(touch.y1 - touch.y2);
                }).on("touchend MSPointerUp pointerup", function(e) {
                    e = e.originalEvent;
                    if ((_isPointerType = isPointerEventType(e, "up")) && !isPrimaryTouch(e)) return;
                    cancelLongTap();
                    // swipe
                    if (touch.x2 && Math.abs(touch.x1 - touch.x2) > 30 || touch.y2 && Math.abs(touch.y1 - touch.y2) > 30) swipeTimeout = setTimeout(function() {
                        touch.el.trigger("swipe");
                        touch.el.trigger("swipe" + swipeDirection(touch.x1, touch.x2, touch.y1, touch.y2));
                        touch = {};
                    }, 0); else if ("last" in touch) // don't fire tap when delta position changed by more than 30 pixels,
                    // for instance when moving to a point and back to origin
                    if (deltaX < 30 && deltaY < 30) {
                        // delay by one tick so we can cancel the 'tap' event if 'scroll' fires
                        // ('tap' fires before 'scroll')
                        tapTimeout = setTimeout(function() {
                            // trigger universal 'tap' with the option to cancelTouch()
                            // (cancelTouch cancels processing of single vs double taps for faster 'tap' response)
                            var event = $.Event("tap");
                            event.cancelTouch = cancelAll;
                            touch.el.trigger(event);
                            // trigger double tap immediately
                            if (touch.isDoubleTap) {
                                if (touch.el) touch.el.trigger("doubleTap");
                                touch = {};
                            } else {
                                touchTimeout = setTimeout(function() {
                                    touchTimeout = null;
                                    if (touch.el) touch.el.trigger("singleTap");
                                    touch = {};
                                }, 250);
                            }
                        }, 0);
                    } else {
                        touch = {};
                    }
                    deltaX = deltaY = 0;
                }).on("touchcancel MSPointerCancel pointercancel", cancelAll);
                // scrolling the window indicates intention of the user
                // to scroll, not tap or swipe, so cancel all ongoing events
                $(window).on("scroll", cancelAll);
            });
            if (typeof [].forEach == "function") {
                [ "swipe", "swipeLeft", "swipeRight", "swipeUp", "swipeDown", "doubleTap", "tap", "singleTap", "longTap" ].forEach(function(eventName) {
                    $.fn[eventName] = function(callback) {
                        return this.on(eventName, callback);
                    };
                });
            }
        })(jq);
    }
    return {
        init: init
    };
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

/* 
* @Author: WhiteWang
* @Date:   2015-10-28 15:55:12
* @Last Modified by:   weifengwang
* @Last Modified time: 2015-10-28 15:55:55
*/
define("util/sidemao/sidemao", [ "core/jquery/1.8.3/jquery" ], function(require, exports) {
    var $ = require("core/jquery/1.8.3/jquery");
    var $dom = $(".module-sidebar");
    if ($dom.length == 0) {
        return;
    }
    var timer = null;
    function showTop() {
        var top = $(window).scrollTop();
        if (top > 10) {
            $dom.removeClass("top");
        } else {
            $dom.addClass("top");
        }
    }
    $(window).on("scroll", function() {
        clearTimeout(timer);
        timer = setTimeout(showTop, 200);
    });
    showTop();
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

/**
 * @author: xuxin | seanxu@pptv.com
 * @Date: 13-8-24
 * @history
 */
define("app/pc/personspace/limit", [], function(require, exports, module) {
    var strLen = function(str) {
        if (!str) {
            return 0;
        }
        var aMatch = str.match(/[^\x00-\xff]/g);
        return str.length + (!aMatch ? 0 : aMatch.length);
    };
    return function(str, lens, replace) {
        if (strLen(str) > lens && lens > 0) {
            var s = str.replace(/\*/g, " ").replace(/[^\x00-\xff]/g, "**");
            str = str.slice(0, s.slice(0, lens).replace(/\*\*/g, " ").replace(/\*/g, "").length);
            str = str.slice(0, str.length - 1) + replace || "";
        }
        return str;
    };
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
