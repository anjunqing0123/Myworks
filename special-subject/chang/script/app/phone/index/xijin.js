/*! 一唱成名 create by ErickSong */
define("app/phone/index/xijin", [ "core/jquery/1.8.3/jquery", "../../../util/loader/loader", "../../../util/log/log", "../../../util/platform/plt", "../../../util/browser/browser", "../../../util/net/urlquery", "../../../util/swipe/swiper.min", "../../../util/vote/formatVote", "./../../../util/Timer/timer", "../../../util/vote/uniformDate" ], function(require, exports) {
    var $ = require("core/jquery/1.8.3/jquery");
    var loader = require("../../../util/loader/loader");
    var phpNowDate = $("#concert_wrap").attr("data-date");
    if (!!phpNowDate) {
        var tempCdnDate = uniformDate(phpNowDate);
    } else {
        var tempCdnDate = null;
    }
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
    var pageStartTime = new Date().getTime();
    var getServerSuccess = false;
    var serverOffsetTime = 0;
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
        },
        timeout: 1e3,
        error: function() {
            init();
        }
    });
    var Swiper = require("../../../util/swipe/swiper.min");
    //format dollar
    var formatVote = require("../../../util/vote/formatVote");
    //获取的activeIdx 目前默认是取0,应该从上一次模块中取出
    //var activeIdx=0;
    //$(".vs-item").eq(activeIdx).addClass('active');
    //$('.module-pk-notice .swiper-slide').eq(activeIdx).addClass('active');
    var tabAll = $(".notice-tab").find(".swiper-slide");
    var $module = $(".module-pk-notice");
    var noticeTab = null;
    var noticeTab = new Swiper($(".notice-tab"), {
        slidesPerView: "auto"
    });
    function finishBind() {
        $module.find(".notice-tab .swiper-slide").click(function() {
            var obj = $(this);
            obj.addClass("active").siblings().removeClass("active");
            var scopeid = obj.attr("scopeid");
            //如果前一个等于后一个
            if (prevScopeId == scopeid) {
                return false;
            } else {
                prevScopeId = scopeid;
            }
            var targetDom = $("#concert_" + scopeid);
            var $vsItems = $(".vs-item");
            $vsItems.removeClass("active");
            targetDom.addClass("active");
            var swiperItem = targetDom.find(".content.renqi");
            //绑定swiper
            if (swiperItem.length != 0 && !swiperItem.attr("isSwpied")) {
                swiperItem.attr("isSwpied", 1);
                new Swiper(swiperItem, {
                    slidesPerView: "auto"
                });
            }
        });
    }
    var timer = require("./../../../util/Timer/timer");
    // 直播tab template 
    var tab_template = '<div class="tab"><div class="tab_a">LIVE</div><div class="tab_b">点击头像直接进入直播页</div></div>';
    function uuid() {
        var count = 0;
        return function(prefix) {
            return prefix + "_" + count++;
        };
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
            if (clientOffsetTime > 0 && clientOffsetTime < 1e3 * 60 * 60) {
                return new Date();
            } else {
                return tempPhpDate;
            }
        }
    }
    var timerUID = uuid();
    function resolveParam(str) {
        var arr = str.split("&");
        var data = {};
        for (var i = 0; i < arr.length; i++) {
            var arrs = arr[i].split("=");
            data[arrs[0]] = arrs[1];
        }
        return data;
    }
    function isInApp() {
        var search = window.location.search;
        search = search.substring(1, search.length);
        urlObj = resolveParam(search);
        return urlObj["type"] == "app" || urlObj["type"] == "ipad";
    }
    var isApp = isInApp();
    if (!isApp) {
        $(".renqi-item .cont_w").each(function() {
            var obj = $(this);
            var tempHref = obj.attr("href");
            if (!!tempHref) {
                tempHref = tempHref.replace(/\&?type=app/, "");
                obj.attr("href", tempHref);
            }
        });
    }
    function updateToday(todayData, bonus, targetDom, scopeid) {
        var now = getNow(tempCdnDate);
        var start = new Date(todayData[0]["start"].replace(/-/g, "/"));
        var end = new Date(todayData[0]["end"].replace(/-/g, "/"));
        //var start=new Date(new Date().getTime()+10*1000);
        //var end=new Date(new Date().getTime()+20*1000);
        if (start.getTime() >= now.getTime()) {
            //建立 timer 模块
            var uid = timerUID("timer");
            timer({
                startTime: now,
                endTime: start,
                serverOffsetTime: serverOffsetTime,
                pageStartTime: pageStartTime,
                cdnDate: tempCdnDate,
                getServerSuccess: getServerSuccess,
                callback: function(status, times) {
                    //console.log(times);
                    if (status == 2) {
                        //更新dom
                        //console.log(times);
                        var $con = targetDom;
                        $con.find(".bc").prepend(tab_template);
                        //遍历更新链接
                        $con.find(".role").each(function() {
                            var obj = $(this);
                            var nextUrl = obj.attr("next-url");
                            obj.attr("href", nextUrl);
                        });
                        //第二个倒计时，切换吸金结束的逻辑
                        timer({
                            startTime: getNow(tempCdnDate),
                            endTime: end,
                            serverOffsetTime: serverOffsetTime,
                            pageStartTime: pageStartTime,
                            cdnDate: tempCdnDate,
                            getServerSuccess: getServerSuccess,
                            callback: function(status, times) {
                                //console.log(times);
                                if (status == 2) {
                                    //数据肯定滞后了，需要重写请求接口
                                    updateFinal(targetDom, bonus, scopeid);
                                }
                            }
                        });
                    }
                }
            });
        } else {
            //直接更新dom
            if (now >= end) {
                //更新吸金数据
                updateBefore(todayData, bonus, targetDom, true);
            } else {
                //更新直播状态
                var $con = targetDom;
                $con.find(".bc").prepend(tab_template);
                //遍历更新链接
                $con.find(".role").each(function() {
                    var obj = $(this);
                    var nextUrl = obj.attr("next-url");
                    obj.attr("href", nextUrl);
                });
                //第二个倒计时，切换吸金结束的逻辑
                timer({
                    startTime: getNow(tempCdnDate),
                    endTime: end,
                    serverOffsetTime: serverOffsetTime,
                    callback: function(status, times) {
                        if (status == 2) {
                            updateFinal(targetDom, bonus, scopeid);
                        }
                    }
                });
            }
        }
    }
    function updateFinal(targetDom, bonus, scopeid) {
        loader.load(interfaceUrl, {
            __config__: {
                cdn: true,
                callback: "concertFinalUpdate"
            }
        }, function(data) {
            var areas = data.data.areas;
            var lists = data.data.lists;
            var scopes = data.data.scopes;
            var tempData = lists[scopeid];
            updateBefore(tempData, bonus, targetDom, true);
        });
    }
    function updateBefore(data, bonus, targetDom, needSwipe) {
        //console.log(data);
        //var totalBonus=bonus.bonus;
        var prefix = "http://chang.pptv.com/app/player?";
        if (!!isApp) {
            prefix += "type=app";
        }
        prefix += "&username=";
        //console.log('singleData',data);
        //过期时间表示吸金结束，直接更新dom即可
        // 吸金template 目前都是假数据
        var xijin_prefix = '<div class="module module-top20 reset3"><div class="content renqi swiper-container"><div class="swiper-wrapper renqi-list">';
        var xijin_suffix = "</div></div></div>";
        var tempHtml = "";
        var totalVote = 0;
        for (var key in data) {
            totalVote += parseInt(data[key]["votenum"], 10);
        }
        for (var i in data) {
            if (totalVote == 0 || !data[i]["votenum"]) {
                var num = "0%";
            } else {
                var num = Math.round(Number(data[i]["votenum"]) / totalVote * 1e3) / 10 + "%";
            }
            if (data[i]["is_group"] == 1) {
                var showName = data[i]["group_name"];
            } else {
                var showName = data[i]["real_name"];
            }
            if (i < 3) {
                tempHtml += '<div class="swiper-slide  renqi-item"><a href="' + (prefix + data[i]["username"]) + '" class="cont_w"><div class="picw"><img src="' + data[i].avatar + '"><div class="imgw"></div></div><div class="name">' + showName + '</div><div class="score"><span>' + num + '</span></div><span class="tag top">' + (parseInt(i, 10) + 1) + "</span></a></div>";
            } else {
                tempHtml += '<div class="swiper-slide  renqi-item"><a href="' + (prefix + data[i]["username"]) + '" class="cont_w"><div class="picw"><img src="' + data[i].avatar + '"><div class="imgw"></div></div><div class="name">' + showName + '</div><div class="score"><span>' + num + '</span></div><span class="tag">' + (parseInt(i, 10) + 1) + "</span></a></div>";
            }
        }
        tempHtml = xijin_prefix + tempHtml + xijin_suffix;
        var item = targetDom;
        item.html(tempHtml);
        if (!!needSwipe && targetDom.css("display") == "block") {
            var swiperItem = item.find(".content.renqi");
            if (!swiperItem.attr("isSwpied")) {
                swiperItem.attr("isSwpied", 1);
                new Swiper(swiperItem, {
                    slidesPerView: "auto"
                });
            }
        }
    }
    var interfaceUrl = "http://chang.pptv.com/api/concert";
    function init() {
        loader.load(interfaceUrl, {
            __config__: {
                cdn: true,
                callback: "concertUpdate"
            }
        }, function(data) {
            if (data.err == 0) {
                var areas = data.data.areas;
                var lists = data.data.lists;
                var scopes = data.data.scopes;
                var targetTodayTab = $(".notice-tab .swiper-slide.active");
                if (targetTodayTab.length == 0) {
                    targetTodayTab = $(".notice-tab .swiper-slide").eq(0);
                    targetTodayTab.addClass("active");
                }
                prevScopeId = targetTodayTab.attr("scopeid");
                var todayScopeId = prevScopeId;
                var activeIdx = targetTodayTab.index();
                noticeTab.slideTo(activeIdx);
                var todayDomsParent = $("#concert_" + todayScopeId);
                var todayData = lists[todayScopeId];
                todayDomsParent.addClass("active");
                var nowDate = getNow(tempCdnDate);
                if (!!todayData) {
                    updateToday(todayData, scopes[todayScopeId], todayDomsParent, todayScopeId);
                }
                for (var i = 0; i < tabAll.length; i++) {
                    if (i == activeIdx) {
                        continue;
                    }
                    var tempTab = tabAll.eq(i);
                    var tempScopeId = tempTab.attr("scopeid");
                    var tempDomsParent = $("#concert_" + tempScopeId);
                    var tempdataArr = lists[tempScopeId];
                    //继续容错
                    if (!tempdataArr) {
                        continue;
                    }
                    updateToday(tempdataArr, scopes[tempScopeId], tempDomsParent, tempScopeId);
                }
                finishBind();
            }
        });
    }
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

