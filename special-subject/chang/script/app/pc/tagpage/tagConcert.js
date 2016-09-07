/*! 一唱成名 create by ErickSong */
define("app/pc/tagpage/tagConcert", [ "core/jquery/1.8.3/jquery", "../../../util/loader/loader", "../../../util/log/log", "../../../util/platform/plt", "../../../util/browser/browser", "../../../util/net/urlquery", "../../../util/vote/uniformDate", "../../../util/Timer/timer", "../../../util/vote/voteupdate", "../../../util/linkcfg/interfaceurl", "../index/flipclock", "core/underscore/1.8.3/underscore" ], function(require, exports) {
    var $ = require("core/jquery/1.8.3/jquery");
    var loader = require("../../../util/loader/loader");
    var uniformDate = require("../../../util/vote/uniformDate");
    var timer = require("../../../util/Timer/timer");
    var voteMap = require("../../../util/vote/voteupdate");
    var urls = require("../../../util/linkcfg/interfaceurl");
    var flipclock = require("../index/flipclock");
    //获取url参数对象
    var urlObj = require("../../../util/net/urlquery");
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