define("util/swipe/swiper.min", [], function(require, exports, module) {
    /**
 * Swiper 3.1.0
 * Most modern mobile touch slider and framework with hardware accelerated transitions
 *
 * http://www.idangero.us/swiper/
 *
 * Copyright 2015, Vladimir Kharlampidi
 * The iDangero.us
 * http://www.idangero.us/
 *
 * Licensed under MIT
 *
 * Released on: July 14, 2015
 */
    !function() {
        "use strict";
        function e(e) {
            e.fn.swiper = function(a) {
                var r;
                return e(this).each(function() {
                    var e = new t(this, a);
                    r || (r = e);
                }), r;
            };
        }
        var a, t = function(e, s) {
            function i() {
                return "horizontal" === w.params.direction;
            }
            function n(e) {
                return Math.floor(e);
            }
            function o() {
                w.autoplayTimeoutId = setTimeout(function() {
                    w.params.loop ? (w.fixLoop(), w._slideNext()) : w.isEnd ? s.autoplayStopOnLast ? w.stopAutoplay() : w._slideTo(0) : w._slideNext();
                }, w.params.autoplay);
            }
            function l(e, t) {
                var r = a(e.target);
                if (!r.is(t)) if ("string" == typeof t) r = r.parents(t); else if (t.nodeType) {
                    var s;
                    return r.parents().each(function(e, a) {
                        a === t && (s = t);
                    }), s ? t : void 0;
                }
                return 0 === r.length ? void 0 : r[0];
            }
            function d(e, a) {
                a = a || {};
                var t = window.MutationObserver || window.WebkitMutationObserver, r = new t(function(e) {
                    e.forEach(function(e) {
                        w.onResize(!0), w.emit("onObserverUpdate", w, e);
                    });
                });
                r.observe(e, {
                    attributes: "undefined" == typeof a.attributes ? !0 : a.attributes,
                    childList: "undefined" == typeof a.childList ? !0 : a.childList,
                    characterData: "undefined" == typeof a.characterData ? !0 : a.characterData
                }), w.observers.push(r);
            }
            function p(e) {
                e.originalEvent && (e = e.originalEvent);
                var a = e.keyCode || e.charCode;
                if (!w.params.allowSwipeToNext && (i() && 39 === a || !i() && 40 === a)) return !1;
                if (!w.params.allowSwipeToPrev && (i() && 37 === a || !i() && 38 === a)) return !1;
                if (!(e.shiftKey || e.altKey || e.ctrlKey || e.metaKey || document.activeElement && document.activeElement.nodeName && ("input" === document.activeElement.nodeName.toLowerCase() || "textarea" === document.activeElement.nodeName.toLowerCase()))) {
                    if (37 === a || 39 === a || 38 === a || 40 === a) {
                        var t = !1;
                        if (w.container.parents(".swiper-slide").length > 0 && 0 === w.container.parents(".swiper-slide-active").length) return;
                        var r = {
                            left: window.pageXOffset,
                            top: window.pageYOffset
                        }, s = window.innerWidth, n = window.innerHeight, o = w.container.offset();
                        w.rtl && (o.left = o.left - w.container[0].scrollLeft);
                        for (var l = [ [ o.left, o.top ], [ o.left + w.width, o.top ], [ o.left, o.top + w.height ], [ o.left + w.width, o.top + w.height ] ], d = 0; d < l.length; d++) {
                            var p = l[d];
                            p[0] >= r.left && p[0] <= r.left + s && p[1] >= r.top && p[1] <= r.top + n && (t = !0);
                        }
                        if (!t) return;
                    }
                    i() ? ((37 === a || 39 === a) && (e.preventDefault ? e.preventDefault() : e.returnValue = !1), 
                    (39 === a && !w.rtl || 37 === a && w.rtl) && w.slideNext(), (37 === a && !w.rtl || 39 === a && w.rtl) && w.slidePrev()) : ((38 === a || 40 === a) && (e.preventDefault ? e.preventDefault() : e.returnValue = !1), 
                    40 === a && w.slideNext(), 38 === a && w.slidePrev());
                }
            }
            function u(e) {
                e.originalEvent && (e = e.originalEvent);
                var a = w.mousewheel.event, t = 0;
                if (e.detail) t = -e.detail; else if ("mousewheel" === a) if (w.params.mousewheelForceToAxis) if (i()) {
                    if (!(Math.abs(e.wheelDeltaX) > Math.abs(e.wheelDeltaY))) return;
                    t = e.wheelDeltaX;
                } else {
                    if (!(Math.abs(e.wheelDeltaY) > Math.abs(e.wheelDeltaX))) return;
                    t = e.wheelDeltaY;
                } else t = e.wheelDelta; else if ("DOMMouseScroll" === a) t = -e.detail; else if ("wheel" === a) if (w.params.mousewheelForceToAxis) if (i()) {
                    if (!(Math.abs(e.deltaX) > Math.abs(e.deltaY))) return;
                    t = -e.deltaX;
                } else {
                    if (!(Math.abs(e.deltaY) > Math.abs(e.deltaX))) return;
                    t = -e.deltaY;
                } else t = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? -e.deltaX : -e.deltaY;
                if (w.params.mousewheelInvert && (t = -t), w.params.freeMode) {
                    var r = w.getWrapperTranslate() + t;
                    if (r > 0 && (r = 0), r < w.maxTranslate() && (r = w.maxTranslate()), w.setWrapperTransition(0), 
                    w.setWrapperTranslate(r), w.updateProgress(), w.updateActiveIndex(), w.params.freeModeSticky && (clearTimeout(w.mousewheel.timeout), 
                    w.mousewheel.timeout = setTimeout(function() {
                        w.slideReset();
                    }, 300)), 0 === r || r === w.maxTranslate()) return;
                } else {
                    if (new window.Date().getTime() - w.mousewheel.lastScrollTime > 60) if (0 > t) if (w.isEnd) {
                        if (w.params.mousewheelReleaseOnEdges) return !0;
                    } else w.slideNext(); else if (w.isBeginning) {
                        if (w.params.mousewheelReleaseOnEdges) return !0;
                    } else w.slidePrev();
                    w.mousewheel.lastScrollTime = new window.Date().getTime();
                }
                return w.params.autoplay && w.stopAutoplay(), e.preventDefault ? e.preventDefault() : e.returnValue = !1, 
                !1;
            }
            function c(e, t) {
                e = a(e);
                var r, s, n;
                r = e.attr("data-swiper-parallax") || "0", s = e.attr("data-swiper-parallax-x"), 
                n = e.attr("data-swiper-parallax-y"), s || n ? (s = s || "0", n = n || "0") : i() ? (s = r, 
                n = "0") : (n = r, s = "0"), s = s.indexOf("%") >= 0 ? parseInt(s, 10) * t + "%" : s * t + "px", 
                n = n.indexOf("%") >= 0 ? parseInt(n, 10) * t + "%" : n * t + "px", e.transform("translate3d(" + s + ", " + n + ",0px)");
            }
            function m(e) {
                return 0 !== e.indexOf("on") && (e = e[0] !== e[0].toUpperCase() ? "on" + e[0].toUpperCase() + e.substring(1) : "on" + e), 
                e;
            }
            if (!(this instanceof t)) return new t(e, s);
            var f = {
                direction: "horizontal",
                touchEventsTarget: "container",
                initialSlide: 0,
                speed: 300,
                autoplay: !1,
                autoplayDisableOnInteraction: !0,
                freeMode: !1,
                freeModeMomentum: !0,
                freeModeMomentumRatio: 1,
                freeModeMomentumBounce: !0,
                freeModeMomentumBounceRatio: 1,
                freeModeSticky: !1,
                setWrapperSize: !1,
                virtualTranslate: !1,
                effect: "slide",
                coverflow: {
                    rotate: 50,
                    stretch: 0,
                    depth: 100,
                    modifier: 1,
                    slideShadows: !0
                },
                cube: {
                    slideShadows: !0,
                    shadow: !0,
                    shadowOffset: 20,
                    shadowScale: .94
                },
                fade: {
                    crossFade: !1
                },
                parallax: !1,
                scrollbar: null,
                scrollbarHide: !0,
                keyboardControl: !1,
                mousewheelControl: !1,
                mousewheelReleaseOnEdges: !1,
                mousewheelInvert: !1,
                mousewheelForceToAxis: !1,
                hashnav: !1,
                spaceBetween: 0,
                slidesPerView: 1,
                slidesPerColumn: 1,
                slidesPerColumnFill: "column",
                slidesPerGroup: 1,
                centeredSlides: !1,
                slidesOffsetBefore: 0,
                slidesOffsetAfter: 0,
                roundLengths: !1,
                touchRatio: 1,
                touchAngle: 45,
                simulateTouch: !0,
                shortSwipes: !0,
                longSwipes: !0,
                longSwipesRatio: .5,
                longSwipesMs: 300,
                followFinger: !0,
                onlyExternal: !1,
                threshold: 0,
                touchMoveStopPropagation: !0,
                pagination: null,
                paginationElement: "span",
                paginationClickable: !1,
                paginationHide: !1,
                paginationBulletRender: null,
                resistance: !0,
                resistanceRatio: .85,
                nextButton: null,
                prevButton: null,
                watchSlidesProgress: !1,
                watchSlidesVisibility: !1,
                grabCursor: !1,
                preventClicks: !0,
                preventClicksPropagation: !0,
                slideToClickedSlide: !1,
                lazyLoading: !1,
                lazyLoadingInPrevNext: !1,
                lazyLoadingOnTransitionStart: !1,
                preloadImages: !0,
                updateOnImagesReady: !0,
                loop: !1,
                loopAdditionalSlides: 0,
                loopedSlides: null,
                control: void 0,
                controlInverse: !1,
                controlBy: "slide",
                allowSwipeToPrev: !0,
                allowSwipeToNext: !0,
                swipeHandler: null,
                noSwiping: !0,
                noSwipingClass: "swiper-no-swiping",
                slideClass: "swiper-slide",
                slideActiveClass: "swiper-slide-active",
                slideVisibleClass: "swiper-slide-visible",
                slideDuplicateClass: "swiper-slide-duplicate",
                slideNextClass: "swiper-slide-next",
                slidePrevClass: "swiper-slide-prev",
                wrapperClass: "swiper-wrapper",
                bulletClass: "swiper-pagination-bullet",
                bulletActiveClass: "swiper-pagination-bullet-active",
                buttonDisabledClass: "swiper-button-disabled",
                paginationHiddenClass: "swiper-pagination-hidden",
                observer: !1,
                observeParents: !1,
                a11y: !1,
                prevSlideMessage: "Previous slide",
                nextSlideMessage: "Next slide",
                firstSlideMessage: "This is the first slide",
                lastSlideMessage: "This is the last slide",
                paginationBulletMessage: "Go to slide {{index}}",
                runCallbacksOnInit: !0
            }, h = s && s.virtualTranslate;
            s = s || {};
            for (var g in f) if ("undefined" == typeof s[g]) s[g] = f[g]; else if ("object" == typeof s[g]) for (var v in f[g]) "undefined" == typeof s[g][v] && (s[g][v] = f[g][v]);
            var w = this;
            if (w.version = "3.1.0", w.params = s, w.classNames = [], "undefined" != typeof a && "undefined" != typeof r && (a = r), 
            ("undefined" != typeof a || (a = "undefined" == typeof r ? window.Dom7 || window.Zepto || window.jQuery : r)) && (w.$ = a, 
            w.container = a(e), 0 !== w.container.length)) {
                if (w.container.length > 1) return void w.container.each(function() {
                    new t(this, s);
                });
                w.container[0].swiper = w, w.container.data("swiper", w), w.classNames.push("swiper-container-" + w.params.direction), 
                w.params.freeMode && w.classNames.push("swiper-container-free-mode"), w.support.flexbox || (w.classNames.push("swiper-container-no-flexbox"), 
                w.params.slidesPerColumn = 1), (w.params.parallax || w.params.watchSlidesVisibility) && (w.params.watchSlidesProgress = !0), 
                [ "cube", "coverflow" ].indexOf(w.params.effect) >= 0 && (w.support.transforms3d ? (w.params.watchSlidesProgress = !0, 
                w.classNames.push("swiper-container-3d")) : w.params.effect = "slide"), "slide" !== w.params.effect && w.classNames.push("swiper-container-" + w.params.effect), 
                "cube" === w.params.effect && (w.params.resistanceRatio = 0, w.params.slidesPerView = 1, 
                w.params.slidesPerColumn = 1, w.params.slidesPerGroup = 1, w.params.centeredSlides = !1, 
                w.params.spaceBetween = 0, w.params.virtualTranslate = !0, w.params.setWrapperSize = !1), 
                "fade" === w.params.effect && (w.params.slidesPerView = 1, w.params.slidesPerColumn = 1, 
                w.params.slidesPerGroup = 1, w.params.watchSlidesProgress = !0, w.params.spaceBetween = 0, 
                "undefined" == typeof h && (w.params.virtualTranslate = !0)), w.params.grabCursor && w.support.touch && (w.params.grabCursor = !1), 
                w.wrapper = w.container.children("." + w.params.wrapperClass), w.params.pagination && (w.paginationContainer = a(w.params.pagination), 
                w.params.paginationClickable && w.paginationContainer.addClass("swiper-pagination-clickable")), 
                w.rtl = i() && ("rtl" === w.container[0].dir.toLowerCase() || "rtl" === w.container.css("direction")), 
                w.rtl && w.classNames.push("swiper-container-rtl"), w.rtl && (w.wrongRTL = "-webkit-box" === w.wrapper.css("display")), 
                w.params.slidesPerColumn > 1 && w.classNames.push("swiper-container-multirow"), 
                w.device.android && w.classNames.push("swiper-container-android"), w.container.addClass(w.classNames.join(" ")), 
                w.translate = 0, w.progress = 0, w.velocity = 0, w.lockSwipeToNext = function() {
                    w.params.allowSwipeToNext = !1;
                }, w.lockSwipeToPrev = function() {
                    w.params.allowSwipeToPrev = !1;
                }, w.lockSwipes = function() {
                    w.params.allowSwipeToNext = w.params.allowSwipeToPrev = !1;
                }, w.unlockSwipeToNext = function() {
                    w.params.allowSwipeToNext = !0;
                }, w.unlockSwipeToPrev = function() {
                    w.params.allowSwipeToPrev = !0;
                }, w.unlockSwipes = function() {
                    w.params.allowSwipeToNext = w.params.allowSwipeToPrev = !0;
                }, w.params.grabCursor && (w.container[0].style.cursor = "move", w.container[0].style.cursor = "-webkit-grab", 
                w.container[0].style.cursor = "-moz-grab", w.container[0].style.cursor = "grab"), 
                w.imagesToLoad = [], w.imagesLoaded = 0, w.loadImage = function(e, a, t, r) {
                    function s() {
                        r && r();
                    }
                    var i;
                    e.complete && t ? s() : a ? (i = new window.Image(), i.onload = s, i.onerror = s, 
                    i.src = a) : s();
                }, w.preloadImages = function() {
                    function e() {
                        "undefined" != typeof w && null !== w && (void 0 !== w.imagesLoaded && w.imagesLoaded++, 
                        w.imagesLoaded === w.imagesToLoad.length && (w.params.updateOnImagesReady && w.update(), 
                        w.emit("onImagesReady", w)));
                    }
                    w.imagesToLoad = w.container.find("img");
                    for (var a = 0; a < w.imagesToLoad.length; a++) w.loadImage(w.imagesToLoad[a], w.imagesToLoad[a].currentSrc || w.imagesToLoad[a].getAttribute("src"), !0, e);
                }, w.autoplayTimeoutId = void 0, w.autoplaying = !1, w.autoplayPaused = !1, w.startAutoplay = function() {
                    return "undefined" != typeof w.autoplayTimeoutId ? !1 : w.params.autoplay ? w.autoplaying ? !1 : (w.autoplaying = !0, 
                    w.emit("onAutoplayStart", w), void o()) : !1;
                }, w.stopAutoplay = function(e) {
                    w.autoplayTimeoutId && (w.autoplayTimeoutId && clearTimeout(w.autoplayTimeoutId), 
                    w.autoplaying = !1, w.autoplayTimeoutId = void 0, w.emit("onAutoplayStop", w));
                }, w.pauseAutoplay = function(e) {
                    w.autoplayPaused || (w.autoplayTimeoutId && clearTimeout(w.autoplayTimeoutId), w.autoplayPaused = !0, 
                    0 === e ? (w.autoplayPaused = !1, o()) : w.wrapper.transitionEnd(function() {
                        w && (w.autoplayPaused = !1, w.autoplaying ? o() : w.stopAutoplay());
                    }));
                }, w.minTranslate = function() {
                    return -w.snapGrid[0];
                }, w.maxTranslate = function() {
                    return -w.snapGrid[w.snapGrid.length - 1];
                }, w.updateContainerSize = function() {
                    var e, a;
                    e = "undefined" != typeof w.params.width ? w.params.width : w.container[0].clientWidth, 
                    a = "undefined" != typeof w.params.height ? w.params.height : w.container[0].clientHeight, 
                    0 === e && i() || 0 === a && !i() || (e = e - parseInt(w.container.css("padding-left"), 10) - parseInt(w.container.css("padding-right"), 10), 
                    a = a - parseInt(w.container.css("padding-top"), 10) - parseInt(w.container.css("padding-bottom"), 10), 
                    w.width = e, w.height = a, w.size = i() ? w.width : w.height);
                }, w.updateSlidesSize = function() {
                    w.slides = w.wrapper.children("." + w.params.slideClass), w.snapGrid = [], w.slidesGrid = [], 
                    w.slidesSizesGrid = [];
                    var e, a = w.params.spaceBetween, t = -w.params.slidesOffsetBefore, r = 0, s = 0;
                    "string" == typeof a && a.indexOf("%") >= 0 && (a = parseFloat(a.replace("%", "")) / 100 * w.size), 
                    w.virtualSize = -a, w.slides.css(w.rtl ? {
                        marginLeft: "",
                        marginTop: ""
                    } : {
                        marginRight: "",
                        marginBottom: ""
                    });
                    var o;
                    w.params.slidesPerColumn > 1 && (o = Math.floor(w.slides.length / w.params.slidesPerColumn) === w.slides.length / w.params.slidesPerColumn ? w.slides.length : Math.ceil(w.slides.length / w.params.slidesPerColumn) * w.params.slidesPerColumn);
                    var l, d = w.params.slidesPerColumn, p = o / d, u = p - (w.params.slidesPerColumn * p - w.slides.length);
                    for (e = 0; e < w.slides.length; e++) {
                        l = 0;
                        var c = w.slides.eq(e);
                        if (w.params.slidesPerColumn > 1) {
                            var m, f, h;
                            "column" === w.params.slidesPerColumnFill ? (f = Math.floor(e / d), h = e - f * d, 
                            (f > u || f === u && h === d - 1) && ++h >= d && (h = 0, f++), m = f + h * o / d, 
                            c.css({
                                "-webkit-box-ordinal-group": m,
                                "-moz-box-ordinal-group": m,
                                "-ms-flex-order": m,
                                "-webkit-order": m,
                                order: m
                            })) : (h = Math.floor(e / p), f = e - h * p), c.css({
                                "margin-top": 0 !== h && w.params.spaceBetween && w.params.spaceBetween + "px"
                            }).attr("data-swiper-column", f).attr("data-swiper-row", h);
                        }
                        "none" !== c.css("display") && ("auto" === w.params.slidesPerView ? (l = i() ? c.outerWidth(!0) : c.outerHeight(!0), 
                        w.params.roundLengths && (l = n(l))) : (l = (w.size - (w.params.slidesPerView - 1) * a) / w.params.slidesPerView, 
                        w.params.roundLengths && (l = n(l)), i() ? w.slides[e].style.width = l + "px" : w.slides[e].style.height = l + "px"), 
                        w.slides[e].swiperSlideSize = l, w.slidesSizesGrid.push(l), w.params.centeredSlides ? (t = t + l / 2 + r / 2 + a, 
                        0 === e && (t = t - w.size / 2 - a), Math.abs(t) < .001 && (t = 0), s % w.params.slidesPerGroup === 0 && w.snapGrid.push(t), 
                        w.slidesGrid.push(t)) : (s % w.params.slidesPerGroup === 0 && w.snapGrid.push(t), 
                        w.slidesGrid.push(t), t = t + l + a), w.virtualSize += l + a, r = l, s++);
                    }
                    w.virtualSize = Math.max(w.virtualSize, w.size) + w.params.slidesOffsetAfter;
                    var g;
                    if (w.rtl && w.wrongRTL && ("slide" === w.params.effect || "coverflow" === w.params.effect) && w.wrapper.css({
                        width: w.virtualSize + w.params.spaceBetween + "px"
                    }), (!w.support.flexbox || w.params.setWrapperSize) && w.wrapper.css(i() ? {
                        width: w.virtualSize + w.params.spaceBetween + "px"
                    } : {
                        height: w.virtualSize + w.params.spaceBetween + "px"
                    }), w.params.slidesPerColumn > 1 && (w.virtualSize = (l + w.params.spaceBetween) * o, 
                    w.virtualSize = Math.ceil(w.virtualSize / w.params.slidesPerColumn) - w.params.spaceBetween, 
                    w.wrapper.css({
                        width: w.virtualSize + w.params.spaceBetween + "px"
                    }), w.params.centeredSlides)) {
                        for (g = [], e = 0; e < w.snapGrid.length; e++) w.snapGrid[e] < w.virtualSize + w.snapGrid[0] && g.push(w.snapGrid[e]);
                        w.snapGrid = g;
                    }
                    if (!w.params.centeredSlides) {
                        for (g = [], e = 0; e < w.snapGrid.length; e++) w.snapGrid[e] <= w.virtualSize - w.size && g.push(w.snapGrid[e]);
                        w.snapGrid = g, Math.floor(w.virtualSize - w.size) > Math.floor(w.snapGrid[w.snapGrid.length - 1]) && w.snapGrid.push(w.virtualSize - w.size);
                    }
                    0 === w.snapGrid.length && (w.snapGrid = [ 0 ]), 0 !== w.params.spaceBetween && w.slides.css(i() ? w.rtl ? {
                        marginLeft: a + "px"
                    } : {
                        marginRight: a + "px"
                    } : {
                        marginBottom: a + "px"
                    }), w.params.watchSlidesProgress && w.updateSlidesOffset();
                }, w.updateSlidesOffset = function() {
                    for (var e = 0; e < w.slides.length; e++) w.slides[e].swiperSlideOffset = i() ? w.slides[e].offsetLeft : w.slides[e].offsetTop;
                }, w.updateSlidesProgress = function(e) {
                    if ("undefined" == typeof e && (e = w.translate || 0), 0 !== w.slides.length) {
                        "undefined" == typeof w.slides[0].swiperSlideOffset && w.updateSlidesOffset();
                        var a = w.params.centeredSlides ? -e + w.size / 2 : -e;
                        w.rtl && (a = w.params.centeredSlides ? e - w.size / 2 : e);
                        {
                            w.container[0].getBoundingClientRect(), i() ? "left" : "top", i() ? "right" : "bottom";
                        }
                        w.slides.removeClass(w.params.slideVisibleClass);
                        for (var t = 0; t < w.slides.length; t++) {
                            var r = w.slides[t], s = w.params.centeredSlides === !0 ? r.swiperSlideSize / 2 : 0, n = (a - r.swiperSlideOffset - s) / (r.swiperSlideSize + w.params.spaceBetween);
                            if (w.params.watchSlidesVisibility) {
                                var o = -(a - r.swiperSlideOffset - s), l = o + w.slidesSizesGrid[t], d = o >= 0 && o < w.size || l > 0 && l <= w.size || 0 >= o && l >= w.size;
                                d && w.slides.eq(t).addClass(w.params.slideVisibleClass);
                            }
                            r.progress = w.rtl ? -n : n;
                        }
                    }
                }, w.updateProgress = function(e) {
                    "undefined" == typeof e && (e = w.translate || 0);
                    var a = w.maxTranslate() - w.minTranslate();
                    0 === a ? (w.progress = 0, w.isBeginning = w.isEnd = !0) : (w.progress = (e - w.minTranslate()) / a, 
                    w.isBeginning = w.progress <= 0, w.isEnd = w.progress >= 1), w.isBeginning && w.emit("onReachBeginning", w), 
                    w.isEnd && w.emit("onReachEnd", w), w.params.watchSlidesProgress && w.updateSlidesProgress(e), 
                    w.emit("onProgress", w, w.progress);
                }, w.updateActiveIndex = function() {
                    var e, a, t, r = w.rtl ? w.translate : -w.translate;
                    for (a = 0; a < w.slidesGrid.length; a++) "undefined" != typeof w.slidesGrid[a + 1] ? r >= w.slidesGrid[a] && r < w.slidesGrid[a + 1] - (w.slidesGrid[a + 1] - w.slidesGrid[a]) / 2 ? e = a : r >= w.slidesGrid[a] && r < w.slidesGrid[a + 1] && (e = a + 1) : r >= w.slidesGrid[a] && (e = a);
                    (0 > e || "undefined" == typeof e) && (e = 0), t = Math.floor(e / w.params.slidesPerGroup), 
                    t >= w.snapGrid.length && (t = w.snapGrid.length - 1), e !== w.activeIndex && (w.snapIndex = t, 
                    w.previousIndex = w.activeIndex, w.activeIndex = e, w.updateClasses());
                }, w.updateClasses = function() {
                    w.slides.removeClass(w.params.slideActiveClass + " " + w.params.slideNextClass + " " + w.params.slidePrevClass);
                    var e = w.slides.eq(w.activeIndex);
                    if (e.addClass(w.params.slideActiveClass), e.next("." + w.params.slideClass).addClass(w.params.slideNextClass), 
                    e.prev("." + w.params.slideClass).addClass(w.params.slidePrevClass), w.bullets && w.bullets.length > 0) {
                        w.bullets.removeClass(w.params.bulletActiveClass);
                        var t;
                        w.params.loop ? (t = Math.ceil(w.activeIndex - w.loopedSlides) / w.params.slidesPerGroup, 
                        t > w.slides.length - 1 - 2 * w.loopedSlides && (t -= w.slides.length - 2 * w.loopedSlides), 
                        t > w.bullets.length - 1 && (t -= w.bullets.length)) : t = "undefined" != typeof w.snapIndex ? w.snapIndex : w.activeIndex || 0, 
                        w.paginationContainer.length > 1 ? w.bullets.each(function() {
                            a(this).index() === t && a(this).addClass(w.params.bulletActiveClass);
                        }) : w.bullets.eq(t).addClass(w.params.bulletActiveClass);
                    }
                    w.params.loop || (w.params.prevButton && (w.isBeginning ? (a(w.params.prevButton).addClass(w.params.buttonDisabledClass), 
                    w.params.a11y && w.a11y && w.a11y.disable(a(w.params.prevButton))) : (a(w.params.prevButton).removeClass(w.params.buttonDisabledClass), 
                    w.params.a11y && w.a11y && w.a11y.enable(a(w.params.prevButton)))), w.params.nextButton && (w.isEnd ? (a(w.params.nextButton).addClass(w.params.buttonDisabledClass), 
                    w.params.a11y && w.a11y && w.a11y.disable(a(w.params.nextButton))) : (a(w.params.nextButton).removeClass(w.params.buttonDisabledClass), 
                    w.params.a11y && w.a11y && w.a11y.enable(a(w.params.nextButton)))));
                }, w.updatePagination = function() {
                    if (w.params.pagination && w.paginationContainer && w.paginationContainer.length > 0) {
                        for (var e = "", a = w.params.loop ? Math.ceil((w.slides.length - 2 * w.loopedSlides) / w.params.slidesPerGroup) : w.snapGrid.length, t = 0; a > t; t++) e += w.params.paginationBulletRender ? w.params.paginationBulletRender(t, w.params.bulletClass) : "<" + w.params.paginationElement + ' class="' + w.params.bulletClass + '"></' + w.params.paginationElement + ">";
                        w.paginationContainer.html(e), w.bullets = w.paginationContainer.find("." + w.params.bulletClass), 
                        w.params.paginationClickable && w.params.a11y && w.a11y && w.a11y.initPagination();
                    }
                }, w.update = function(e) {
                    function a() {
                        r = Math.min(Math.max(w.translate, w.maxTranslate()), w.minTranslate()), w.setWrapperTranslate(r), 
                        w.updateActiveIndex(), w.updateClasses();
                    }
                    if (w.updateContainerSize(), w.updateSlidesSize(), w.updateProgress(), w.updatePagination(), 
                    w.updateClasses(), w.params.scrollbar && w.scrollbar && w.scrollbar.set(), e) {
                        var t, r;
                        w.controller && w.controller.spline && (w.controller.spline = void 0), w.params.freeMode ? a() : (t = ("auto" === w.params.slidesPerView || w.params.slidesPerView > 1) && w.isEnd && !w.params.centeredSlides ? w.slideTo(w.slides.length - 1, 0, !1, !0) : w.slideTo(w.activeIndex, 0, !1, !0), 
                        t || a());
                    }
                }, w.onResize = function(e) {
                    var a = w.params.allowSwipeToPrev, t = w.params.allowSwipeToNext;
                    if (w.params.allowSwipeToPrev = w.params.allowSwipeToNext = !0, w.updateContainerSize(), 
                    w.updateSlidesSize(), ("auto" === w.params.slidesPerView || w.params.freeMode || e) && w.updatePagination(), 
                    w.params.scrollbar && w.scrollbar && w.scrollbar.set(), w.controller && w.controller.spline && (w.controller.spline = void 0), 
                    w.params.freeMode) {
                        var r = Math.min(Math.max(w.translate, w.maxTranslate()), w.minTranslate());
                        w.setWrapperTranslate(r), w.updateActiveIndex(), w.updateClasses();
                    } else w.updateClasses(), ("auto" === w.params.slidesPerView || w.params.slidesPerView > 1) && w.isEnd && !w.params.centeredSlides ? w.slideTo(w.slides.length - 1, 0, !1, !0) : w.slideTo(w.activeIndex, 0, !1, !0);
                    w.params.allowSwipeToPrev = a, w.params.allowSwipeToNext = t;
                };
                var y = [ "mousedown", "mousemove", "mouseup" ];
                window.navigator.pointerEnabled ? y = [ "pointerdown", "pointermove", "pointerup" ] : window.navigator.msPointerEnabled && (y = [ "MSPointerDown", "MSPointerMove", "MSPointerUp" ]), 
                w.touchEvents = {
                    start: w.support.touch || !w.params.simulateTouch ? "touchstart" : y[0],
                    move: w.support.touch || !w.params.simulateTouch ? "touchmove" : y[1],
                    end: w.support.touch || !w.params.simulateTouch ? "touchend" : y[2]
                }, (window.navigator.pointerEnabled || window.navigator.msPointerEnabled) && ("container" === w.params.touchEventsTarget ? w.container : w.wrapper).addClass("swiper-wp8-" + w.params.direction), 
                w.initEvents = function(e) {
                    var t = e ? "off" : "on", r = e ? "removeEventListener" : "addEventListener", i = "container" === w.params.touchEventsTarget ? w.container[0] : w.wrapper[0], n = w.support.touch ? i : document, o = w.params.nested ? !0 : !1;
                    w.browser.ie ? (i[r](w.touchEvents.start, w.onTouchStart, !1), n[r](w.touchEvents.move, w.onTouchMove, o), 
                    n[r](w.touchEvents.end, w.onTouchEnd, !1)) : (w.support.touch && (i[r](w.touchEvents.start, w.onTouchStart, !1), 
                    i[r](w.touchEvents.move, w.onTouchMove, o), i[r](w.touchEvents.end, w.onTouchEnd, !1)), 
                    !s.simulateTouch || w.device.ios || w.device.android || (i[r]("mousedown", w.onTouchStart, !1), 
                    document[r]("mousemove", w.onTouchMove, o), document[r]("mouseup", w.onTouchEnd, !1))), 
                    window[r]("resize", w.onResize), w.params.nextButton && (a(w.params.nextButton)[t]("click", w.onClickNext), 
                    w.params.a11y && w.a11y && a(w.params.nextButton)[t]("keydown", w.a11y.onEnterKey)), 
                    w.params.prevButton && (a(w.params.prevButton)[t]("click", w.onClickPrev), w.params.a11y && w.a11y && a(w.params.prevButton)[t]("keydown", w.a11y.onEnterKey)), 
                    w.params.pagination && w.params.paginationClickable && (a(w.paginationContainer)[t]("click", "." + w.params.bulletClass, w.onClickIndex), 
                    w.params.a11y && w.a11y && a(w.paginationContainer)[t]("keydown", "." + w.params.bulletClass, w.a11y.onEnterKey)), 
                    (w.params.preventClicks || w.params.preventClicksPropagation) && i[r]("click", w.preventClicks, !0);
                }, w.attachEvents = function(e) {
                    w.initEvents();
                }, w.detachEvents = function() {
                    w.initEvents(!0);
                }, w.allowClick = !0, w.preventClicks = function(e) {
                    w.allowClick || (w.params.preventClicks && e.preventDefault(), w.params.preventClicksPropagation && w.animating && (e.stopPropagation(), 
                    e.stopImmediatePropagation()));
                }, w.onClickNext = function(e) {
                    e.preventDefault(), (!w.isEnd || w.params.loop) && w.slideNext();
                }, w.onClickPrev = function(e) {
                    e.preventDefault(), (!w.isBeginning || w.params.loop) && w.slidePrev();
                }, w.onClickIndex = function(e) {
                    e.preventDefault();
                    var t = a(this).index() * w.params.slidesPerGroup;
                    w.params.loop && (t += w.loopedSlides), w.slideTo(t);
                }, w.updateClickedSlide = function(e) {
                    var t = l(e, "." + w.params.slideClass), r = !1;
                    if (t) for (var s = 0; s < w.slides.length; s++) w.slides[s] === t && (r = !0);
                    if (!t || !r) return w.clickedSlide = void 0, void (w.clickedIndex = void 0);
                    if (w.clickedSlide = t, w.clickedIndex = a(t).index(), w.params.slideToClickedSlide && void 0 !== w.clickedIndex && w.clickedIndex !== w.activeIndex) {
                        var i, n = w.clickedIndex;
                        if (w.params.loop) if (i = a(w.clickedSlide).attr("data-swiper-slide-index"), n > w.slides.length - w.params.slidesPerView) w.fixLoop(), 
                        n = w.wrapper.children("." + w.params.slideClass + '[data-swiper-slide-index="' + i + '"]').eq(0).index(), 
                        setTimeout(function() {
                            w.slideTo(n);
                        }, 0); else if (n < w.params.slidesPerView - 1) {
                            w.fixLoop();
                            var o = w.wrapper.children("." + w.params.slideClass + '[data-swiper-slide-index="' + i + '"]');
                            n = o.eq(o.length - 1).index(), setTimeout(function() {
                                w.slideTo(n);
                            }, 0);
                        } else w.slideTo(n); else w.slideTo(n);
                    }
                };
                var b, x, T, S, C, M, E, P, z, I = "input, select, textarea, button", k = Date.now(), L = [];
                w.animating = !1, w.touches = {
                    startX: 0,
                    startY: 0,
                    currentX: 0,
                    currentY: 0,
                    diff: 0
                };
                var D, B;
                if (w.onTouchStart = function(e) {
                    if (e.originalEvent && (e = e.originalEvent), D = "touchstart" === e.type, D || !("which" in e) || 3 !== e.which) {
                        if (w.params.noSwiping && l(e, "." + w.params.noSwipingClass)) return void (w.allowClick = !0);
                        if (!w.params.swipeHandler || l(e, w.params.swipeHandler)) {
                            if (b = !0, x = !1, S = void 0, B = void 0, w.touches.startX = w.touches.currentX = "touchstart" === e.type ? e.targetTouches[0].pageX : e.pageX, 
                            w.touches.startY = w.touches.currentY = "touchstart" === e.type ? e.targetTouches[0].pageY : e.pageY, 
                            T = Date.now(), w.allowClick = !0, w.updateContainerSize(), w.swipeDirection = void 0, 
                            w.params.threshold > 0 && (E = !1), "touchstart" !== e.type) {
                                var t = !0;
                                a(e.target).is(I) && (t = !1), document.activeElement && a(document.activeElement).is(I) && document.activeElement.blur(), 
                                t && e.preventDefault();
                            }
                            w.emit("onTouchStart", w, e);
                        }
                    }
                }, w.onTouchMove = function(e) {
                    if (e.originalEvent && (e = e.originalEvent), !(D && "mousemove" === e.type || e.preventedByNestedSwiper)) {
                        if (w.params.onlyExternal) return w.allowClick = !1, void (b && (w.touches.startX = w.touches.currentX = "touchmove" === e.type ? e.targetTouches[0].pageX : e.pageX, 
                        w.touches.startY = w.touches.currentY = "touchmove" === e.type ? e.targetTouches[0].pageY : e.pageY, 
                        T = Date.now()));
                        if (D && document.activeElement && e.target === document.activeElement && a(e.target).is(I)) return x = !0, 
                        void (w.allowClick = !1);
                        if (w.emit("onTouchMove", w, e), !(e.targetTouches && e.targetTouches.length > 1)) {
                            if (w.touches.currentX = "touchmove" === e.type ? e.targetTouches[0].pageX : e.pageX, 
                            w.touches.currentY = "touchmove" === e.type ? e.targetTouches[0].pageY : e.pageY, 
                            "undefined" == typeof S) {
                                var t = 180 * Math.atan2(Math.abs(w.touches.currentY - w.touches.startY), Math.abs(w.touches.currentX - w.touches.startX)) / Math.PI;
                                S = i() ? t > w.params.touchAngle : 90 - t > w.params.touchAngle;
                            }
                            if (S && w.emit("onTouchMoveOpposite", w, e), "undefined" == typeof B && w.browser.ieTouch && (w.touches.currentX !== w.touches.startX || w.touches.currentY !== w.touches.startY) && (B = !0), 
                            b) {
                                if (S) return void (b = !1);
                                if (B || !w.browser.ieTouch) {
                                    w.allowClick = !1, w.emit("onSliderMove", w, e), e.preventDefault(), w.params.touchMoveStopPropagation && !w.params.nested && e.stopPropagation(), 
                                    x || (s.loop && w.fixLoop(), M = w.getWrapperTranslate(), w.setWrapperTransition(0), 
                                    w.animating && w.wrapper.trigger("webkitTransitionEnd transitionend oTransitionEnd MSTransitionEnd msTransitionEnd"), 
                                    w.params.autoplay && w.autoplaying && (w.params.autoplayDisableOnInteraction ? w.stopAutoplay() : w.pauseAutoplay()), 
                                    z = !1, w.params.grabCursor && (w.container[0].style.cursor = "move", w.container[0].style.cursor = "-webkit-grabbing", 
                                    w.container[0].style.cursor = "-moz-grabbin", w.container[0].style.cursor = "grabbing")), 
                                    x = !0;
                                    var r = w.touches.diff = i() ? w.touches.currentX - w.touches.startX : w.touches.currentY - w.touches.startY;
                                    r *= w.params.touchRatio, w.rtl && (r = -r), w.swipeDirection = r > 0 ? "prev" : "next", 
                                    C = r + M;
                                    var n = !0;
                                    if (r > 0 && C > w.minTranslate() ? (n = !1, w.params.resistance && (C = w.minTranslate() - 1 + Math.pow(-w.minTranslate() + M + r, w.params.resistanceRatio))) : 0 > r && C < w.maxTranslate() && (n = !1, 
                                    w.params.resistance && (C = w.maxTranslate() + 1 - Math.pow(w.maxTranslate() - M - r, w.params.resistanceRatio))), 
                                    n && (e.preventedByNestedSwiper = !0), !w.params.allowSwipeToNext && "next" === w.swipeDirection && M > C && (C = M), 
                                    !w.params.allowSwipeToPrev && "prev" === w.swipeDirection && C > M && (C = M), w.params.followFinger) {
                                        if (w.params.threshold > 0) {
                                            if (!(Math.abs(r) > w.params.threshold || E)) return void (C = M);
                                            if (!E) return E = !0, w.touches.startX = w.touches.currentX, w.touches.startY = w.touches.currentY, 
                                            C = M, void (w.touches.diff = i() ? w.touches.currentX - w.touches.startX : w.touches.currentY - w.touches.startY);
                                        }
                                        (w.params.freeMode || w.params.watchSlidesProgress) && w.updateActiveIndex(), w.params.freeMode && (0 === L.length && L.push({
                                            position: w.touches[i() ? "startX" : "startY"],
                                            time: T
                                        }), L.push({
                                            position: w.touches[i() ? "currentX" : "currentY"],
                                            time: new window.Date().getTime()
                                        })), w.updateProgress(C), w.setWrapperTranslate(C);
                                    }
                                }
                            }
                        }
                    }
                }, w.onTouchEnd = function(e) {
                    if (e.originalEvent && (e = e.originalEvent), w.emit("onTouchEnd", w, e), b) {
                        w.params.grabCursor && x && b && (w.container[0].style.cursor = "move", w.container[0].style.cursor = "-webkit-grab", 
                        w.container[0].style.cursor = "-moz-grab", w.container[0].style.cursor = "grab");
                        var t = Date.now(), r = t - T;
                        if (w.allowClick && (w.updateClickedSlide(e), w.emit("onTap", w, e), 300 > r && t - k > 300 && (P && clearTimeout(P), 
                        P = setTimeout(function() {
                            w && (w.params.paginationHide && w.paginationContainer.length > 0 && !a(e.target).hasClass(w.params.bulletClass) && w.paginationContainer.toggleClass(w.params.paginationHiddenClass), 
                            w.emit("onClick", w, e));
                        }, 300)), 300 > r && 300 > t - k && (P && clearTimeout(P), w.emit("onDoubleTap", w, e))), 
                        k = Date.now(), setTimeout(function() {
                            w && (w.allowClick = !0);
                        }, 0), !b || !x || !w.swipeDirection || 0 === w.touches.diff || C === M) return void (b = x = !1);
                        b = x = !1;
                        var s;
                        if (s = w.params.followFinger ? w.rtl ? w.translate : -w.translate : -C, w.params.freeMode) {
                            if (s < -w.minTranslate()) return void w.slideTo(w.activeIndex);
                            if (s > -w.maxTranslate()) return void w.slideTo(w.slides.length < w.snapGrid.length ? w.snapGrid.length - 1 : w.slides.length - 1);
                            if (w.params.freeModeMomentum) {
                                if (L.length > 1) {
                                    var i = L.pop(), n = L.pop(), o = i.position - n.position, l = i.time - n.time;
                                    w.velocity = o / l, w.velocity = w.velocity / 2, Math.abs(w.velocity) < .02 && (w.velocity = 0), 
                                    (l > 150 || new window.Date().getTime() - i.time > 300) && (w.velocity = 0);
                                } else w.velocity = 0;
                                L.length = 0;
                                var d = 1e3 * w.params.freeModeMomentumRatio, p = w.velocity * d, u = w.translate + p;
                                w.rtl && (u = -u);
                                var c, m = !1, f = 20 * Math.abs(w.velocity) * w.params.freeModeMomentumBounceRatio;
                                if (u < w.maxTranslate()) w.params.freeModeMomentumBounce ? (u + w.maxTranslate() < -f && (u = w.maxTranslate() - f), 
                                c = w.maxTranslate(), m = !0, z = !0) : u = w.maxTranslate(); else if (u > w.minTranslate()) w.params.freeModeMomentumBounce ? (u - w.minTranslate() > f && (u = w.minTranslate() + f), 
                                c = w.minTranslate(), m = !0, z = !0) : u = w.minTranslate(); else if (w.params.freeModeSticky) {
                                    var h, g = 0;
                                    for (g = 0; g < w.snapGrid.length; g += 1) if (w.snapGrid[g] > -u) {
                                        h = g;
                                        break;
                                    }
                                    u = Math.abs(w.snapGrid[h] - u) < Math.abs(w.snapGrid[h - 1] - u) || "next" === w.swipeDirection ? w.snapGrid[h] : w.snapGrid[h - 1], 
                                    w.rtl || (u = -u);
                                }
                                if (0 !== w.velocity) d = Math.abs(w.rtl ? (-u - w.translate) / w.velocity : (u - w.translate) / w.velocity); else if (w.params.freeModeSticky) return void w.slideReset();
                                w.params.freeModeMomentumBounce && m ? (w.updateProgress(c), w.setWrapperTransition(d), 
                                w.setWrapperTranslate(u), w.onTransitionStart(), w.animating = !0, w.wrapper.transitionEnd(function() {
                                    w && z && (w.emit("onMomentumBounce", w), w.setWrapperTransition(w.params.speed), 
                                    w.setWrapperTranslate(c), w.wrapper.transitionEnd(function() {
                                        w && w.onTransitionEnd();
                                    }));
                                })) : w.velocity ? (w.updateProgress(u), w.setWrapperTransition(d), w.setWrapperTranslate(u), 
                                w.onTransitionStart(), w.animating || (w.animating = !0, w.wrapper.transitionEnd(function() {
                                    w && w.onTransitionEnd();
                                }))) : w.updateProgress(u), w.updateActiveIndex();
                            }
                            return void ((!w.params.freeModeMomentum || r >= w.params.longSwipesMs) && (w.updateProgress(), 
                            w.updateActiveIndex()));
                        }
                        var v, y = 0, S = w.slidesSizesGrid[0];
                        for (v = 0; v < w.slidesGrid.length; v += w.params.slidesPerGroup) "undefined" != typeof w.slidesGrid[v + w.params.slidesPerGroup] ? s >= w.slidesGrid[v] && s < w.slidesGrid[v + w.params.slidesPerGroup] && (y = v, 
                        S = w.slidesGrid[v + w.params.slidesPerGroup] - w.slidesGrid[v]) : s >= w.slidesGrid[v] && (y = v, 
                        S = w.slidesGrid[w.slidesGrid.length - 1] - w.slidesGrid[w.slidesGrid.length - 2]);
                        var E = (s - w.slidesGrid[y]) / S;
                        if (r > w.params.longSwipesMs) {
                            if (!w.params.longSwipes) return void w.slideTo(w.activeIndex);
                            "next" === w.swipeDirection && w.slideTo(E >= w.params.longSwipesRatio ? y + w.params.slidesPerGroup : y), 
                            "prev" === w.swipeDirection && w.slideTo(E > 1 - w.params.longSwipesRatio ? y + w.params.slidesPerGroup : y);
                        } else {
                            if (!w.params.shortSwipes) return void w.slideTo(w.activeIndex);
                            "next" === w.swipeDirection && w.slideTo(y + w.params.slidesPerGroup), "prev" === w.swipeDirection && w.slideTo(y);
                        }
                    }
                }, w._slideTo = function(e, a) {
                    return w.slideTo(e, a, !0, !0);
                }, w.slideTo = function(e, a, t, r) {
                    "undefined" == typeof t && (t = !0), "undefined" == typeof e && (e = 0), 0 > e && (e = 0), 
                    w.snapIndex = Math.floor(e / w.params.slidesPerGroup), w.snapIndex >= w.snapGrid.length && (w.snapIndex = w.snapGrid.length - 1);
                    var s = -w.snapGrid[w.snapIndex];
                    if (!w.params.allowSwipeToNext && s < w.translate && s < w.minTranslate()) return !1;
                    if (!w.params.allowSwipeToPrev && s > w.translate && s > w.maxTranslate()) return !1;
                    w.params.autoplay && w.autoplaying && (r || !w.params.autoplayDisableOnInteraction ? w.pauseAutoplay(a) : w.stopAutoplay()), 
                    w.updateProgress(s);
                    for (var n = 0; n < w.slidesGrid.length; n++) -Math.floor(100 * s) >= Math.floor(100 * w.slidesGrid[n]) && (e = n);
                    if ("undefined" == typeof a && (a = w.params.speed), w.previousIndex = w.activeIndex || 0, 
                    w.activeIndex = e, s === w.translate) return w.updateClasses(), !1;
                    w.updateClasses(), w.onTransitionStart(t);
                    i() ? s : 0, i() ? 0 : s;
                    return 0 === a ? (w.setWrapperTransition(0), w.setWrapperTranslate(s), w.onTransitionEnd(t)) : (w.setWrapperTransition(a), 
                    w.setWrapperTranslate(s), w.animating || (w.animating = !0, w.wrapper.transitionEnd(function() {
                        w && w.onTransitionEnd(t);
                    }))), !0;
                }, w.onTransitionStart = function(e) {
                    "undefined" == typeof e && (e = !0), w.lazy && w.lazy.onTransitionStart(), e && (w.emit("onTransitionStart", w), 
                    w.activeIndex !== w.previousIndex && w.emit("onSlideChangeStart", w));
                }, w.onTransitionEnd = function(e) {
                    w.animating = !1, w.setWrapperTransition(0), "undefined" == typeof e && (e = !0), 
                    w.lazy && w.lazy.onTransitionEnd(), e && (w.emit("onTransitionEnd", w), w.activeIndex !== w.previousIndex && w.emit("onSlideChangeEnd", w)), 
                    w.params.hashnav && w.hashnav && w.hashnav.setHash();
                }, w.slideNext = function(e, a, t) {
                    if (w.params.loop) {
                        if (w.animating) return !1;
                        w.fixLoop();
                        {
                            w.container[0].clientLeft;
                        }
                        return w.slideTo(w.activeIndex + w.params.slidesPerGroup, a, e, t);
                    }
                    return w.slideTo(w.activeIndex + w.params.slidesPerGroup, a, e, t);
                }, w._slideNext = function(e) {
                    return w.slideNext(!0, e, !0);
                }, w.slidePrev = function(e, a, t) {
                    if (w.params.loop) {
                        if (w.animating) return !1;
                        w.fixLoop();
                        {
                            w.container[0].clientLeft;
                        }
                        return w.slideTo(w.activeIndex - 1, a, e, t);
                    }
                    return w.slideTo(w.activeIndex - 1, a, e, t);
                }, w._slidePrev = function(e) {
                    return w.slidePrev(!0, e, !0);
                }, w.slideReset = function(e, a, t) {
                    return w.slideTo(w.activeIndex, a, e);
                }, w.setWrapperTransition = function(e, a) {
                    w.wrapper.transition(e), "slide" !== w.params.effect && w.effects[w.params.effect] && w.effects[w.params.effect].setTransition(e), 
                    w.params.parallax && w.parallax && w.parallax.setTransition(e), w.params.scrollbar && w.scrollbar && w.scrollbar.setTransition(e), 
                    w.params.control && w.controller && w.controller.setTransition(e, a), w.emit("onSetTransition", w, e);
                }, w.setWrapperTranslate = function(e, a, t) {
                    var r = 0, s = 0, n = 0;
                    i() ? r = w.rtl ? -e : e : s = e, w.params.virtualTranslate || w.wrapper.transform(w.support.transforms3d ? "translate3d(" + r + "px, " + s + "px, " + n + "px)" : "translate(" + r + "px, " + s + "px)"), 
                    w.translate = i() ? r : s, a && w.updateActiveIndex(), "slide" !== w.params.effect && w.effects[w.params.effect] && w.effects[w.params.effect].setTranslate(w.translate), 
                    w.params.parallax && w.parallax && w.parallax.setTranslate(w.translate), w.params.scrollbar && w.scrollbar && w.scrollbar.setTranslate(w.translate), 
                    w.params.control && w.controller && w.controller.setTranslate(w.translate, t), w.emit("onSetTranslate", w, w.translate);
                }, w.getTranslate = function(e, a) {
                    var t, r, s, i;
                    return "undefined" == typeof a && (a = "x"), w.params.virtualTranslate ? w.rtl ? -w.translate : w.translate : (s = window.getComputedStyle(e, null), 
                    window.WebKitCSSMatrix ? i = new window.WebKitCSSMatrix("none" === s.webkitTransform ? "" : s.webkitTransform) : (i = s.MozTransform || s.OTransform || s.MsTransform || s.msTransform || s.transform || s.getPropertyValue("transform").replace("translate(", "matrix(1, 0, 0, 1,"), 
                    t = i.toString().split(",")), "x" === a && (r = window.WebKitCSSMatrix ? i.m41 : parseFloat(16 === t.length ? t[12] : t[4])), 
                    "y" === a && (r = window.WebKitCSSMatrix ? i.m42 : parseFloat(16 === t.length ? t[13] : t[5])), 
                    w.rtl && r && (r = -r), r || 0);
                }, w.getWrapperTranslate = function(e) {
                    return "undefined" == typeof e && (e = i() ? "x" : "y"), w.getTranslate(w.wrapper[0], e);
                }, w.observers = [], w.initObservers = function() {
                    if (w.params.observeParents) for (var e = w.container.parents(), a = 0; a < e.length; a++) d(e[a]);
                    d(w.container[0], {
                        childList: !1
                    }), d(w.wrapper[0], {
                        attributes: !1
                    });
                }, w.disconnectObservers = function() {
                    for (var e = 0; e < w.observers.length; e++) w.observers[e].disconnect();
                    w.observers = [];
                }, w.createLoop = function() {
                    w.wrapper.children("." + w.params.slideClass + "." + w.params.slideDuplicateClass).remove();
                    var e = w.wrapper.children("." + w.params.slideClass);
                    w.loopedSlides = parseInt(w.params.loopedSlides || w.params.slidesPerView, 10), 
                    w.loopedSlides = w.loopedSlides + w.params.loopAdditionalSlides, w.loopedSlides > e.length && (w.loopedSlides = e.length);
                    var t, r = [], s = [];
                    for (e.each(function(t, i) {
                        var n = a(this);
                        t < w.loopedSlides && s.push(i), t < e.length && t >= e.length - w.loopedSlides && r.push(i), 
                        n.attr("data-swiper-slide-index", t);
                    }), t = 0; t < s.length; t++) w.wrapper.append(a(s[t].cloneNode(!0)).addClass(w.params.slideDuplicateClass));
                    for (t = r.length - 1; t >= 0; t--) w.wrapper.prepend(a(r[t].cloneNode(!0)).addClass(w.params.slideDuplicateClass));
                }, w.destroyLoop = function() {
                    w.wrapper.children("." + w.params.slideClass + "." + w.params.slideDuplicateClass).remove(), 
                    w.slides.removeAttr("data-swiper-slide-index");
                }, w.fixLoop = function() {
                    var e;
                    w.activeIndex < w.loopedSlides ? (e = w.slides.length - 3 * w.loopedSlides + w.activeIndex, 
                    e += w.loopedSlides, w.slideTo(e, 0, !1, !0)) : ("auto" === w.params.slidesPerView && w.activeIndex >= 2 * w.loopedSlides || w.activeIndex > w.slides.length - 2 * w.params.slidesPerView) && (e = -w.slides.length + w.activeIndex + w.loopedSlides, 
                    e += w.loopedSlides, w.slideTo(e, 0, !1, !0));
                }, w.appendSlide = function(e) {
                    if (w.params.loop && w.destroyLoop(), "object" == typeof e && e.length) for (var a = 0; a < e.length; a++) e[a] && w.wrapper.append(e[a]); else w.wrapper.append(e);
                    w.params.loop && w.createLoop(), w.params.observer && w.support.observer || w.update(!0);
                }, w.prependSlide = function(e) {
                    w.params.loop && w.destroyLoop();
                    var a = w.activeIndex + 1;
                    if ("object" == typeof e && e.length) {
                        for (var t = 0; t < e.length; t++) e[t] && w.wrapper.prepend(e[t]);
                        a = w.activeIndex + e.length;
                    } else w.wrapper.prepend(e);
                    w.params.loop && w.createLoop(), w.params.observer && w.support.observer || w.update(!0), 
                    w.slideTo(a, 0, !1);
                }, w.removeSlide = function(e) {
                    w.params.loop && (w.destroyLoop(), w.slides = w.wrapper.children("." + w.params.slideClass));
                    var a, t = w.activeIndex;
                    if ("object" == typeof e && e.length) {
                        for (var r = 0; r < e.length; r++) a = e[r], w.slides[a] && w.slides.eq(a).remove(), 
                        t > a && t--;
                        t = Math.max(t, 0);
                    } else a = e, w.slides[a] && w.slides.eq(a).remove(), t > a && t--, t = Math.max(t, 0);
                    w.params.loop && w.createLoop(), w.params.observer && w.support.observer || w.update(!0), 
                    w.params.loop ? w.slideTo(t + w.loopedSlides, 0, !1) : w.slideTo(t, 0, !1);
                }, w.removeAllSlides = function() {
                    for (var e = [], a = 0; a < w.slides.length; a++) e.push(a);
                    w.removeSlide(e);
                }, w.effects = {
                    fade: {
                        setTranslate: function() {
                            for (var e = 0; e < w.slides.length; e++) {
                                var a = w.slides.eq(e), t = a[0].swiperSlideOffset, r = -t;
                                w.params.virtualTranslate || (r -= w.translate);
                                var s = 0;
                                i() || (s = r, r = 0);
                                var n = w.params.fade.crossFade ? Math.max(1 - Math.abs(a[0].progress), 0) : 1 + Math.min(Math.max(a[0].progress, -1), 0);
                                a.css({
                                    opacity: n
                                }).transform("translate3d(" + r + "px, " + s + "px, 0px)");
                            }
                        },
                        setTransition: function(e) {
                            if (w.slides.transition(e), w.params.virtualTranslate && 0 !== e) {
                                var a = !1;
                                w.slides.transitionEnd(function() {
                                    if (!a && w) {
                                        a = !0, w.animating = !1;
                                        for (var e = [ "webkitTransitionEnd", "transitionend", "oTransitionEnd", "MSTransitionEnd", "msTransitionEnd" ], t = 0; t < e.length; t++) w.wrapper.trigger(e[t]);
                                    }
                                });
                            }
                        }
                    },
                    cube: {
                        setTranslate: function() {
                            var e, t = 0;
                            w.params.cube.shadow && (i() ? (e = w.wrapper.find(".swiper-cube-shadow"), 0 === e.length && (e = a('<div class="swiper-cube-shadow"></div>'), 
                            w.wrapper.append(e)), e.css({
                                height: w.width + "px"
                            })) : (e = w.container.find(".swiper-cube-shadow"), 0 === e.length && (e = a('<div class="swiper-cube-shadow"></div>'), 
                            w.container.append(e))));
                            for (var r = 0; r < w.slides.length; r++) {
                                var s = w.slides.eq(r), n = 90 * r, o = Math.floor(n / 360);
                                w.rtl && (n = -n, o = Math.floor(-n / 360));
                                var l = Math.max(Math.min(s[0].progress, 1), -1), d = 0, p = 0, u = 0;
                                r % 4 === 0 ? (d = 4 * -o * w.size, u = 0) : (r - 1) % 4 === 0 ? (d = 0, u = 4 * -o * w.size) : (r - 2) % 4 === 0 ? (d = w.size + 4 * o * w.size, 
                                u = w.size) : (r - 3) % 4 === 0 && (d = -w.size, u = 3 * w.size + 4 * w.size * o), 
                                w.rtl && (d = -d), i() || (p = d, d = 0);
                                var c = "rotateX(" + (i() ? 0 : -n) + "deg) rotateY(" + (i() ? n : 0) + "deg) translate3d(" + d + "px, " + p + "px, " + u + "px)";
                                if (1 >= l && l > -1 && (t = 90 * r + 90 * l, w.rtl && (t = 90 * -r - 90 * l)), 
                                s.transform(c), w.params.cube.slideShadows) {
                                    var m = s.find(i() ? ".swiper-slide-shadow-left" : ".swiper-slide-shadow-top"), f = s.find(i() ? ".swiper-slide-shadow-right" : ".swiper-slide-shadow-bottom");
                                    0 === m.length && (m = a('<div class="swiper-slide-shadow-' + (i() ? "left" : "top") + '"></div>'), 
                                    s.append(m)), 0 === f.length && (f = a('<div class="swiper-slide-shadow-' + (i() ? "right" : "bottom") + '"></div>'), 
                                    s.append(f));
                                    {
                                        s[0].progress;
                                    }
                                    m.length && (m[0].style.opacity = -s[0].progress), f.length && (f[0].style.opacity = s[0].progress);
                                }
                            }
                            if (w.wrapper.css({
                                "-webkit-transform-origin": "50% 50% -" + w.size / 2 + "px",
                                "-moz-transform-origin": "50% 50% -" + w.size / 2 + "px",
                                "-ms-transform-origin": "50% 50% -" + w.size / 2 + "px",
                                "transform-origin": "50% 50% -" + w.size / 2 + "px"
                            }), w.params.cube.shadow) if (i()) e.transform("translate3d(0px, " + (w.width / 2 + w.params.cube.shadowOffset) + "px, " + -w.width / 2 + "px) rotateX(90deg) rotateZ(0deg) scale(" + w.params.cube.shadowScale + ")"); else {
                                var h = Math.abs(t) - 90 * Math.floor(Math.abs(t) / 90), g = 1.5 - (Math.sin(2 * h * Math.PI / 360) / 2 + Math.cos(2 * h * Math.PI / 360) / 2), v = w.params.cube.shadowScale, y = w.params.cube.shadowScale / g, b = w.params.cube.shadowOffset;
                                e.transform("scale3d(" + v + ", 1, " + y + ") translate3d(0px, " + (w.height / 2 + b) + "px, " + -w.height / 2 / y + "px) rotateX(-90deg)");
                            }
                            var x = w.isSafari || w.isUiWebView ? -w.size / 2 : 0;
                            w.wrapper.transform("translate3d(0px,0," + x + "px) rotateX(" + (i() ? 0 : t) + "deg) rotateY(" + (i() ? -t : 0) + "deg)");
                        },
                        setTransition: function(e) {
                            w.slides.transition(e).find(".swiper-slide-shadow-top, .swiper-slide-shadow-right, .swiper-slide-shadow-bottom, .swiper-slide-shadow-left").transition(e), 
                            w.params.cube.shadow && !i() && w.container.find(".swiper-cube-shadow").transition(e);
                        }
                    },
                    coverflow: {
                        setTranslate: function() {
                            for (var e = w.translate, t = i() ? -e + w.width / 2 : -e + w.height / 2, r = i() ? w.params.coverflow.rotate : -w.params.coverflow.rotate, s = w.params.coverflow.depth, n = 0, o = w.slides.length; o > n; n++) {
                                var l = w.slides.eq(n), d = w.slidesSizesGrid[n], p = l[0].swiperSlideOffset, u = (t - p - d / 2) / d * w.params.coverflow.modifier, c = i() ? r * u : 0, m = i() ? 0 : r * u, f = -s * Math.abs(u), h = i() ? 0 : w.params.coverflow.stretch * u, g = i() ? w.params.coverflow.stretch * u : 0;
                                Math.abs(g) < .001 && (g = 0), Math.abs(h) < .001 && (h = 0), Math.abs(f) < .001 && (f = 0), 
                                Math.abs(c) < .001 && (c = 0), Math.abs(m) < .001 && (m = 0);
                                var v = "translate3d(" + g + "px," + h + "px," + f + "px)  rotateX(" + m + "deg) rotateY(" + c + "deg)";
                                if (l.transform(v), l[0].style.zIndex = -Math.abs(Math.round(u)) + 1, w.params.coverflow.slideShadows) {
                                    var y = l.find(i() ? ".swiper-slide-shadow-left" : ".swiper-slide-shadow-top"), b = l.find(i() ? ".swiper-slide-shadow-right" : ".swiper-slide-shadow-bottom");
                                    0 === y.length && (y = a('<div class="swiper-slide-shadow-' + (i() ? "left" : "top") + '"></div>'), 
                                    l.append(y)), 0 === b.length && (b = a('<div class="swiper-slide-shadow-' + (i() ? "right" : "bottom") + '"></div>'), 
                                    l.append(b)), y.length && (y[0].style.opacity = u > 0 ? u : 0), b.length && (b[0].style.opacity = -u > 0 ? -u : 0);
                                }
                            }
                            if (w.browser.ie) {
                                var x = w.wrapper[0].style;
                                x.perspectiveOrigin = t + "px 50%";
                            }
                        },
                        setTransition: function(e) {
                            w.slides.transition(e).find(".swiper-slide-shadow-top, .swiper-slide-shadow-right, .swiper-slide-shadow-bottom, .swiper-slide-shadow-left").transition(e);
                        }
                    }
                }, w.lazy = {
                    initialImageLoaded: !1,
                    loadImageInSlide: function(e, t) {
                        if ("undefined" != typeof e && ("undefined" == typeof t && (t = !0), 0 !== w.slides.length)) {
                            var r = w.slides.eq(e), s = r.find(".swiper-lazy:not(.swiper-lazy-loaded):not(.swiper-lazy-loading)");
                            !r.hasClass("swiper-lazy") || r.hasClass("swiper-lazy-loaded") || r.hasClass("swiper-lazy-loading") || s.add(r[0]), 
                            0 !== s.length && s.each(function() {
                                var e = a(this);
                                e.addClass("swiper-lazy-loading");
                                var s = e.attr("data-background"), i = e.attr("data-src");
                                w.loadImage(e[0], i || s, !1, function() {
                                    if (s ? (e.css("background-image", "url(" + s + ")"), e.removeAttr("data-background")) : (e.attr("src", i), 
                                    e.removeAttr("data-src")), e.addClass("swiper-lazy-loaded").removeClass("swiper-lazy-loading"), 
                                    r.find(".swiper-lazy-preloader, .preloader").remove(), w.params.loop && t) {
                                        var a = r.attr("data-swiper-slide-index");
                                        if (r.hasClass(w.params.slideDuplicateClass)) {
                                            var n = w.wrapper.children('[data-swiper-slide-index="' + a + '"]:not(.' + w.params.slideDuplicateClass + ")");
                                            w.lazy.loadImageInSlide(n.index(), !1);
                                        } else {
                                            var o = w.wrapper.children("." + w.params.slideDuplicateClass + '[data-swiper-slide-index="' + a + '"]');
                                            w.lazy.loadImageInSlide(o.index(), !1);
                                        }
                                    }
                                    w.emit("onLazyImageReady", w, r[0], e[0]);
                                }), w.emit("onLazyImageLoad", w, r[0], e[0]);
                            });
                        }
                    },
                    load: function() {
                        var e;
                        if (w.params.watchSlidesVisibility) w.wrapper.children("." + w.params.slideVisibleClass).each(function() {
                            w.lazy.loadImageInSlide(a(this).index());
                        }); else if (w.params.slidesPerView > 1) for (e = w.activeIndex; e < w.activeIndex + w.params.slidesPerView; e++) w.slides[e] && w.lazy.loadImageInSlide(e); else w.lazy.loadImageInSlide(w.activeIndex);
                        if (w.params.lazyLoadingInPrevNext) if (w.params.slidesPerView > 1) {
                            for (e = w.activeIndex + w.params.slidesPerView; e < w.activeIndex + w.params.slidesPerView + w.params.slidesPerView; e++) w.slides[e] && w.lazy.loadImageInSlide(e);
                            for (e = w.activeIndex - w.params.slidesPerView; e < w.activeIndex; e++) w.slides[e] && w.lazy.loadImageInSlide(e);
                        } else {
                            var t = w.wrapper.children("." + w.params.slideNextClass);
                            t.length > 0 && w.lazy.loadImageInSlide(t.index());
                            var r = w.wrapper.children("." + w.params.slidePrevClass);
                            r.length > 0 && w.lazy.loadImageInSlide(r.index());
                        }
                    },
                    onTransitionStart: function() {
                        w.params.lazyLoading && (w.params.lazyLoadingOnTransitionStart || !w.params.lazyLoadingOnTransitionStart && !w.lazy.initialImageLoaded) && w.lazy.load();
                    },
                    onTransitionEnd: function() {
                        w.params.lazyLoading && !w.params.lazyLoadingOnTransitionStart && w.lazy.load();
                    }
                }, w.scrollbar = {
                    set: function() {
                        if (w.params.scrollbar) {
                            var e = w.scrollbar;
                            e.track = a(w.params.scrollbar), e.drag = e.track.find(".swiper-scrollbar-drag"), 
                            0 === e.drag.length && (e.drag = a('<div class="swiper-scrollbar-drag"></div>'), 
                            e.track.append(e.drag)), e.drag[0].style.width = "", e.drag[0].style.height = "", 
                            e.trackSize = i() ? e.track[0].offsetWidth : e.track[0].offsetHeight, e.divider = w.size / w.virtualSize, 
                            e.moveDivider = e.divider * (e.trackSize / w.size), e.dragSize = e.trackSize * e.divider, 
                            i() ? e.drag[0].style.width = e.dragSize + "px" : e.drag[0].style.height = e.dragSize + "px", 
                            e.track[0].style.display = e.divider >= 1 ? "none" : "", w.params.scrollbarHide && (e.track[0].style.opacity = 0);
                        }
                    },
                    setTranslate: function() {
                        if (w.params.scrollbar) {
                            var e, a = w.scrollbar, t = (w.translate || 0, a.dragSize);
                            e = (a.trackSize - a.dragSize) * w.progress, w.rtl && i() ? (e = -e, e > 0 ? (t = a.dragSize - e, 
                            e = 0) : -e + a.dragSize > a.trackSize && (t = a.trackSize + e)) : 0 > e ? (t = a.dragSize + e, 
                            e = 0) : e + a.dragSize > a.trackSize && (t = a.trackSize - e), i() ? (a.drag.transform(w.support.transforms3d ? "translate3d(" + e + "px, 0, 0)" : "translateX(" + e + "px)"), 
                            a.drag[0].style.width = t + "px") : (a.drag.transform(w.support.transforms3d ? "translate3d(0px, " + e + "px, 0)" : "translateY(" + e + "px)"), 
                            a.drag[0].style.height = t + "px"), w.params.scrollbarHide && (clearTimeout(a.timeout), 
                            a.track[0].style.opacity = 1, a.timeout = setTimeout(function() {
                                a.track[0].style.opacity = 0, a.track.transition(400);
                            }, 1e3));
                        }
                    },
                    setTransition: function(e) {
                        w.params.scrollbar && w.scrollbar.drag.transition(e);
                    }
                }, w.controller = {
                    LinearSpline: function(e, a) {
                        this.x = e, this.y = a, this.lastIndex = e.length - 1;
                        {
                            var t, r;
                            this.x.length;
                        }
                        this.interpolate = function(e) {
                            return e ? (r = s(this.x, e), t = r - 1, (e - this.x[t]) * (this.y[r] - this.y[t]) / (this.x[r] - this.x[t]) + this.y[t]) : 0;
                        };
                        var s = function() {
                            var e, a, t;
                            return function(r, s) {
                                for (a = -1, e = r.length; e - a > 1; ) r[t = e + a >> 1] <= s ? a = t : e = t;
                                return e;
                            };
                        }();
                    },
                    getInterpolateFunction: function(e) {
                        w.controller.spline || (w.controller.spline = w.params.loop ? new w.controller.LinearSpline(w.slidesGrid, e.slidesGrid) : new w.controller.LinearSpline(w.snapGrid, e.snapGrid));
                    },
                    setTranslate: function(e, a) {
                        function r(a) {
                            e = a.rtl && "horizontal" === a.params.direction ? -w.translate : w.translate, "slide" === w.params.controlBy && (w.controller.getInterpolateFunction(a), 
                            i = -w.controller.spline.interpolate(-e)), i && "container" !== w.params.controlBy || (s = (a.maxTranslate() - a.minTranslate()) / (w.maxTranslate() - w.minTranslate()), 
                            i = (e - w.minTranslate()) * s + a.minTranslate()), w.params.controlInverse && (i = a.maxTranslate() - i), 
                            a.updateProgress(i), a.setWrapperTranslate(i, !1, w), a.updateActiveIndex();
                        }
                        var s, i, n = w.params.control;
                        if (w.isArray(n)) for (var o = 0; o < n.length; o++) n[o] !== a && n[o] instanceof t && r(n[o]); else n instanceof t && a !== n && r(n);
                    },
                    setTransition: function(e, a) {
                        function r(a) {
                            a.setWrapperTransition(e, w), 0 !== e && (a.onTransitionStart(), a.wrapper.transitionEnd(function() {
                                i && (a.params.loop && "slide" === w.params.controlBy && a.fixLoop(), a.onTransitionEnd());
                            }));
                        }
                        var s, i = w.params.control;
                        if (w.isArray(i)) for (s = 0; s < i.length; s++) i[s] !== a && i[s] instanceof t && r(i[s]); else i instanceof t && a !== i && r(i);
                    }
                }, w.hashnav = {
                    init: function() {
                        if (w.params.hashnav) {
                            w.hashnav.initialized = !0;
                            var e = document.location.hash.replace("#", "");
                            if (e) for (var a = 0, t = 0, r = w.slides.length; r > t; t++) {
                                var s = w.slides.eq(t), i = s.attr("data-hash");
                                if (i === e && !s.hasClass(w.params.slideDuplicateClass)) {
                                    var n = s.index();
                                    w.slideTo(n, a, w.params.runCallbacksOnInit, !0);
                                }
                            }
                        }
                    },
                    setHash: function() {
                        w.hashnav.initialized && w.params.hashnav && (document.location.hash = w.slides.eq(w.activeIndex).attr("data-hash") || "");
                    }
                }, w.disableKeyboardControl = function() {
                    a(document).off("keydown", p);
                }, w.enableKeyboardControl = function() {
                    a(document).on("keydown", p);
                }, w.mousewheel = {
                    event: !1,
                    lastScrollTime: new window.Date().getTime()
                }, w.params.mousewheelControl) {
                    if (void 0 !== document.onmousewheel && (w.mousewheel.event = "mousewheel"), !w.mousewheel.event) try {
                        new window.WheelEvent("wheel"), w.mousewheel.event = "wheel";
                    } catch (G) {}
                    w.mousewheel.event || (w.mousewheel.event = "DOMMouseScroll");
                }
                w.disableMousewheelControl = function() {
                    return w.mousewheel.event ? (w.container.off(w.mousewheel.event, u), !0) : !1;
                }, w.enableMousewheelControl = function() {
                    return w.mousewheel.event ? (w.container.on(w.mousewheel.event, u), !0) : !1;
                }, w.parallax = {
                    setTranslate: function() {
                        w.container.children("[data-swiper-parallax], [data-swiper-parallax-x], [data-swiper-parallax-y]").each(function() {
                            c(this, w.progress);
                        }), w.slides.each(function() {
                            var e = a(this);
                            e.find("[data-swiper-parallax], [data-swiper-parallax-x], [data-swiper-parallax-y]").each(function() {
                                var a = Math.min(Math.max(e[0].progress, -1), 1);
                                c(this, a);
                            });
                        });
                    },
                    setTransition: function(e) {
                        "undefined" == typeof e && (e = w.params.speed), w.container.find("[data-swiper-parallax], [data-swiper-parallax-x], [data-swiper-parallax-y]").each(function() {
                            var t = a(this), r = parseInt(t.attr("data-swiper-parallax-duration"), 10) || e;
                            0 === e && (r = 0), t.transition(r);
                        });
                    }
                }, w._plugins = [];
                for (var O in w.plugins) {
                    var A = w.plugins[O](w, w.params[O]);
                    A && w._plugins.push(A);
                }
                return w.callPlugins = function(e) {
                    for (var a = 0; a < w._plugins.length; a++) e in w._plugins[a] && w._plugins[a][e](arguments[1], arguments[2], arguments[3], arguments[4], arguments[5]);
                }, w.emitterEventListeners = {}, w.emit = function(e) {
                    w.params[e] && w.params[e](arguments[1], arguments[2], arguments[3], arguments[4], arguments[5]);
                    var a;
                    if (w.emitterEventListeners[e]) for (a = 0; a < w.emitterEventListeners[e].length; a++) w.emitterEventListeners[e][a](arguments[1], arguments[2], arguments[3], arguments[4], arguments[5]);
                    w.callPlugins && w.callPlugins(e, arguments[1], arguments[2], arguments[3], arguments[4], arguments[5]);
                }, w.on = function(e, a) {
                    return e = m(e), w.emitterEventListeners[e] || (w.emitterEventListeners[e] = []), 
                    w.emitterEventListeners[e].push(a), w;
                }, w.off = function(e, a) {
                    var t;
                    if (e = m(e), "undefined" == typeof a) return w.emitterEventListeners[e] = [], w;
                    if (w.emitterEventListeners[e] && 0 !== w.emitterEventListeners[e].length) {
                        for (t = 0; t < w.emitterEventListeners[e].length; t++) w.emitterEventListeners[e][t] === a && w.emitterEventListeners[e].splice(t, 1);
                        return w;
                    }
                }, w.once = function(e, a) {
                    e = m(e);
                    var t = function() {
                        a(arguments[0], arguments[1], arguments[2], arguments[3], arguments[4]), w.off(e, t);
                    };
                    return w.on(e, t), w;
                }, w.a11y = {
                    makeFocusable: function(e) {
                        return e.attr("tabIndex", "0"), e;
                    },
                    addRole: function(e, a) {
                        return e.attr("role", a), e;
                    },
                    addLabel: function(e, a) {
                        return e.attr("aria-label", a), e;
                    },
                    disable: function(e) {
                        return e.attr("aria-disabled", !0), e;
                    },
                    enable: function(e) {
                        return e.attr("aria-disabled", !1), e;
                    },
                    onEnterKey: function(e) {
                        13 === e.keyCode && (a(e.target).is(w.params.nextButton) ? (w.onClickNext(e), w.a11y.notify(w.isEnd ? w.params.lastSlideMessage : w.params.nextSlideMessage)) : a(e.target).is(w.params.prevButton) && (w.onClickPrev(e), 
                        w.a11y.notify(w.isBeginning ? w.params.firstSlideMessage : w.params.prevSlideMessage)), 
                        a(e.target).is("." + w.params.bulletClass) && a(e.target)[0].click());
                    },
                    liveRegion: a('<span class="swiper-notification" aria-live="assertive" aria-atomic="true"></span>'),
                    notify: function(e) {
                        var a = w.a11y.liveRegion;
                        0 !== a.length && (a.html(""), a.html(e));
                    },
                    init: function() {
                        if (w.params.nextButton) {
                            var e = a(w.params.nextButton);
                            w.a11y.makeFocusable(e), w.a11y.addRole(e, "button"), w.a11y.addLabel(e, w.params.nextSlideMessage);
                        }
                        if (w.params.prevButton) {
                            var t = a(w.params.prevButton);
                            w.a11y.makeFocusable(t), w.a11y.addRole(t, "button"), w.a11y.addLabel(t, w.params.prevSlideMessage);
                        }
                        a(w.container).append(w.a11y.liveRegion);
                    },
                    initPagination: function() {
                        w.params.pagination && w.params.paginationClickable && w.bullets && w.bullets.length && w.bullets.each(function() {
                            var e = a(this);
                            w.a11y.makeFocusable(e), w.a11y.addRole(e, "button"), w.a11y.addLabel(e, w.params.paginationBulletMessage.replace(/{{index}}/, e.index() + 1));
                        });
                    },
                    destroy: function() {
                        w.a11y.liveRegion && w.a11y.liveRegion.length > 0 && w.a11y.liveRegion.remove();
                    }
                }, w.init = function() {
                    w.params.loop && w.createLoop(), w.updateContainerSize(), w.updateSlidesSize(), 
                    w.updatePagination(), w.params.scrollbar && w.scrollbar && w.scrollbar.set(), "slide" !== w.params.effect && w.effects[w.params.effect] && (w.params.loop || w.updateProgress(), 
                    w.effects[w.params.effect].setTranslate()), w.params.loop ? w.slideTo(w.params.initialSlide + w.loopedSlides, 0, w.params.runCallbacksOnInit) : (w.slideTo(w.params.initialSlide, 0, w.params.runCallbacksOnInit), 
                    0 === w.params.initialSlide && (w.parallax && w.params.parallax && w.parallax.setTranslate(), 
                    w.lazy && w.params.lazyLoading && (w.lazy.load(), w.lazy.initialImageLoaded = !0))), 
                    w.attachEvents(), w.params.observer && w.support.observer && w.initObservers(), 
                    w.params.preloadImages && !w.params.lazyLoading && w.preloadImages(), w.params.autoplay && w.startAutoplay(), 
                    w.params.keyboardControl && w.enableKeyboardControl && w.enableKeyboardControl(), 
                    w.params.mousewheelControl && w.enableMousewheelControl && w.enableMousewheelControl(), 
                    w.params.hashnav && w.hashnav && w.hashnav.init(), w.params.a11y && w.a11y && w.a11y.init(), 
                    w.emit("onInit", w);
                }, w.cleanupStyles = function() {
                    w.container.removeClass(w.classNames.join(" ")).removeAttr("style"), w.wrapper.removeAttr("style"), 
                    w.slides && w.slides.length && w.slides.removeClass([ w.params.slideVisibleClass, w.params.slideActiveClass, w.params.slideNextClass, w.params.slidePrevClass ].join(" ")).removeAttr("style").removeAttr("data-swiper-column").removeAttr("data-swiper-row"), 
                    w.paginationContainer && w.paginationContainer.length && w.paginationContainer.removeClass(w.params.paginationHiddenClass), 
                    w.bullets && w.bullets.length && w.bullets.removeClass(w.params.bulletActiveClass), 
                    w.params.prevButton && a(w.params.prevButton).removeClass(w.params.buttonDisabledClass), 
                    w.params.nextButton && a(w.params.nextButton).removeClass(w.params.buttonDisabledClass), 
                    w.params.scrollbar && w.scrollbar && (w.scrollbar.track && w.scrollbar.track.length && w.scrollbar.track.removeAttr("style"), 
                    w.scrollbar.drag && w.scrollbar.drag.length && w.scrollbar.drag.removeAttr("style"));
                }, w.destroy = function(e, a) {
                    w.detachEvents(), w.stopAutoplay(), w.params.loop && w.destroyLoop(), a && w.cleanupStyles(), 
                    w.disconnectObservers(), w.params.keyboardControl && w.disableKeyboardControl && w.disableKeyboardControl(), 
                    w.params.mousewheelControl && w.disableMousewheelControl && w.disableMousewheelControl(), 
                    w.params.a11y && w.a11y && w.a11y.destroy(), w.emit("onDestroy"), e !== !1 && (w = null);
                }, w.init(), w;
            }
        };
        t.prototype = {
            isSafari: function() {
                var e = navigator.userAgent.toLowerCase();
                return e.indexOf("safari") >= 0 && e.indexOf("chrome") < 0 && e.indexOf("android") < 0;
            }(),
            isUiWebView: /(iPhone|iPod|iPad).*AppleWebKit(?!.*Safari)/i.test(navigator.userAgent),
            isArray: function(e) {
                return "[object Array]" === Object.prototype.toString.apply(e);
            },
            browser: {
                ie: window.navigator.pointerEnabled || window.navigator.msPointerEnabled,
                ieTouch: window.navigator.msPointerEnabled && window.navigator.msMaxTouchPoints > 1 || window.navigator.pointerEnabled && window.navigator.maxTouchPoints > 1
            },
            device: function() {
                var e = navigator.userAgent, a = e.match(/(Android);?[\s\/]+([\d.]+)?/), t = e.match(/(iPad).*OS\s([\d_]+)/), r = e.match(/(iPod)(.*OS\s([\d_]+))?/), s = !t && e.match(/(iPhone\sOS)\s([\d_]+)/);
                return {
                    ios: t || s || r,
                    android: a
                };
            }(),
            support: {
                touch: window.Modernizr && Modernizr.touch === !0 || function() {
                    return !!("ontouchstart" in window || window.DocumentTouch && document instanceof DocumentTouch);
                }(),
                transforms3d: window.Modernizr && Modernizr.csstransforms3d === !0 || function() {
                    var e = document.createElement("div").style;
                    return "webkitPerspective" in e || "MozPerspective" in e || "OPerspective" in e || "MsPerspective" in e || "perspective" in e;
                }(),
                flexbox: function() {
                    for (var e = document.createElement("div").style, a = "alignItems webkitAlignItems webkitBoxAlign msFlexAlign mozBoxAlign webkitFlexDirection msFlexDirection mozBoxDirection mozBoxOrient webkitBoxDirection webkitBoxOrient".split(" "), t = 0; t < a.length; t++) if (a[t] in e) return !0;
                }(),
                observer: function() {
                    return "MutationObserver" in window || "WebkitMutationObserver" in window;
                }()
            },
            plugins: {}
        };
        for (var r = (function() {
            var e = function(e) {
                var a = this, t = 0;
                for (t = 0; t < e.length; t++) a[t] = e[t];
                return a.length = e.length, this;
            }, a = function(a, t) {
                var r = [], s = 0;
                if (a && !t && a instanceof e) return a;
                if (a) if ("string" == typeof a) {
                    var i, n, o = a.trim();
                    if (o.indexOf("<") >= 0 && o.indexOf(">") >= 0) {
                        var l = "div";
                        for (0 === o.indexOf("<li") && (l = "ul"), 0 === o.indexOf("<tr") && (l = "tbody"), 
                        (0 === o.indexOf("<td") || 0 === o.indexOf("<th")) && (l = "tr"), 0 === o.indexOf("<tbody") && (l = "table"), 
                        0 === o.indexOf("<option") && (l = "select"), n = document.createElement(l), n.innerHTML = a, 
                        s = 0; s < n.childNodes.length; s++) r.push(n.childNodes[s]);
                    } else for (i = t || "#" !== a[0] || a.match(/[ .<>:~]/) ? (t || document).querySelectorAll(a) : [ document.getElementById(a.split("#")[1]) ], 
                    s = 0; s < i.length; s++) i[s] && r.push(i[s]);
                } else if (a.nodeType || a === window || a === document) r.push(a); else if (a.length > 0 && a[0].nodeType) for (s = 0; s < a.length; s++) r.push(a[s]);
                return new e(r);
            };
            return e.prototype = {
                addClass: function(e) {
                    if ("undefined" == typeof e) return this;
                    for (var a = e.split(" "), t = 0; t < a.length; t++) for (var r = 0; r < this.length; r++) this[r].classList.add(a[t]);
                    return this;
                },
                removeClass: function(e) {
                    for (var a = e.split(" "), t = 0; t < a.length; t++) for (var r = 0; r < this.length; r++) this[r].classList.remove(a[t]);
                    return this;
                },
                hasClass: function(e) {
                    return this[0] ? this[0].classList.contains(e) : !1;
                },
                toggleClass: function(e) {
                    for (var a = e.split(" "), t = 0; t < a.length; t++) for (var r = 0; r < this.length; r++) this[r].classList.toggle(a[t]);
                    return this;
                },
                attr: function(e, a) {
                    if (1 === arguments.length && "string" == typeof e) return this[0] ? this[0].getAttribute(e) : void 0;
                    for (var t = 0; t < this.length; t++) if (2 === arguments.length) this[t].setAttribute(e, a); else for (var r in e) this[t][r] = e[r], 
                    this[t].setAttribute(r, e[r]);
                    return this;
                },
                removeAttr: function(e) {
                    for (var a = 0; a < this.length; a++) this[a].removeAttribute(e);
                    return this;
                },
                data: function(e, a) {
                    if ("undefined" == typeof a) {
                        if (this[0]) {
                            var t = this[0].getAttribute("data-" + e);
                            return t ? t : this[0].dom7ElementDataStorage && e in this[0].dom7ElementDataStorage ? this[0].dom7ElementDataStorage[e] : void 0;
                        }
                        return void 0;
                    }
                    for (var r = 0; r < this.length; r++) {
                        var s = this[r];
                        s.dom7ElementDataStorage || (s.dom7ElementDataStorage = {}), s.dom7ElementDataStorage[e] = a;
                    }
                    return this;
                },
                transform: function(e) {
                    for (var a = 0; a < this.length; a++) {
                        var t = this[a].style;
                        t.webkitTransform = t.MsTransform = t.msTransform = t.MozTransform = t.OTransform = t.transform = e;
                    }
                    return this;
                },
                transition: function(e) {
                    "string" != typeof e && (e += "ms");
                    for (var a = 0; a < this.length; a++) {
                        var t = this[a].style;
                        t.webkitTransitionDuration = t.MsTransitionDuration = t.msTransitionDuration = t.MozTransitionDuration = t.OTransitionDuration = t.transitionDuration = e;
                    }
                    return this;
                },
                on: function(e, t, r, s) {
                    function i(e) {
                        var s = e.target;
                        if (a(s).is(t)) r.call(s, e); else for (var i = a(s).parents(), n = 0; n < i.length; n++) a(i[n]).is(t) && r.call(i[n], e);
                    }
                    var n, o, l = e.split(" ");
                    for (n = 0; n < this.length; n++) if ("function" == typeof t || t === !1) for ("function" == typeof t && (r = arguments[1], 
                    s = arguments[2] || !1), o = 0; o < l.length; o++) this[n].addEventListener(l[o], r, s); else for (o = 0; o < l.length; o++) this[n].dom7LiveListeners || (this[n].dom7LiveListeners = []), 
                    this[n].dom7LiveListeners.push({
                        listener: r,
                        liveListener: i
                    }), this[n].addEventListener(l[o], i, s);
                    return this;
                },
                off: function(e, a, t, r) {
                    for (var s = e.split(" "), i = 0; i < s.length; i++) for (var n = 0; n < this.length; n++) if ("function" == typeof a || a === !1) "function" == typeof a && (t = arguments[1], 
                    r = arguments[2] || !1), this[n].removeEventListener(s[i], t, r); else if (this[n].dom7LiveListeners) for (var o = 0; o < this[n].dom7LiveListeners.length; o++) this[n].dom7LiveListeners[o].listener === t && this[n].removeEventListener(s[i], this[n].dom7LiveListeners[o].liveListener, r);
                    return this;
                },
                once: function(e, a, t, r) {
                    function s(n) {
                        t(n), i.off(e, a, s, r);
                    }
                    var i = this;
                    "function" == typeof a && (a = !1, t = arguments[1], r = arguments[2]), i.on(e, a, s, r);
                },
                trigger: function(e, a) {
                    for (var t = 0; t < this.length; t++) {
                        var r;
                        try {
                            r = new window.CustomEvent(e, {
                                detail: a,
                                bubbles: !0,
                                cancelable: !0
                            });
                        } catch (s) {
                            r = document.createEvent("Event"), r.initEvent(e, !0, !0), r.detail = a;
                        }
                        this[t].dispatchEvent(r);
                    }
                    return this;
                },
                transitionEnd: function(e) {
                    function a(i) {
                        if (i.target === this) for (e.call(this, i), t = 0; t < r.length; t++) s.off(r[t], a);
                    }
                    var t, r = [ "webkitTransitionEnd", "transitionend", "oTransitionEnd", "MSTransitionEnd", "msTransitionEnd" ], s = this;
                    if (e) for (t = 0; t < r.length; t++) s.on(r[t], a);
                    return this;
                },
                width: function() {
                    return this[0] === window ? window.innerWidth : this.length > 0 ? parseFloat(this.css("width")) : null;
                },
                outerWidth: function(e) {
                    return this.length > 0 ? e ? this[0].offsetWidth + parseFloat(this.css("margin-right")) + parseFloat(this.css("margin-left")) : this[0].offsetWidth : null;
                },
                height: function() {
                    return this[0] === window ? window.innerHeight : this.length > 0 ? parseFloat(this.css("height")) : null;
                },
                outerHeight: function(e) {
                    return this.length > 0 ? e ? this[0].offsetHeight + parseFloat(this.css("margin-top")) + parseFloat(this.css("margin-bottom")) : this[0].offsetHeight : null;
                },
                offset: function() {
                    if (this.length > 0) {
                        var e = this[0], a = e.getBoundingClientRect(), t = document.body, r = e.clientTop || t.clientTop || 0, s = e.clientLeft || t.clientLeft || 0, i = window.pageYOffset || e.scrollTop, n = window.pageXOffset || e.scrollLeft;
                        return {
                            top: a.top + i - r,
                            left: a.left + n - s
                        };
                    }
                    return null;
                },
                css: function(e, a) {
                    var t;
                    if (1 === arguments.length) {
                        if ("string" != typeof e) {
                            for (t = 0; t < this.length; t++) for (var r in e) this[t].style[r] = e[r];
                            return this;
                        }
                        if (this[0]) return window.getComputedStyle(this[0], null).getPropertyValue(e);
                    }
                    if (2 === arguments.length && "string" == typeof e) {
                        for (t = 0; t < this.length; t++) this[t].style[e] = a;
                        return this;
                    }
                    return this;
                },
                each: function(e) {
                    for (var a = 0; a < this.length; a++) e.call(this[a], a, this[a]);
                    return this;
                },
                html: function(e) {
                    if ("undefined" == typeof e) return this[0] ? this[0].innerHTML : void 0;
                    for (var a = 0; a < this.length; a++) this[a].innerHTML = e;
                    return this;
                },
                is: function(t) {
                    if (!this[0]) return !1;
                    var r, s;
                    if ("string" == typeof t) {
                        var i = this[0];
                        if (i === document) return t === document;
                        if (i === window) return t === window;
                        if (i.matches) return i.matches(t);
                        if (i.webkitMatchesSelector) return i.webkitMatchesSelector(t);
                        if (i.mozMatchesSelector) return i.mozMatchesSelector(t);
                        if (i.msMatchesSelector) return i.msMatchesSelector(t);
                        for (r = a(t), s = 0; s < r.length; s++) if (r[s] === this[0]) return !0;
                        return !1;
                    }
                    if (t === document) return this[0] === document;
                    if (t === window) return this[0] === window;
                    if (t.nodeType || t instanceof e) {
                        for (r = t.nodeType ? [ t ] : t, s = 0; s < r.length; s++) if (r[s] === this[0]) return !0;
                        return !1;
                    }
                    return !1;
                },
                index: function() {
                    if (this[0]) {
                        for (var e = this[0], a = 0; null !== (e = e.previousSibling); ) 1 === e.nodeType && a++;
                        return a;
                    }
                    return void 0;
                },
                eq: function(a) {
                    if ("undefined" == typeof a) return this;
                    var t, r = this.length;
                    return a > r - 1 ? new e([]) : 0 > a ? (t = r + a, new e(0 > t ? [] : [ this[t] ])) : new e([ this[a] ]);
                },
                append: function(a) {
                    var t, r;
                    for (t = 0; t < this.length; t++) if ("string" == typeof a) {
                        var s = document.createElement("div");
                        for (s.innerHTML = a; s.firstChild; ) this[t].appendChild(s.firstChild);
                    } else if (a instanceof e) for (r = 0; r < a.length; r++) this[t].appendChild(a[r]); else this[t].appendChild(a);
                    return this;
                },
                prepend: function(a) {
                    var t, r;
                    for (t = 0; t < this.length; t++) if ("string" == typeof a) {
                        var s = document.createElement("div");
                        for (s.innerHTML = a, r = s.childNodes.length - 1; r >= 0; r--) this[t].insertBefore(s.childNodes[r], this[t].childNodes[0]);
                    } else if (a instanceof e) for (r = 0; r < a.length; r++) this[t].insertBefore(a[r], this[t].childNodes[0]); else this[t].insertBefore(a, this[t].childNodes[0]);
                    return this;
                },
                insertBefore: function(e) {
                    for (var t = a(e), r = 0; r < this.length; r++) if (1 === t.length) t[0].parentNode.insertBefore(this[r], t[0]); else if (t.length > 1) for (var s = 0; s < t.length; s++) t[s].parentNode.insertBefore(this[r].cloneNode(!0), t[s]);
                },
                insertAfter: function(e) {
                    for (var t = a(e), r = 0; r < this.length; r++) if (1 === t.length) t[0].parentNode.insertBefore(this[r], t[0].nextSibling); else if (t.length > 1) for (var s = 0; s < t.length; s++) t[s].parentNode.insertBefore(this[r].cloneNode(!0), t[s].nextSibling);
                },
                next: function(t) {
                    return new e(this.length > 0 ? t ? this[0].nextElementSibling && a(this[0].nextElementSibling).is(t) ? [ this[0].nextElementSibling ] : [] : this[0].nextElementSibling ? [ this[0].nextElementSibling ] : [] : []);
                },
                nextAll: function(t) {
                    var r = [], s = this[0];
                    if (!s) return new e([]);
                    for (;s.nextElementSibling; ) {
                        var i = s.nextElementSibling;
                        t ? a(i).is(t) && r.push(i) : r.push(i), s = i;
                    }
                    return new e(r);
                },
                prev: function(t) {
                    return new e(this.length > 0 ? t ? this[0].previousElementSibling && a(this[0].previousElementSibling).is(t) ? [ this[0].previousElementSibling ] : [] : this[0].previousElementSibling ? [ this[0].previousElementSibling ] : [] : []);
                },
                prevAll: function(t) {
                    var r = [], s = this[0];
                    if (!s) return new e([]);
                    for (;s.previousElementSibling; ) {
                        var i = s.previousElementSibling;
                        t ? a(i).is(t) && r.push(i) : r.push(i), s = i;
                    }
                    return new e(r);
                },
                parent: function(e) {
                    for (var t = [], r = 0; r < this.length; r++) e ? a(this[r].parentNode).is(e) && t.push(this[r].parentNode) : t.push(this[r].parentNode);
                    return a(a.unique(t));
                },
                parents: function(e) {
                    for (var t = [], r = 0; r < this.length; r++) for (var s = this[r].parentNode; s; ) e ? a(s).is(e) && t.push(s) : t.push(s), 
                    s = s.parentNode;
                    return a(a.unique(t));
                },
                find: function(a) {
                    for (var t = [], r = 0; r < this.length; r++) for (var s = this[r].querySelectorAll(a), i = 0; i < s.length; i++) t.push(s[i]);
                    return new e(t);
                },
                children: function(t) {
                    for (var r = [], s = 0; s < this.length; s++) for (var i = this[s].childNodes, n = 0; n < i.length; n++) t ? 1 === i[n].nodeType && a(i[n]).is(t) && r.push(i[n]) : 1 === i[n].nodeType && r.push(i[n]);
                    return new e(a.unique(r));
                },
                remove: function() {
                    for (var e = 0; e < this.length; e++) this[e].parentNode && this[e].parentNode.removeChild(this[e]);
                    return this;
                },
                add: function() {
                    var e, t, r = this;
                    for (e = 0; e < arguments.length; e++) {
                        var s = a(arguments[e]);
                        for (t = 0; t < s.length; t++) r[r.length] = s[t], r.length++;
                    }
                    return r;
                }
            }, a.fn = e.prototype, a.unique = function(e) {
                for (var a = [], t = 0; t < e.length; t++) -1 === a.indexOf(e[t]) && a.push(e[t]);
                return a;
            }, a;
        }()), s = [ "jQuery", "Zepto", "Dom7" ], i = 0; i < s.length; i++) window[s[i]] && e(window[s[i]]);
        var n;
        n = "undefined" == typeof r ? window.Dom7 || window.Zepto || window.jQuery : r, 
        n && ("transitionEnd" in n.fn || (n.fn.transitionEnd = function(e) {
            function a(i) {
                if (i.target === this) for (e.call(this, i), t = 0; t < r.length; t++) s.off(r[t], a);
            }
            var t, r = [ "webkitTransitionEnd", "transitionend", "oTransitionEnd", "MSTransitionEnd", "msTransitionEnd" ], s = this;
            if (e) for (t = 0; t < r.length; t++) s.on(r[t], a);
            return this;
        }), "transform" in n.fn || (n.fn.transform = function(e) {
            for (var a = 0; a < this.length; a++) {
                var t = this[a].style;
                t.webkitTransform = t.MsTransform = t.msTransform = t.MozTransform = t.OTransform = t.transform = e;
            }
            return this;
        }), "transition" in n.fn || (n.fn.transition = function(e) {
            "string" != typeof e && (e += "ms");
            for (var a = 0; a < this.length; a++) {
                var t = this[a].style;
                t.webkitTransitionDuration = t.MsTransitionDuration = t.msTransitionDuration = t.MozTransitionDuration = t.OTransitionDuration = t.transitionDuration = e;
            }
            return this;
        })), window.Swiper = t;
    }(), "undefined" != typeof module ? module.exports = window.Swiper : "function" == typeof define && define.amd && define([], function() {
        "use strict";
        return window.Swiper;
    });
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
