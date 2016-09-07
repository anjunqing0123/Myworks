/*! 一唱成名 create by ErickSong */
define("app/pc/playpage/gold/stageeight", [ "core/jquery/1.8.3/jquery", "../../../../util/vote/vote", "../../../../util/cookie/cookie", "../../../../util/loader/loader", "../../../../util/log/log", "../../../../util/platform/plt", "../../../../util/browser/browser", "../../../../util/net/urlquery", "../../../../util/user/user", "client", "../../../../util/vote/counterTimer", "../../../../util/linkcfg/interfaceurl", "../../../../util/vote/formatVote", "../../../../util/barrage/barrage", "../../../../util/login/login", "../../../../util/user/user-fix", "../../../../util/date/format", "../../../../util/event/event-aggregator", "../../../../util/barrage/emojione", "../../../../util/pub/main", "core/underscore/1.8.3/underscore", "../../../../util/lazyload/delayload", "../../../../util/lazyload/webp", "../../../../util/scroller/scroller", "../../../../util/event/event-mouse-wheel", "../../../../util/scroller/scroller.css", "../../../../util/barrage/player-plugin-barrage", "../../index/common-joinvip" ], function(require, exports) {
    var $ = require("core/jquery/1.8.3/jquery");
    var vote = require("../../../../util/vote/vote");
    var counter = require("../../../../util/vote/counterTimer");
    var cookie = require("../../../../util/cookie/cookie");
    var Loader = require("../../../../util/loader/loader");
    var api = require("../../../../util/linkcfg/interfaceurl")["interface"];
    var formatVote = require("../../../../util/vote/formatVote");
    var log = require("../../../../util/log/log");
    var appBarrage = require("../../../../util/barrage/barrage");
    //播放器事件
    require("../../../../util/pub/main");
    var login = require("../../../../util/login/login");
    var user = require("../../../../util/user/user");
    var _ = require("core/underscore/1.8.3/underscore");
    require("../../../../util/scroller/scroller");
    //弹幕
    (function() {
        $(".module-playbox-page .playbox").append('<div class="barrage" id="barrage"></div>');
        var hasInited = false;
        var barrageapp = new appBarrage({
            wrapbox: $("#barrage"),
            player: window.player
        });
        require("../../../../util/barrage/player-plugin-barrage").init(barrageapp);
        player.onRegister("setupbarrage", function(data) {
            var dataContent = data.body && data.body.data || {};
            log("player :: setupbarrage ==>", data, dataContent);
            if (hasInited) return;
            hasInited = true;
            //判断是否支持弹幕 'mode' : 1  或 0  代表   有或无
            if (dataContent.mode === 0) {
                barrageapp.none();
            } else {
                barrageapp.init();
                barrageapp.add({
                    userName: "sysmsg",
                    nickName: "系统消息",
                    playPoint: +new Date(),
                    vipType: 0,
                    content: "欢迎进入" + (webcfg.p_title || "") + "!"
                });
            }
            //启动
            $.publish("barrage:init");
        });
    })();
    (function() {
        var isTheatreMode = false;
        var key = "theatremode";
        var DomPlayerSideBar = $("#barrage");
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
    })();
    function playForTheatre() {
        if (!!isTheatreMode) {
            DomPlayerSideBar.css("display", "none");
            DomPlayer.animate({
                width: "100%"
            }, 400, "swing");
        } else {
            //DomPlayerParent.css('width','680px');
            DomPlayer.animate({
                width: "680px"
            }, 400, "swing", function() {
                DomPlayerSideBar.css("display", "block");
            });
        }
    }
    //加入vip模块
    require("../../index/common-joinvip");
    var jsVotes = $(".js-vote-wrap .js-vote");
    jsVotes.on("mouseenter", function() {
        var obj = $(this);
        if (obj.hasClass("back-countdown") || obj.hasClass("go-countdown")) {
            return false;
        } else {
            if (obj.hasClass("back")) {
                obj.addClass("back-hover");
            } else if (obj.hasClass("go")) {
                obj.addClass("go-hover");
            }
        }
    }).on("mouseleave", function() {
        var obj = $(this);
        obj.removeClass("back-hover go-hover");
    });
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
    function voteAnimate(dom, endCounter, targetTop) {
        if (!targetTop) {
            targetTop = -30;
        }
        var maskDom = dom.find(".time");
        var animateDom = dom.find(".num");
        var originTop = animateDom.css("top");
        new counter({
            counter: endCounter,
            init: function() {
                if (dom.hasClass("go")) {
                    dom.addClass("go-countdown");
                } else {
                    dom.addClass("back-countdown");
                }
                maskDom.show();
                maskDom.text(endCounter);
            },
            update: function() {
                maskDom.text(this.counter);
            },
            finish: function() {
                maskDom.hide();
                maskDom.text("");
                dom.removeClass("go-countdown back-countdown");
            }
        });
        if (endCounter == counterDefault) {
            animateDom.css("display", "block").animate({
                top: targetTop,
                opacity: 1
            }, 1e3, function() {
                setTimeout(function() {
                    animateDom.fadeOut(function() {
                        animateDom.css({
                            top: originTop
                        });
                    });
                }, 1e3);
            });
        }
    }
    new vote({
        dom: ".js-vote-wrap .js-vote",
        voteAttr: "data-id",
        beforeVote: function(data, dom) {
            if (dom.hasClass("go-countdown")) {
                return false;
            }
            if (dom.hasClass("back-countdown")) {
                return false;
            }
            var endCounter = getCounter(dom.attr("data-id"));
            voteAnimate(dom, endCounter);
        },
        afterVote: function(data, dom) {
            //do nothing
            if (typeof data.counter != "undefined") {} else if (data.errors) {}
        }
    });
    jsVotes.each(function() {
        var obj = $(this);
        var tempCounter = getCounter(obj.attr("data-id"), true);
        if (tempCounter != counterDefault) {
            voteAnimate(obj, tempCounter);
        }
    });
    //计票tips
    (function() {
        var $link = $(".module-goldroad a.count");
        var $tips = $(".module-goldroad .tips");
        var showTimer, hideTimer;
        $link.on("mouseenter", function() {
            clearTimeout(hideTimer);
            showTimer = setTimeout(function() {
                $tips.fadeIn();
            }, 200);
        }).on("mouseleave", function() {
            clearTimeout(showTimer);
            hideTimer = setTimeout(function() {
                $tips.fadeOut();
            }, 200);
        });
    })();
    var countMap = {
        "0": "零",
        "1": "一",
        "2": "二",
        "3": "三",
        "4": "四",
        "5": "五",
        "6": "六",
        "7": "七",
        "8": "八",
        "9": "九",
        "10": "十"
    };
    function getChineseCount(count) {
        var strCount = count.toString();
        if (strCount.length == 1) {
            return countMap[count];
        } else if (strCount.length == 2) {
            if (strCount.substr(1, 1) == "0") {
                if (strCount.substr(0, 1) == "1") {
                    return countMap["10"];
                } else {
                    return countMap[strCount.substr(0, 1)] + countMap["10"];
                }
            } else {
                if (strCount.substr(0, 1) == "1") {
                    return countMap["10"] + countMap[strCount.substr(1, 1)];
                } else {
                    return countMap[strCount.substr(0, 1)] + countMap["10"] + countMap[strCount.substr(1, 1)];
                }
            }
        }
    }
    /*function strLen(str) {
      if (!str) {
        return 0;
      }
      var aMatch = str.match(/[^\x00-\xff]/g);
      return (str.length + (!aMatch ? 0 : aMatch.length));
    };*/
    //放省略号
    //var limit = require('../../personspace/limit');
    //比赛结果
    //http://chang.pptv.com/api/match_result?cid=2822237542
    //返回数据说明
    //{cid: "2822237542", is_end: "1", player1: "mdsfsd", player1_username: "chenjie3", player1_praise: "223", player1_hate: "22332", player1_up: "0", player1_time: "22323", player1_index: false}
    //player1：姓名，player1_username：用户名，player1_praise：赞票，player1_hate：踩票，player1_up：是否晋级，player1_time：总时长
    (function() {
        var tp = _.template("" + '<dd class="cf">' + '<a href="javascript:;" title="<%= name %>" class="name fl"><%= name %></a>' + '<div class="fr">' + "<p>登乐时间：<span><%= times %>s</span></p>" + "<p>" + '<span class="zan">前进：<%= praise %>票</span>' + '<span class="cai">后退：<%= hate %>票</span>' + "</p>                " + "</div>" + "<%= up ? '<i class=\"jinji\"></i>':'' %>" + "</dd>");
        $dom = $(".module-goldresult .bd");
        //webcfg.cid='4662544348';
        function loadResult() {
            Loader.load(api.matchResult, {
                cid: webcfg.id
            }, function(data) {
                if (data && data.err === 0) {
                    var isEnd = data.data.is_end;
                    data = data.data.playList;
                    var count = 1;
                    // var count = 1;
                    var html = [];
                    html.push('<div class="scroll-wrap">');
                    for (var i in data) {
                        html.push("<dl><dt><em></em><h4>第" + getChineseCount(count) + "轮</h4></dt>");
                        var arrData = data[i];
                        var tempLen = arrData.length;
                        for (var j = 0; j < tempLen; j++) {
                            var d = arrData[j];
                            var showName = d.player;
                            /*if (strLen(showName) > 8) {
                                showName=limit(showName, 10, '...');
                            }*/
                            html.push(tp({
                                name: showName,
                                times: d.player_time,
                                praise: formatVote(d.player_praise),
                                hate: formatVote(d.player_hate),
                                up: d.player_up == 1 ? true : false
                            }));
                        }
                        html.push("</dl>");
                        count++;
                    }
                    if (isEnd != "1") {
                        html.push('<dl><dd><p class="nomore">比赛结果敬请期待</p></dd></dl>');
                        html.push("</div>");
                        $dom.html(html.join(""));
                        setTimeout(function() {
                            loadResult();
                        }, 60 * 1e3);
                    } else {
                        html.push("</div>");
                        $dom.html(html.join(""));
                    }
                    var $target = $dom.find(".scroll-wrap");
                    var height = $target.height();
                    var option = {
                        wheelPixel: 5,
                        maxHeight: parseInt(height, 10) - 20,
                        horizontal: false,
                        slideBlockSelector: "dl",
                        autoWrap: true
                    };
                    $target.ppScroller(option).scroll();
                } else {
                    $dom.html('<dl><dd><p class="nomore">比赛结果敬请期待</p></dd></dl>');
                    setTimeout(function() {
                        loadResult();
                    }, 60 * 1e3);
                }
            });
        }
        loadResult();
    })();
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

define("util/vote/counterTimer", [ "core/jquery/1.8.3/jquery" ], function(require, exports) {
    var $ = require("core/jquery/1.8.3/jquery");
    function uuid() {
        var count = 0;
        return function(prefix) {
            var prefix = prefix || "normal_counter";
            return prefix + "_" + count++;
        };
    }
    var counterUID = uuid();
    var defaults = {
        intetval: 1e3,
        counter: 10
    };
    function counter() {
        var self = this;
        this.timer = setTimeout(function() {
            var count = self.counter - 1;
            if (count > 0) {
                self.counter--;
                self.request("update");
                counter.call(self);
            } else {
                self.reset();
            }
        }, 1e3);
    }
    function counterTimer(options) {
        this.id = counterUID();
        this.opt = $.extend({}, defaults, options);
        this.counter = this.opt.counter;
        this.timer = null;
        this.dom = this.opt.dom;
        this.init();
    }
    $.extend(counterTimer.prototype, {
        init: function() {
            this.request("init");
            this.update();
        },
        update: function() {
            counter.call(this);
        },
        stop: function() {
            if (this.timer != null) {
                clearTimeout(this.timer);
                this.timer = null;
            }
            this.request("stop");
        },
        reset: function() {
            if (this.timer != null) {
                clearTimeout(this.timer);
                this.timer = null;
            }
            this.counter = this.opt.counter;
            this.request("reset");
            this.request("finish");
        },
        addTimer: function(num) {
            this.counter += num ? num : 10;
            if (this.counter > this.opt.counter) {
                this.counter = this.opt.counter;
            }
        },
        resetCounter: function() {
            if (this.timer != null) {
                clearTimeout(this.timer);
                this.timer = null;
            }
            this.counter = this.opt.counter;
        },
        resume: function(counter) {
            if (typeof counter == "number") {
                this.counter = counter;
            }
            this.update();
        },
        request: function(type) {
            if (!!window.console && window.location.search.indexOf("debug") != -1) {
                console.log(type);
            }
            if (typeof this.opt[type] == "function") {
                this.opt[type].apply(this, arguments);
            } else if ($.isArray(this.opt[type])) {
                var len = this.opt[type].length;
                for (var i = 0; i < len; i++) {
                    this.opt[type][i].apply(this, arguments);
                }
            }
        }
    });
    return counterTimer;
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
 * @author  Erick Song
 * @email   ahschl0322@gmail.com
 * @info    弹幕系统
 *
 * Usage:
 * var barrage = new ChatService(wrapbox, options); //auto init.
 *
 * //增加
 * barrage.add({
    userName : 'sysmsg',
    nickName : '系统消息',
    playPoint : 0,
    vipType : 0,
    content : '欢迎进入!'
 * })
 *
 * //定时删除 - remove
 * barrate.remove();
 *
 * 客户端调用接口：add|pageResize
 * ===== 客户端点播弹幕 =====
 * 三点区别：
    点播弹幕不用绑定手机
    点播弹幕信息格式与直播不一样
    点播弹幕不用过滤自己发的弹幕

    var ppp = external.GetObject2("PPP");
    if(ppp.PlayFileType == 5)
    {
        //表示当前是点播
    }

    //xbenable 是否屏蔽小冰
    //xbenable  1 屏蔽

 *
 */
define("util/barrage/barrage", [ "core/jquery/1.8.3/jquery", "client", "util/log/log", "util/cookie/cookie", "util/user/user", "util/login/login", "util/user/user-fix", "util/date/format", "util/event/event-aggregator", "util/barrage/emojione" ], function(require, exports, modules) {
    var $ = require("core/jquery/1.8.3/jquery"), client = require("client"), log = require("util/log/log"), cookie = require("util/cookie/cookie"), user = require("util/user/user"), login = require("util/login/login"), userfix = require("util/user/user-fix"), dataFormat = require("util/date/format"), EventAggregator = require("util/event/event-aggregator"), Emojione = require("util/barrage/emojione");
    var platform = isClient() ? "clt" : "web", username = user.info ? user.info.UserName : "", nickname = username, viptype = user.info ? user.info.isVip : 0, pageEv = new EventAggregator();
    var Loader = {
        load: function(url, params, callback) {
            var parsList = [], item;
            //log(url ,' : ', params, decodeURIComponent($.param(params)));
            $.ajax({
                dataType: "jsonp",
                type: "GET",
                url: url + "?" + decodeURIComponent($.param(params)),
                jsonp: "cb",
                data: {
                    format: "jsonp"
                },
                jsonpCallback: params.callback,
                cache: true,
                success: function(data) {
                    if (callback && typeof callback == "function") {
                        callback.apply(null, arguments);
                    }
                }
            });
        }
    };
    //emojione config.
    emojione.imageType = "png";
    emojione.sprites = true;
    emojione.ascii = true;
    emojione.imagePathPNG = "http://static9.pplive.cn/pub/flagment/v_20150508141029/modules/emojione/emojione.sprites.png";
    emojione.imagePathSVG = "http://static9.pplive.cn/pub/flagment/v_20150508141029/modules/emojione/emojione.sprites.png";
    //模拟终端
    if (getQueryString(window.location.href, "plt")) {
        platform = getQueryString(window.location.href, "plt");
    }
    //客户端屏蔽右键，右键有刷新选项，页面刷新后会出现小冰没有的情况
    //网站端是页面和播放器都会刷新，没有问题
    if (platform === "clt") {
        // $('body').on('contextmenu', function(ev){
        //     ev.stopPropagation();
        //     return false;
        // })
        document.onkeydown = function(ev) {
            if (ev.keyCode == 116) {
                ev.returnValue = false;
            }
        };
    }
    if (platform === "clt" && client.userIsLogin()) {
        username = client.getUserInfo().userName;
    }
    function isClient() {
        try {
            if (this.external && external.GetObject("@pplive.com/ui/mainwindow;1")) {
                return true;
            }
        } catch (e) {}
        return false;
    }
    function ArrayObj(opt, cacheLength) {
        var arr = [];
        var obj = {};
        var defaults = opt || {};
        this.pop = function() {
            var o = arr.pop();
            if (o) {
                for (var k in o) {
                    delete obj[k];
                }
                this.length--;
            }
        };
        this.unshift = function(o) {
            if (this.length > cacheLength) {
                this.pop();
            }
            arr.unshift(o);
            for (var k in o) {
                obj[k] = o[k];
            }
            this.length++;
        };
        this.length = 0;
        this.get = function(n) {
            if (obj[n] != null && obj[n] != undefined) {
                return obj[n];
            } else {
                return null;
            }
        };
        this.each = function(cb) {
            for (var k in obj) {
                cb(k, obj[k]);
            }
            for (var k in defaults) {
                cb(k, defaults[k]);
            }
        };
    }
    function getQueryString(str, name) {
        var reg = new RegExp("(^|\\?|&)" + name + "=([^&]*)(\\s|&|$)", "i");
        if (reg.test(str)) return unescape(RegExp.$2.replace(/\+/g, " "));
    }
    function XiaoBing(opts) {
        this.box = opts.box;
        this.init();
    }
    XiaoBing.prototype = {
        constructor: XiaoBing,
        init: function() {},
        add: function(params) {
            var text = '<a href="javascript:;" title="" class="xbpic"><img src="' + (params.picurl || params.picUrl) + '" alt=""></a><div class="xbslide_txtwrap"><div class="xbslide_txtinner"><p>' + params.text + "</p></div></div>";
            this.box.html(text).show();
            return this;
        },
        show: function() {
            this.box.show();
        },
        hide: function() {
            this.box.hide();
        }
    };
    //ChatService
    function ChatService(opts) {
        var defaults = {
            id: "Chat-" + +new Date(),
            wrapbox: null,
            //box
            player: window.player,
            //player
            usersCacheLength: 20,
            message: [],
            //点播消息堆栈
            counter: 0,
            //当前记录条数
            max: 150,
            //最大条数
            timerInterval: 5 * 60 * 10,
            //最大时间间隔
            maxPostTime: 5,
            //单位s
            enableXB: false,
            //是否显示小冰
            xbUserName: "wr_xb2015",
            //小冰用户名
            xbNickName: "小冰"
        };
        $.extend(this, defaults, opts);
        this.wrapbox = $(this.wrapbox);
        this.defaultText = "请在这里输入评论";
        this.xbDefaultText = "@" + this.xbNickName + "，萌妹子陪你聊天侃球";
        this.tpl = //'<a href="${link}" title="" class="xbpic"><img src="${imgsrc}" alt=""></a><p>${content}</p>' +
        '<div class="xbslide cf" style="display:none"><a href="javascript:;" title="" class="xbpic"><img src="http://sr4.pplive.com/cms/41/32/7474eaf188a08c074d0ee166f21d7117.png" alt=""></a><div class="xbslide_txtwrap"><div class="xbslide_txtinner"><p>我是PPTV&微软小冰！~我负责貌美如花，你负责看球败家，长得帅和我聊天，其他的靠边边~评论里 <em class="atsomeone " data-name="' + this.xbUserName + '">@' + this.xbNickName + "</em>，一起聊聊天，谈球说八卦</p></div></div></div>" + '<div class="chat dm"><ul></ul></div>' + '<div class="btn-screen"><a href="javascript:void(0);" title="" class="goscroll"><i></i>停止滚屏</a><a href="javascript:void(0);" title="" class="clean"><i></i>清屏</a></div>' + '<div class="form"><div class="formtext"><textarea name="" rows="2" cols="1" maxlength="30">' + this.defaultText + '</textarea><!-- <a href="javascript:void(0);" title="" class="btn-face"></a> --> <p class="num">0/30</p>' + '<div class="user_facebox" style="display:none;"></div>' + '<div class="loginarea"><p class="tips login"><a href="javascript:void(0);" data-type="login" title="登录">登录</a>或 <a href="javascript:void(0);" data-type="reg" title="注册">注册</a>后可以发送弹幕</p><p class="tips bindphone" style="display:none"><a href="http://passport.pptv.com/checkPhone.aspx" target="_blank" title="">绑定手机</a>即可发送弹幕哦</p><p class="tips wait" style="display:none"><em>' + this.maxPostTime + "</em> 秒后可再次评论</p></div>" + '</div><a href="javascript:void(0);" title="" class="disable btn-submit">发送</a><a href="javascript:void(0);" title="" class="btn-set"></a>' + '<div class="setform noXB"><dl><dt>聊天选项</dt><dd class="XBsetting"><label><input class="btn-talk-to-xiaobing" type="checkbox" checked name="">和' + this.xbNickName + '聊</label></dd><dd class="NTsetting"><label><input class="btn-night-modle" type="checkbox" name="">夜间模式</label></dd></dl></div>' + "</div>" + '<div class="pop-phone">' + '<a href="javascript:void(0);" title="关闭" class="close"></a>' + '<div class="bd">' + "<h4>提示</h4>" + "<ul><li>绑定完成前请不要关闭此窗口。</li></ul>" + //<li>完成绑定后请根据您的情况点击下方的按钮。</li>
        '<p><a href="javascript:void(0);" title="" class="locked">已绑定手机</a><a class="failed" href="http://bbs.pptv.com/forum.php?mod=viewthread&tid=31660" target="_blank title="">绑定遇到问题</a></p>' + "</div>" + "</div>";
        var self = this;
        this.chatbox = $("<div />", {
            id: this.id,
            "class": "module-playlive-dm loading"
        }).appendTo(this.wrapbox).append('<div style="display:table-cell;vertical-align:middle;text-align:center;*position:absolute;*top:50%;*left:0;"><div class="nodm" style="width:300px;display:inline-block;text-align:center;*position:relative;*top:-50%;">广告后为您加载弹幕</div></div>').on("click", ".xbslide .atsomeone", function(ev) {
            var tempText = "";
            if (self.textarea.val() == self.defaultText) {
                tempText = $(this).text() + " ";
            } else {
                tempText = self.textarea.val() + " " + $(this).text();
            }
            self.textarea.focus().val(tempText);
        }).on("click", ".xbslide .xbpic", function(ev) {
            var tempText = "";
            if (self.textarea.val() == self.defaultText) {
                tempText = "@" + self.xbNickName + " ";
            } else {
                tempText = self.textarea.val() + " " + "@" + self.xbNickName;
            }
            self.textarea.focus().val(tempText);
        });
    }
    ChatService.prototype = {
        constructor: ChatService,
        init: function(callback) {
            var self = this;
            if (!this.wrapbox.length || !this.player) {
                alert("调用容器或播放器不存在!");
                return false;
            }
            if (this.hasInited) return;
            this.messageInterval = null;
            this.chatbox.html("").append(this.tpl).removeClass("loading");
            this.box = this.chatbox.find(".chat ul");
            this.xiaobingbox = this.chatbox.find(".xbslide");
            this.textarea = this.chatbox.find("textarea");
            this.submitBtn = this.chatbox.find(".btn-submit");
            this.setBtn = this.chatbox.find(".btn-set");
            this.setBox = this.chatbox.find(".setform");
            this.loginarea = this.chatbox.find(".loginarea");
            this.loginBtn = this.loginarea.find(".login");
            this.bindphoneBtn = this.loginarea.find(".bindphone");
            this.waitDom = this.loginarea.find(".wait");
            this.popupbox = this.chatbox.find(".pop-phone");
            this.hasLogined = platform === "clt" ? client.userIsLogin() : user.isLogined;
            this.xiaobing = new XiaoBing({
                box: this.xiaobingbox
            });
            //注册事件
            // pageEv.subscribe('barrage:init', function(){ alert('init...'); });
            // pageEv.subscribe('barrage:barragesetting', function(){});
            // pageEv.subscribe('barrage:playbarrage', function(params){
            //     self.add(params);
            // });
            // pageEv.subscribe('barrage:sendbarrage', this.add);
            //
            this.initlize();
            return this.chatbox;
        },
        none: function() {
            this.hasInited = false;
            this.chatbox.html("").removeClass("loading").addClass("module-playlive-nodm").append('<div class="nodm">该节目暂不支持弹幕</div>');
        },
        initlize: function() {
            this.hasInited = true;
            this.interactive();
            this.resize();
        },
        add: function(params, flag) {
            var self = this;
            if (typeof params === "string") {
                try {
                    params = JSON.parse(params);
                } catch (e) {
                    alert("parse JSON String Error!");
                }
            }
            if ($.isArray(params)) {
                //添加一条时间分割线
                if (this.lastTime && params[0].playPoint - this.lastTime >= this.timerInterval) {
                    this.showChatMsg({
                        userName: "system::timeline",
                        nickName: "时间分割线",
                        playPoint: params[0].playPoint,
                        vipType: 0,
                        content: ""
                    });
                }
                //客户端点播弹幕
                if (platform === "clt" && this.playType == "vod") {
                    this.vodInterval(params);
                    return;
                }
                for (var i = 0, len = params.length; i < len; i++) {
                    if (params[i].userName == this.xbUserName && !this.enableXB) {
                        continue;
                    }
                    //点播弹幕不过滤
                    if (this.playType != "vod" && !flag && params[i].userName === username) break;
                    params[i].nickName = this.filterXBNickname(params[i].nickName, params[i].userName);
                    //对于和小冰同名的昵称，显示“用户小冰”
                    if (params[i].userName == this.xbUserName) {
                        //对于小冰的回复，如果回复中有@小冰，全部换成@用户小冰
                        var reg = "@小冰";
                        reg = new RegExp(reg, "gim");
                        params[i].content = params[i].content.replace(reg, "@用户小冰");
                    }
                    this.showChatMsg(params[i]);
                    this.counter++;
                }
                this.lastTime = params[0].playPoint;
            } else {
                if (flag) this.addToPlayer(params);
                params.nickName = this.filterXBNickname(params.nickName, params.userName);
                //对于和小冰同名的昵称，显示“用户小冰”
                this.showChatMsg(params);
                this.counter++;
            }
            if (this.counter > this.max) {
                this.remove();
            }
            // if(!this.islock) this.lock();
            return this;
        },
        addToPlayer: function(params) {
            //发送弹幕
            this.player.onNotification({
                header: {
                    type: "sendbarrage"
                },
                body: {
                    data: params
                }
            });
        },
        initXBSetting: function(params) {
            if (params.xbisopen) {
                this.showXBWords();
                this.enableXB = true;
                if (isClient()) {
                    this.setBtn.show();
                }
                this.setBox.removeClass("noXB");
                if (params.name) {
                    this.xbUserName = params.name;
                }
                if (this.textarea.val() == this.defaultText) {
                    this.textarea.val(this.xbDefaultText);
                    this.defaultText = this.xbDefaultText;
                }
            } else {
                this.enableXB = false;
                this.hideXBWords();
                this.setBox.addClass("noXB");
            }
        },
        addXBSetting: function(params) {
            //发送弹幕
            this.player.onNotification({
                header: {
                    type: "barragesetting"
                },
                body: {
                    data: params
                }
            });
        },
        addXBWords: function(params) {
            params = params[params.length - 1];
            var text = this.htmlEncode(params.text);
            var isXB = true;
            if (/\@/gi.test(text)) {
                text = this.filterContent(text, isXB);
            }
            params.text = text;
            this.xiaobing.add(params);
            this.resize();
        },
        showXBWords: function() {
            this.xiaobing.show();
            this.resize();
        },
        hideXBWords: function() {
            this.xiaobing.hide();
            this.resize();
        },
        remove: function() {
            this.counter--;
            this.box.children().first().remove();
        },
        formatTime: function(num) {
            var temp;
            var h = parseInt(num / 3600);
            temp = num % 3600;
            var m = parseInt(temp / 60);
            var s = num % 60;
            h = h < 10 ? "0" + h : h;
            m = m < 10 ? "0" + m : m;
            s = s < 10 ? "0" + s : s;
            return h + ":" + m + ":" + s;
        },
        vodInterval: function(params) {
            var self = this;
            this.message = this.message.concat(params);
            var pos = external.getObject("PPP").Position, temp;
            if (this.messageInterval) clearInterval(this.messageInterval);
            this.messageInterval = setInterval(function() {
                if (!self.message.length) {
                    clearInterval(self.messageInterval);
                }
                for (var i = 0, l = self.message.length; i < l; i++) {
                    if (self.message[0]) {
                        if (self.message[0].play_point / 10 <= pos) {
                            temp = self.message.shift();
                            self.counter++;
                            self.showChatMsg(temp);
                        } else {
                            break;
                        }
                    } else {
                        self.message.shift();
                        continue;
                    }
                }
                pos += 1;
            }, 1e3);
        },
        //点播使用， 暂停
        pause: function() {
            if (this.messageInterval) clearInterval(this.messageInterval);
        },
        //播放
        play: function() {
            this.vodInterval([]);
        },
        //滚屏|锁定
        lock: function() {
            this.box.parent().scrollTop(this.box[0].scrollHeight);
        },
        //清屏
        clear: function() {
            this.counter = 0;
            this.message.length = 0;
            this.box.html("");
        },
        onRegister: function(callback) {
            callback();
        },
        resize: function(height) {
            var xbHeight = this.xiaobingbox ? this.xiaobingbox.is(":visible") ? this.xiaobingbox.outerHeight() : 0 : 0;
            var boxheight = (height || this.wrapbox.height()) - xbHeight - 140;
            var btnScreenTop = xbHeight ? xbHeight : 5;
            if (height) {
                this.wrapbox.height(height);
            }
            if (this.box && boxheight > 0) {
                this.chatbox.find(".btn-screen").css("top", btnScreenTop);
                this.box.parent().css("height", boxheight);
                this.lock();
            }
        },
        //给客户端使用
        bindphone: function() {
            this.popupbox.show();
        },
        interactive: function() {
            var self = this;
            new self.counterText(this.textarea);
            //右上角操作按钮
            this.chatbox.find(".chat, .btn-screen").on("mouseenter", function() {
                self.chatbox.find(".btn-screen").show();
            }).on("mouseleave", function() {
                self.chatbox.find(".btn-screen").hide();
            });
            //登录按钮
            this.loginBtn.find("a").on("click", function() {
                var type = $(this).attr("data-type") || "login";
                login.init({
                    type: type,
                    from: "web_barrage",
                    app: ""
                });
            });
            //设置选项
            this.setBtn.on("click", function() {
                if (!self.setBox.is(":visible")) {
                    self.setBox.show();
                } else {
                    self.setBox.hide();
                }
            });
            //小冰设置显示与否
            this.setBox.find(".btn-talk-to-xiaobing").on("click", function() {
                var flag = this.checked;
                if (!flag) {
                    self.enableXB = false;
                    self.addXBSetting({
                        xbenable: 0
                    });
                    self.hideXBWords();
                } else {
                    self.enableXB = true;
                    self.addXBSetting({
                        xbenable: 1
                    });
                    self.showXBWords();
                }
            });
            //夜间模式设置
            this.setBox.find(".btn-night-modle").on("click", function() {
                var flag = this.checked;
                var $dom = $("#player-sidebar .module-video-live-1408").length ? $("#player-sidebar .module-video-live-1408") : self.wrapbox;
                if (!flag) {
                    $dom.removeClass("module-video-live-1408b");
                    self.changeNightMode(0);
                } else {
                    $dom.addClass("module-video-live-1408b");
                    self.changeNightMode(1);
                }
            });
            this.setBox.on("click", function(ev) {
                ev.stopPropagation();
            });
            this.chatbox.on("click", function(event) {
                if ($(event.target).hasClass("btn-set") || $(event.target).hasClass("setform")) {
                    return;
                }
                self.setBox.hide();
            });
            user.onLogout(logoutFun);
            user.onLogin(loginFun);
            function loginFun() {
                self.hasLogined = true;
                self.checkBindMobilePhone();
                self.textarea.hide().parent().parent().addClass("logined");
            }
            function logoutFun() {
                self.hasBindPhone = false;
                self.hasLogined = false;
                self.loginarea.children().hide();
                self.loginBtn.show().parent().show();
                self.popupbox.hide();
                self.textarea.hide().parent().parent().removeClass("logined focus selected").find(".num").hide();
            }
            if (user.isLogined) {
                loginFun();
            } else {
                logoutFun();
            }
            if (platform === "clt" && this.hasLogined) {
                self.checkBindMobilePhone();
            }
            this.bindphoneBtn.on("click", function() {
                self.popupbox.show();
            });
            this.popupbox.find(".close").on("click", function() {
                self.popupbox.hide();
            });
            this.popupbox.find(".locked").on("click", function() {
                self.popupbox.hide();
                self.checkBindMobilePhone();
            });
            //滚屏
            this.chatbox.find(".goscroll").toggle(function() {
                self.islock = true;
                $(this).html("<i></i>开始滚屏");
            }, function() {
                self.islock = false;
                $(this).html("<i></i>停止滚屏");
            });
            //清屏
            this.chatbox.find(".clean").on("click", function() {
                self.clear();
            });
            //输入框
            this.textarea.on("focusin", function(evt) {
                //keypress
                $(this).parent().parent().addClass("logined focus selected");
                self.submitBtn.removeClass("disable");
                if ($.trim(this.value) === "" || $.trim(this.value) === self.defaultText) {
                    this.value = "";
                }
            }).on("focusout", function() {
                $(this).parent().parent().removeClass("focus selected");
                if ($.trim(this.value) === "" || $.trim(this.value) === self.defaultText) {
                    $(this).parent().parent().removeClass("focus selected");
                    this.value = self.defaultText;
                } else {
                    $(this).parent().parent().addClass("focus selected");
                }
            }).keydown(function(evt) {
                if (evt.keyCode == 13 || evt.ctrlKey && evt.keyCode == 13) {
                    post();
                    return false;
                }
            });
            this.submitBtn.on("click", function() {
                post();
            });
            function post() {
                var text = self.textarea.val();
                self.hasLogined = platform === "clt" ? client.userIsLogin() : user.isLogined;
                if (self.submitBtn.hasClass("disable") || !self.hasLogined || !self.hasBindPhone) return;
                if (!$.trim(text) || $.trim(text) == self.defaultText) {
                    return false;
                }
                self.getUserName();
                self.add({
                    userName: username,
                    nickName: nickname,
                    playPoint: +new Date(),
                    vipType: viptype,
                    content: text
                }, true);
                //如果是版本大于3.6.1.0024的客户端，客户端调用了postCountDown
                if (platform === "clt" && client.getClientVer() > "3.6.1.0024") {} else {
                    self.postCountDown();
                }
            }
        },
        postCountDown: function() {
            var self = this, count = this.maxPostTime;
            this.submitBtn.addClass("disable");
            this.textarea.val("").focusout().hide().parent().find(".num").hide();
            this.loginarea.children().hide();
            this.waitDom.html("<em>5</em> 秒后可再次评论").show().parent().show();
            this.maxPostInterval = setInterval(function() {
                if (count === 1) {
                    clearInterval(self.maxPostInterval);
                    if (!self.hasLogined) return;
                    self.submitBtn.removeClass("disable");
                    self.waitDom.hide().parent().hide().parent();
                    self.textarea.show().focus().parent().find(".num").show();
                    return;
                }
                count--;
                self.waitDom.html("<em>" + count + "</em> 秒后可再次评论");
            }, 1e3);
        },
        showChatMsg: function(params) {
            /**
             * [消息格式定义]
             * @type {Object}
             *
             * {
             *     userName : 'lin04com',
             *     nickName : '测试测试测试',
             *     playPoint : 1421401763000,
             *     vipType : 2,
             *     content : '你吃饭了吗？'
             * }
             */
            var self = this;
            var msgTypeMap = {
                system: "sysmsg",
                timeline: "timeline",
                "system::timeline": "timeline",
                "system::notice": "notice",
                "system::xiaobing": "xb"
            };
            msgTypeMap[this.xbUserName] = "xb";
            //兼容点播弹幕数据格式
            if (params.user_name) {
                params.userName = params.user_name;
            }
            if (params.nick_name) {
                params.nickName = params.nick_name;
            }
            if (params.vip_type) {
                params.vipType = params.vip_type;
            }
            if (!params.vipType) {
                params.vipType = 0;
            }
            var msgClass = msgTypeMap[params.userName] || "", msgText = "";
            if (!params.userName) return;
            if (params.userName == "system::timeline") {
                return '<li class="' + msgClass + '"><em>' + dataFormat(new Date(params.playPoint * 100), "hh:mm:ss") + "</em></li>";
            }
            msgText = params.content.replace(/\<(script|img|iframe|background|link|style|meta|base|a|body)/gi, "$1");
            var $li = $('<li class="' + msgClass + '"><span class="' + (params.vipType != 0 ? "vipcolor" : "") + '" data-name=' + params.userName + ">" + this.htmlEncode(params.nickName || params.userName) + (params.vipType != 0 ? '<i class="vip"></i>' : "") + '：</span><span class="txt"></span></li>').appendTo(this.box).find(".txt").html(msgText);
            if (!this.islock) {
                this.box.parent().scrollTop(this.box.height());
            }
            msgText = Emojione.unescapeHTML($li.text() || "");
            msgText = Emojione.toImage(msgText);
            if (/\@/gi.test(msgText)) {
                msgText = this.filterContent(msgText);
                if (/\<em/gi.test(msgText)) {
                    $li.html(msgText);
                }
            } else {
                $li.html(msgText);
            }
        },
        getUserName: function() {
            if (platform === "clt" && client.userIsLogin()) {
                username = client.getUserInfo().userName;
                nickname = this.parseLen(client.getUserInfo().nickName, 30);
                viptype = client.getUserInfo().isVip;
            } else {
                username = user.info ? user.info.UserName : "";
                nickname = this.parseLen(user.info && user.info.Nickname ? user.info.Nickname : username, 30);
                viptype = user.info ? user.info.isVip : 0;
            }
            return username;
        },
        filterContent: function(content, isXB) {
            var regText = "", result = content, tempUsername, tempNickname;
            if (isXB) {
                tempUsername = this.xbUserName;
                tempNickname = this.xbNickName;
            } else {
                tempUsername = username;
                if (nickname.toUpperCase() == this.xbNickName) {
                    tempNickname = "用户小冰";
                } else {
                    tempNickname = nickname;
                }
            }
            regText = "(@" + tempNickname + ")+";
            regText = new RegExp(regText, "gim");
            result = result.replace(regText, '<em class="atsomeone " data-name="' + tempUsername + '" >$1</em> ');
            return result;
        },
        filterXBNickname: function(nickname, username) {
            if (nickname == this.xbNickName && username != this.xbUserName) {
                return "用户小冰";
            } else {
                return nickname;
            }
        },
        nightModeArray: [],
        onNightModeChange: function(callback) {
            this.nightModeArray.push(callback);
        },
        changeNightMode: function(state) {
            //state， 0代表白，1代表夜间
            var len = this.nightModeArray.length;
            while (len) {
                len--;
                this.nightModeArray[len](state);
            }
        },
        checkBindMobilePhone: function() {
            var self = this;
            this.loginarea.children().hide();
            this.bindphoneBtn.css("display", "block").parent().show();
            //客户端点播不用绑定手机
            if (platform === "clt" && this.playType == "vod") {
                self.hasBindPhone = true;
                self.popupbox.hide();
                //提示浮层关闭
                self.bindphoneBtn.parent().hide();
                self.textarea.show().parent().find(".num").show();
                return;
            }
            Loader.load("http://api.passport.pptv.com/v3/query/accountinfo.do", {
                username: self.getUserName(),
                token: user.info.token,
                from: "web"
            }, function(d) {
                log("checkBindMobilePhone===", d, decodeURIComponent(d.message));
                if (d && d.errorCode === 0 && d.result && d.result.isPhoneBound) {
                    self.hasBindPhone = true;
                    self.popupbox.hide();
                    //提示浮层关闭
                    self.bindphoneBtn.parent().hide();
                    self.textarea.show().parent().find(".num").show();
                    try {
                        //客户端通知绑定手机
                        if (platform === "clt") external.GetObject("@pplive.com/passport;1").IsBindPhone = true;
                    } catch (e) {}
                }
            });
        },
        htmlEncode: function(str) {
            return str.replace(/&/gm, "&amp;").replace(/</gm, "&lt;").replace(/>/gm, "&gt;").replace(/"/gm, "&quot;").replace(/'/gm, "&#039;");
        },
        htmlDecode: function(str) {
            if (str) {
                return str.replace(/&lt;/gm, "<").replace(/&gt;/gm, ">").replace(/&amp;/gm, "&").replace(/&#039;/gm, "'").replace(/&quot;/gm, '"').replace(/&apos;/gm, "'").replace(/&nbsp;/gm, " ");
            }
        },
        parseLen: function(str, count) {
            var l = 0, s = "";
            str = str.replace(/^(\s|\xA0)+|(\s|\xA0)+$/g, "");
            for (var i = 0; i < str.length && l < 2 * count; i++) {
                var c = str.charAt(i);
                l += c.match(/[^\x00-\xff]/g) ? 2 : 1;
                s += c;
            }
            return s;
        },
        counterText: function() {
            var counter = function(input, maxlenth) {
                this.input = input;
                this.max = maxlenth;
                var self = this, max = maxlenth || 30, loop;
                this.input.focusin(function() {
                    var l;
                    // if(!self.over){
                    loop = setInterval(function(event) {
                        l = self.count();
                        if (l <= max) {
                            self.over = false;
                            self.input.parent().find(".num").text(l + "/" + max);
                        } else {
                            self.input.val(input.val().substring(0, max));
                            self.over = true;
                        }
                    }, 100);
                }).focusout(function() {
                    clearInterval(loop);
                });
            };
            counter.prototype = {
                constructor: counter,
                count: function() {
                    var val = this.input.val(), i, l, res = 0;
                    for (i = 0, l = val.length; i < l; i++) {
                        res++;
                    }
                    return Math.ceil(res);
                }
            };
            return counter;
        }()
    };
    return ChatService;
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
 * @info:解决登录登出可能触发2次的bug
 * @auth:yanyang
 * @email:yyfireman@163.com
 * @example:
 *      user_fix().onLogin(clearModuleCacheKey).onLogout(clearModuleCacheKey); //每个user_fix()只能对应一个登录登出事件
 **/
define("util/user/user-fix", [ "util/user/user", "core/jquery/1.8.3/jquery", "client", "util/cookie/cookie" ], function(require, exports) {
    var user = require("util/user/user");
    var cookie = require("util/cookie/cookie");
    function onLogin(login, o) {
        user.onLogin(function(info) {
            // 登录再登出之后，打开登录弹窗时会错误触发onlogin，需要加ppToken验证登录状态
            if (!o.loginflag && cookie.get("ppToken")) {
                o.loginflag = true;
                o.logoutflag = false;
                login && login(info);
            }
        });
    }
    function onLogout(logout, o) {
        user.onLogout(function(info) {
            if (!o.logoutflag) {
                o.loginflag = false;
                o.logoutflag = true;
                logout && logout(info);
            }
        });
    }
    return function() {
        var o = {
            loginflag: false,
            logoutflag: false
        };
        return {
            onLogin: function(fn) {
                onLogin(fn, o);
                return this;
            },
            onLogout: function(fn) {
                onLogout(fn, o);
                return this;
            }
        };
    };
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

define("util/barrage/emojione", [], function(require, exports, modules) {
    /* jshint maxerr: 10000 */
    /* jslint unused: true */
    /* jshint shadow: true */
    /* jshint -W075 */
    (function(ns) {
        ns.emojioneList = {
            ":hash:": [ "0023-fe0f-20e3", "0023-20e3" ],
            ":zero:": [ "0030-fe0f-20e3", "0030-20e3" ],
            ":one:": [ "0031-fe0f-20e3", "0031-20e3" ],
            ":two:": [ "0032-fe0f-20e3", "0032-20e3" ],
            ":three:": [ "0033-fe0f-20e3", "0033-20e3" ],
            ":four:": [ "0034-fe0f-20e3", "0034-20e3" ],
            ":five:": [ "0035-fe0f-20e3", "0035-20e3" ],
            ":six:": [ "0036-fe0f-20e3", "0036-20e3" ],
            ":seven:": [ "0037-fe0f-20e3", "0037-20e3" ],
            ":eight:": [ "0038-fe0f-20e3", "0038-20e3" ],
            ":nine:": [ "0039-fe0f-20e3", "0039-20e3" ],
            ":copyright:": [ "00a9" ],
            ":registered:": [ "00ae" ],
            ":bangbang:": [ "203c-fe0f", "203c" ],
            ":interrobang:": [ "2049-fe0f", "2049" ],
            ":tm:": [ "2122" ],
            ":information_source:": [ "2139-fe0f", "2139" ],
            ":left_right_arrow:": [ "2194-fe0f", "2194" ],
            ":arrow_up_down:": [ "2195-fe0f", "2195" ],
            ":arrow_upper_left:": [ "2196-fe0f", "2196" ],
            ":arrow_upper_right:": [ "2197-fe0f", "2197" ],
            ":arrow_lower_right:": [ "2198-fe0f", "2198" ],
            ":arrow_lower_left:": [ "2199-fe0f", "2199" ],
            ":leftwards_arrow_with_hook:": [ "21a9-fe0f", "21a9" ],
            ":arrow_right_hook:": [ "21aa-fe0f", "21aa" ],
            ":watch:": [ "231a-fe0f", "231a" ],
            ":hourglass:": [ "231b-fe0f", "231b" ],
            ":fast_forward:": [ "23e9" ],
            ":rewind:": [ "23ea" ],
            ":arrow_double_up:": [ "23eb" ],
            ":arrow_double_down:": [ "23ec" ],
            ":alarm_clock:": [ "23f0" ],
            ":hourglass_flowing_sand:": [ "23f3" ],
            ":m:": [ "24c2-fe0f", "24c2" ],
            ":black_small_square:": [ "25aa-fe0f", "25aa" ],
            ":white_small_square:": [ "25ab-fe0f", "25ab" ],
            ":arrow_forward:": [ "25b6-fe0f", "25b6" ],
            ":arrow_backward:": [ "25c0-fe0f", "25c0" ],
            ":white_medium_square:": [ "25fb-fe0f", "25fb" ],
            ":black_medium_square:": [ "25fc-fe0f", "25fc" ],
            ":white_medium_small_square:": [ "25fd-fe0f", "25fd" ],
            ":black_medium_small_square:": [ "25fe-fe0f", "25fe" ],
            ":sunny:": [ "2600-fe0f", "2600" ],
            ":cloud:": [ "2601-fe0f", "2601" ],
            ":telephone:": [ "260e-fe0f", "260e" ],
            ":ballot_box_with_check:": [ "2611-fe0f", "2611" ],
            ":umbrella:": [ "2614-fe0f", "2614" ],
            ":coffee:": [ "2615-fe0f", "2615" ],
            ":point_up:": [ "261d-fe0f", "261d" ],
            ":relaxed:": [ "263a-fe0f", "263a" ],
            ":aries:": [ "2648-fe0f", "2648" ],
            ":taurus:": [ "2649-fe0f", "2649" ],
            ":gemini:": [ "264a-fe0f", "264a" ],
            ":cancer:": [ "264b-fe0f", "264b" ],
            ":leo:": [ "264c-fe0f", "264c" ],
            ":virgo:": [ "264d-fe0f", "264d" ],
            ":libra:": [ "264e-fe0f", "264e" ],
            ":scorpius:": [ "264f-fe0f", "264f" ],
            ":sagittarius:": [ "2650-fe0f", "2650" ],
            ":capricorn:": [ "2651-fe0f", "2651" ],
            ":aquarius:": [ "2652-fe0f", "2652" ],
            ":pisces:": [ "2653-fe0f", "2653" ],
            ":spades:": [ "2660-fe0f", "2660" ],
            ":clubs:": [ "2663-fe0f", "2663" ],
            ":hearts:": [ "2665-fe0f", "2665" ],
            ":diamonds:": [ "2666-fe0f", "2666" ],
            ":hotsprings:": [ "2668-fe0f", "2668" ],
            ":recycle:": [ "267b-fe0f", "267b" ],
            ":wheelchair:": [ "267f-fe0f", "267f" ],
            ":anchor:": [ "2693-fe0f", "2693" ],
            ":warning:": [ "26a0-fe0f", "26a0" ],
            ":zap:": [ "26a1-fe0f", "26a1" ],
            ":white_circle:": [ "26aa-fe0f", "26aa" ],
            ":black_circle:": [ "26ab-fe0f", "26ab" ],
            ":soccer:": [ "26bd-fe0f", "26bd" ],
            ":baseball:": [ "26be-fe0f", "26be" ],
            ":snowman:": [ "26c4-fe0f", "26c4" ],
            ":partly_sunny:": [ "26c5-fe0f", "26c5" ],
            ":ophiuchus:": [ "26ce" ],
            ":no_entry:": [ "26d4-fe0f", "26d4" ],
            ":church:": [ "26ea-fe0f", "26ea" ],
            ":fountain:": [ "26f2-fe0f", "26f2" ],
            ":golf:": [ "26f3-fe0f", "26f3" ],
            ":sailboat:": [ "26f5-fe0f", "26f5" ],
            ":tent:": [ "26fa-fe0f", "26fa" ],
            ":fuelpump:": [ "26fd-fe0f", "26fd" ],
            ":scissors:": [ "2702-fe0f", "2702" ],
            ":white_check_mark:": [ "2705" ],
            ":airplane:": [ "2708-fe0f", "2708" ],
            ":envelope:": [ "2709-fe0f", "2709" ],
            ":fist:": [ "270a" ],
            ":raised_hand:": [ "270b" ],
            ":v:": [ "270c-fe0f", "270c" ],
            ":pencil2:": [ "270f-fe0f", "270f" ],
            ":black_nib:": [ "2712-fe0f", "2712" ],
            ":heavy_check_mark:": [ "2714-fe0f", "2714" ],
            ":heavy_multiplication_x:": [ "2716-fe0f", "2716" ],
            ":sparkles:": [ "2728" ],
            ":eight_spoked_asterisk:": [ "2733-fe0f", "2733" ],
            ":eight_pointed_black_star:": [ "2734-fe0f", "2734" ],
            ":snowflake:": [ "2744-fe0f", "2744" ],
            ":sparkle:": [ "2747-fe0f", "2747" ],
            ":x:": [ "274c" ],
            ":negative_squared_cross_mark:": [ "274e" ],
            ":question:": [ "2753" ],
            ":grey_question:": [ "2754" ],
            ":grey_exclamation:": [ "2755" ],
            ":exclamation:": [ "2757-fe0f", "2757" ],
            ":heart:": [ "2764-fe0f", "2764" ],
            ":heavy_plus_sign:": [ "2795" ],
            ":heavy_minus_sign:": [ "2796" ],
            ":heavy_division_sign:": [ "2797" ],
            ":arrow_right:": [ "27a1-fe0f", "27a1" ],
            ":curly_loop:": [ "27b0" ],
            ":arrow_heading_up:": [ "2934-fe0f", "2934" ],
            ":arrow_heading_down:": [ "2935-fe0f", "2935" ],
            ":arrow_left:": [ "2b05-fe0f", "2b05" ],
            ":arrow_up:": [ "2b06-fe0f", "2b06" ],
            ":arrow_down:": [ "2b07-fe0f", "2b07" ],
            ":black_large_square:": [ "2b1b-fe0f", "2b1b" ],
            ":white_large_square:": [ "2b1c-fe0f", "2b1c" ],
            ":star:": [ "2b50-fe0f", "2b50" ],
            ":o:": [ "2b55-fe0f", "2b55" ],
            ":wavy_dash:": [ "3030" ],
            ":part_alternation_mark:": [ "303d-fe0f", "303d" ],
            ":congratulations:": [ "3297-fe0f", "3297" ],
            ":secret:": [ "3299-fe0f", "3299" ],
            ":mahjong:": [ "1f004-fe0f", "1f004" ],
            ":black_joker:": [ "1f0cf" ],
            ":a:": [ "1f170" ],
            ":b:": [ "1f171" ],
            ":o2:": [ "1f17e" ],
            ":parking:": [ "1f17f-fe0f", "1f17f" ],
            ":ab:": [ "1f18e" ],
            ":cl:": [ "1f191" ],
            ":cool:": [ "1f192" ],
            ":free:": [ "1f193" ],
            ":id:": [ "1f194" ],
            ":new:": [ "1f195" ],
            ":ng:": [ "1f196" ],
            ":ok:": [ "1f197" ],
            ":sos:": [ "1f198" ],
            ":up:": [ "1f199" ],
            ":vs:": [ "1f19a" ],
            ":cn:": [ "1f1e8-1f1f3" ],
            ":de:": [ "1f1e9-1f1ea" ],
            ":es:": [ "1f1ea-1f1f8" ],
            ":fr:": [ "1f1eb-1f1f7" ],
            ":gb:": [ "1f1ec-1f1e7" ],
            ":it:": [ "1f1ee-1f1f9" ],
            ":jp:": [ "1f1ef-1f1f5" ],
            ":kr:": [ "1f1f0-1f1f7" ],
            ":us:": [ "1f1fa-1f1f8" ],
            ":ru:": [ "1f1f7-1f1fa" ],
            ":koko:": [ "1f201" ],
            ":sa:": [ "1f202" ],
            ":u7121:": [ "1f21a-fe0f", "1f21a" ],
            ":u6307:": [ "1f22f-fe0f", "1f22f" ],
            ":u7981:": [ "1f232" ],
            ":u7a7a:": [ "1f233" ],
            ":u5408:": [ "1f234" ],
            ":u6e80:": [ "1f235" ],
            ":u6709:": [ "1f236" ],
            ":u6708:": [ "1f237" ],
            ":u7533:": [ "1f238" ],
            ":u5272:": [ "1f239" ],
            ":u55b6:": [ "1f23a" ],
            ":ideograph_advantage:": [ "1f250" ],
            ":accept:": [ "1f251" ],
            ":cyclone:": [ "1f300" ],
            ":foggy:": [ "1f301" ],
            ":closed_umbrella:": [ "1f302" ],
            ":night_with_stars:": [ "1f303" ],
            ":sunrise_over_mountains:": [ "1f304" ],
            ":sunrise:": [ "1f305" ],
            ":city_dusk:": [ "1f306" ],
            ":city_sunset:": [ "1f307" ],
            ":city_sunrise:": [ "1f307" ],
            ":rainbow:": [ "1f308" ],
            ":bridge_at_night:": [ "1f309" ],
            ":ocean:": [ "1f30a" ],
            ":volcano:": [ "1f30b" ],
            ":milky_way:": [ "1f30c" ],
            ":earth_asia:": [ "1f30f" ],
            ":new_moon:": [ "1f311" ],
            ":first_quarter_moon:": [ "1f313" ],
            ":waxing_gibbous_moon:": [ "1f314" ],
            ":full_moon:": [ "1f315" ],
            ":crescent_moon:": [ "1f319" ],
            ":first_quarter_moon_with_face:": [ "1f31b" ],
            ":star2:": [ "1f31f" ],
            ":stars:": [ "1f320" ],
            ":chestnut:": [ "1f330" ],
            ":seedling:": [ "1f331" ],
            ":palm_tree:": [ "1f334" ],
            ":cactus:": [ "1f335" ],
            ":tulip:": [ "1f337" ],
            ":cherry_blossom:": [ "1f338" ],
            ":rose:": [ "1f339" ],
            ":hibiscus:": [ "1f33a" ],
            ":sunflower:": [ "1f33b" ],
            ":blossom:": [ "1f33c" ],
            ":corn:": [ "1f33d" ],
            ":ear_of_rice:": [ "1f33e" ],
            ":herb:": [ "1f33f" ],
            ":four_leaf_clover:": [ "1f340" ],
            ":maple_leaf:": [ "1f341" ],
            ":fallen_leaf:": [ "1f342" ],
            ":leaves:": [ "1f343" ],
            ":mushroom:": [ "1f344" ],
            ":tomato:": [ "1f345" ],
            ":eggplant:": [ "1f346" ],
            ":grapes:": [ "1f347" ],
            ":melon:": [ "1f348" ],
            ":watermelon:": [ "1f349" ],
            ":tangerine:": [ "1f34a" ],
            ":banana:": [ "1f34c" ],
            ":pineapple:": [ "1f34d" ],
            ":apple:": [ "1f34e" ],
            ":green_apple:": [ "1f34f" ],
            ":peach:": [ "1f351" ],
            ":cherries:": [ "1f352" ],
            ":strawberry:": [ "1f353" ],
            ":hamburger:": [ "1f354" ],
            ":pizza:": [ "1f355" ],
            ":meat_on_bone:": [ "1f356" ],
            ":poultry_leg:": [ "1f357" ],
            ":rice_cracker:": [ "1f358" ],
            ":rice_ball:": [ "1f359" ],
            ":rice:": [ "1f35a" ],
            ":curry:": [ "1f35b" ],
            ":ramen:": [ "1f35c" ],
            ":spaghetti:": [ "1f35d" ],
            ":bread:": [ "1f35e" ],
            ":fries:": [ "1f35f" ],
            ":sweet_potato:": [ "1f360" ],
            ":dango:": [ "1f361" ],
            ":oden:": [ "1f362" ],
            ":sushi:": [ "1f363" ],
            ":fried_shrimp:": [ "1f364" ],
            ":fish_cake:": [ "1f365" ],
            ":icecream:": [ "1f366" ],
            ":shaved_ice:": [ "1f367" ],
            ":ice_cream:": [ "1f368" ],
            ":doughnut:": [ "1f369" ],
            ":cookie:": [ "1f36a" ],
            ":chocolate_bar:": [ "1f36b" ],
            ":candy:": [ "1f36c" ],
            ":lollipop:": [ "1f36d" ],
            ":custard:": [ "1f36e" ],
            ":honey_pot:": [ "1f36f" ],
            ":cake:": [ "1f370" ],
            ":bento:": [ "1f371" ],
            ":stew:": [ "1f372" ],
            ":egg:": [ "1f373" ],
            ":fork_and_knife:": [ "1f374" ],
            ":tea:": [ "1f375" ],
            ":sake:": [ "1f376" ],
            ":wine_glass:": [ "1f377" ],
            ":cocktail:": [ "1f378" ],
            ":tropical_drink:": [ "1f379" ],
            ":beer:": [ "1f37a" ],
            ":beers:": [ "1f37b" ],
            ":ribbon:": [ "1f380" ],
            ":gift:": [ "1f381" ],
            ":birthday:": [ "1f382" ],
            ":jack_o_lantern:": [ "1f383" ],
            ":christmas_tree:": [ "1f384" ],
            ":santa:": [ "1f385" ],
            ":fireworks:": [ "1f386" ],
            ":sparkler:": [ "1f387" ],
            ":balloon:": [ "1f388" ],
            ":tada:": [ "1f389" ],
            ":confetti_ball:": [ "1f38a" ],
            ":tanabata_tree:": [ "1f38b" ],
            ":crossed_flags:": [ "1f38c" ],
            ":bamboo:": [ "1f38d" ],
            ":dolls:": [ "1f38e" ],
            ":flags:": [ "1f38f" ],
            ":wind_chime:": [ "1f390" ],
            ":rice_scene:": [ "1f391" ],
            ":school_satchel:": [ "1f392" ],
            ":mortar_board:": [ "1f393" ],
            ":carousel_horse:": [ "1f3a0" ],
            ":ferris_wheel:": [ "1f3a1" ],
            ":roller_coaster:": [ "1f3a2" ],
            ":fishing_pole_and_fish:": [ "1f3a3" ],
            ":microphone:": [ "1f3a4" ],
            ":movie_camera:": [ "1f3a5" ],
            ":cinema:": [ "1f3a6" ],
            ":headphones:": [ "1f3a7" ],
            ":art:": [ "1f3a8" ],
            ":tophat:": [ "1f3a9" ],
            ":circus_tent:": [ "1f3aa" ],
            ":ticket:": [ "1f3ab" ],
            ":clapper:": [ "1f3ac" ],
            ":performing_arts:": [ "1f3ad" ],
            ":video_game:": [ "1f3ae" ],
            ":dart:": [ "1f3af" ],
            ":slot_machine:": [ "1f3b0" ],
            ":8ball:": [ "1f3b1" ],
            ":game_die:": [ "1f3b2" ],
            ":bowling:": [ "1f3b3" ],
            ":flower_playing_cards:": [ "1f3b4" ],
            ":musical_note:": [ "1f3b5" ],
            ":notes:": [ "1f3b6" ],
            ":saxophone:": [ "1f3b7" ],
            ":guitar:": [ "1f3b8" ],
            ":musical_keyboard:": [ "1f3b9" ],
            ":trumpet:": [ "1f3ba" ],
            ":violin:": [ "1f3bb" ],
            ":musical_score:": [ "1f3bc" ],
            ":running_shirt_with_sash:": [ "1f3bd" ],
            ":tennis:": [ "1f3be" ],
            ":ski:": [ "1f3bf" ],
            ":basketball:": [ "1f3c0" ],
            ":checkered_flag:": [ "1f3c1" ],
            ":snowboarder:": [ "1f3c2" ],
            ":runner:": [ "1f3c3" ],
            ":surfer:": [ "1f3c4" ],
            ":trophy:": [ "1f3c6" ],
            ":football:": [ "1f3c8" ],
            ":swimmer:": [ "1f3ca" ],
            ":house:": [ "1f3e0" ],
            ":house_with_garden:": [ "1f3e1" ],
            ":office:": [ "1f3e2" ],
            ":post_office:": [ "1f3e3" ],
            ":hospital:": [ "1f3e5" ],
            ":bank:": [ "1f3e6" ],
            ":atm:": [ "1f3e7" ],
            ":hotel:": [ "1f3e8" ],
            ":love_hotel:": [ "1f3e9" ],
            ":convenience_store:": [ "1f3ea" ],
            ":school:": [ "1f3eb" ],
            ":department_store:": [ "1f3ec" ],
            ":factory:": [ "1f3ed" ],
            ":izakaya_lantern:": [ "1f3ee" ],
            ":japanese_castle:": [ "1f3ef" ],
            ":european_castle:": [ "1f3f0" ],
            ":snail:": [ "1f40c" ],
            ":snake:": [ "1f40d" ],
            ":racehorse:": [ "1f40e" ],
            ":sheep:": [ "1f411" ],
            ":monkey:": [ "1f412" ],
            ":chicken:": [ "1f414" ],
            ":boar:": [ "1f417" ],
            ":elephant:": [ "1f418" ],
            ":octopus:": [ "1f419" ],
            ":shell:": [ "1f41a" ],
            ":bug:": [ "1f41b" ],
            ":ant:": [ "1f41c" ],
            ":bee:": [ "1f41d" ],
            ":beetle:": [ "1f41e" ],
            ":fish:": [ "1f41f" ],
            ":tropical_fish:": [ "1f420" ],
            ":blowfish:": [ "1f421" ],
            ":turtle:": [ "1f422" ],
            ":hatching_chick:": [ "1f423" ],
            ":baby_chick:": [ "1f424" ],
            ":hatched_chick:": [ "1f425" ],
            ":bird:": [ "1f426" ],
            ":penguin:": [ "1f427" ],
            ":koala:": [ "1f428" ],
            ":poodle:": [ "1f429" ],
            ":camel:": [ "1f42b" ],
            ":dolphin:": [ "1f42c" ],
            ":mouse:": [ "1f42d" ],
            ":cow:": [ "1f42e" ],
            ":tiger:": [ "1f42f" ],
            ":rabbit:": [ "1f430" ],
            ":cat:": [ "1f431" ],
            ":dragon_face:": [ "1f432" ],
            ":whale:": [ "1f433" ],
            ":horse:": [ "1f434" ],
            ":monkey_face:": [ "1f435" ],
            ":dog:": [ "1f436" ],
            ":pig:": [ "1f437" ],
            ":frog:": [ "1f438" ],
            ":hamster:": [ "1f439" ],
            ":wolf:": [ "1f43a" ],
            ":bear:": [ "1f43b" ],
            ":panda_face:": [ "1f43c" ],
            ":pig_nose:": [ "1f43d" ],
            ":feet:": [ "1f43e" ],
            ":eyes:": [ "1f440" ],
            ":ear:": [ "1f442" ],
            ":nose:": [ "1f443" ],
            ":lips:": [ "1f444" ],
            ":tongue:": [ "1f445" ],
            ":point_up_2:": [ "1f446" ],
            ":point_down:": [ "1f447" ],
            ":point_left:": [ "1f448" ],
            ":point_right:": [ "1f449" ],
            ":punch:": [ "1f44a" ],
            ":wave:": [ "1f44b" ],
            ":ok_hand:": [ "1f44c" ],
            ":thumbsup:": [ "1f44d" ],
            ":+1:": [ "1f44d" ],
            ":thumbsdown:": [ "1f44e" ],
            ":-1:": [ "1f44e" ],
            ":clap:": [ "1f44f" ],
            ":open_hands:": [ "1f450" ],
            ":crown:": [ "1f451" ],
            ":womans_hat:": [ "1f452" ],
            ":eyeglasses:": [ "1f453" ],
            ":necktie:": [ "1f454" ],
            ":shirt:": [ "1f455" ],
            ":jeans:": [ "1f456" ],
            ":dress:": [ "1f457" ],
            ":kimono:": [ "1f458" ],
            ":bikini:": [ "1f459" ],
            ":womans_clothes:": [ "1f45a" ],
            ":purse:": [ "1f45b" ],
            ":handbag:": [ "1f45c" ],
            ":pouch:": [ "1f45d" ],
            ":mans_shoe:": [ "1f45e" ],
            ":athletic_shoe:": [ "1f45f" ],
            ":high_heel:": [ "1f460" ],
            ":sandal:": [ "1f461" ],
            ":boot:": [ "1f462" ],
            ":footprints:": [ "1f463" ],
            ":bust_in_silhouette:": [ "1f464" ],
            ":boy:": [ "1f466" ],
            ":girl:": [ "1f467" ],
            ":man:": [ "1f468" ],
            ":woman:": [ "1f469" ],
            ":family:": [ "1f46a" ],
            ":couple:": [ "1f46b" ],
            ":cop:": [ "1f46e" ],
            ":dancers:": [ "1f46f" ],
            ":bride_with_veil:": [ "1f470" ],
            ":person_with_blond_hair:": [ "1f471" ],
            ":man_with_gua_pi_mao:": [ "1f472" ],
            ":man_with_turban:": [ "1f473" ],
            ":older_man:": [ "1f474" ],
            ":older_woman:": [ "1f475" ],
            ":grandma:": [ "1f475" ],
            ":baby:": [ "1f476" ],
            ":construction_worker:": [ "1f477" ],
            ":princess:": [ "1f478" ],
            ":japanese_ogre:": [ "1f479" ],
            ":japanese_goblin:": [ "1f47a" ],
            ":ghost:": [ "1f47b" ],
            ":angel:": [ "1f47c" ],
            ":alien:": [ "1f47d" ],
            ":space_invader:": [ "1f47e" ],
            ":imp:": [ "1f47f" ],
            ":skull:": [ "1f480" ],
            ":skeleton:": [ "1f480" ],
            ":card_index:": [ "1f4c7" ],
            ":information_desk_person:": [ "1f481" ],
            ":guardsman:": [ "1f482" ],
            ":dancer:": [ "1f483" ],
            ":lipstick:": [ "1f484" ],
            ":nail_care:": [ "1f485" ],
            ":ledger:": [ "1f4d2" ],
            ":massage:": [ "1f486" ],
            ":notebook:": [ "1f4d3" ],
            ":haircut:": [ "1f487" ],
            ":notebook_with_decorative_cover:": [ "1f4d4" ],
            ":barber:": [ "1f488" ],
            ":closed_book:": [ "1f4d5" ],
            ":syringe:": [ "1f489" ],
            ":book:": [ "1f4d6" ],
            ":pill:": [ "1f48a" ],
            ":green_book:": [ "1f4d7" ],
            ":kiss:": [ "1f48b" ],
            ":blue_book:": [ "1f4d8" ],
            ":love_letter:": [ "1f48c" ],
            ":orange_book:": [ "1f4d9" ],
            ":ring:": [ "1f48d" ],
            ":books:": [ "1f4da" ],
            ":gem:": [ "1f48e" ],
            ":name_badge:": [ "1f4db" ],
            ":couplekiss:": [ "1f48f" ],
            ":scroll:": [ "1f4dc" ],
            ":bouquet:": [ "1f490" ],
            ":pencil:": [ "1f4dd" ],
            ":couple_with_heart:": [ "1f491" ],
            ":telephone_receiver:": [ "1f4de" ],
            ":wedding:": [ "1f492" ],
            ":pager:": [ "1f4df" ],
            ":fax:": [ "1f4e0" ],
            ":heartbeat:": [ "1f493" ],
            ":satellite:": [ "1f4e1" ],
            ":loudspeaker:": [ "1f4e2" ],
            ":broken_heart:": [ "1f494" ],
            ":mega:": [ "1f4e3" ],
            ":outbox_tray:": [ "1f4e4" ],
            ":two_hearts:": [ "1f495" ],
            ":inbox_tray:": [ "1f4e5" ],
            ":package:": [ "1f4e6" ],
            ":sparkling_heart:": [ "1f496" ],
            ":e-mail:": [ "1f4e7" ],
            ":email:": [ "1f4e7" ],
            ":incoming_envelope:": [ "1f4e8" ],
            ":heartpulse:": [ "1f497" ],
            ":envelope_with_arrow:": [ "1f4e9" ],
            ":mailbox_closed:": [ "1f4ea" ],
            ":cupid:": [ "1f498" ],
            ":mailbox:": [ "1f4eb" ],
            ":postbox:": [ "1f4ee" ],
            ":blue_heart:": [ "1f499" ],
            ":newspaper:": [ "1f4f0" ],
            ":iphone:": [ "1f4f1" ],
            ":green_heart:": [ "1f49a" ],
            ":calling:": [ "1f4f2" ],
            ":vibration_mode:": [ "1f4f3" ],
            ":yellow_heart:": [ "1f49b" ],
            ":mobile_phone_off:": [ "1f4f4" ],
            ":signal_strength:": [ "1f4f6" ],
            ":purple_heart:": [ "1f49c" ],
            ":camera:": [ "1f4f7" ],
            ":video_camera:": [ "1f4f9" ],
            ":gift_heart:": [ "1f49d" ],
            ":tv:": [ "1f4fa" ],
            ":radio:": [ "1f4fb" ],
            ":revolving_hearts:": [ "1f49e" ],
            ":vhs:": [ "1f4fc" ],
            ":arrows_clockwise:": [ "1f503" ],
            ":heart_decoration:": [ "1f49f" ],
            ":loud_sound:": [ "1f50a" ],
            ":battery:": [ "1f50b" ],
            ":diamond_shape_with_a_dot_inside:": [ "1f4a0" ],
            ":electric_plug:": [ "1f50c" ],
            ":mag:": [ "1f50d" ],
            ":bulb:": [ "1f4a1" ],
            ":mag_right:": [ "1f50e" ],
            ":lock_with_ink_pen:": [ "1f50f" ],
            ":anger:": [ "1f4a2" ],
            ":closed_lock_with_key:": [ "1f510" ],
            ":key:": [ "1f511" ],
            ":bomb:": [ "1f4a3" ],
            ":lock:": [ "1f512" ],
            ":unlock:": [ "1f513" ],
            ":zzz:": [ "1f4a4" ],
            ":bell:": [ "1f514" ],
            ":bookmark:": [ "1f516" ],
            ":boom:": [ "1f4a5" ],
            ":link:": [ "1f517" ],
            ":radio_button:": [ "1f518" ],
            ":sweat_drops:": [ "1f4a6" ],
            ":back:": [ "1f519" ],
            ":end:": [ "1f51a" ],
            ":droplet:": [ "1f4a7" ],
            ":on:": [ "1f51b" ],
            ":soon:": [ "1f51c" ],
            ":dash:": [ "1f4a8" ],
            ":top:": [ "1f51d" ],
            ":underage:": [ "1f51e" ],
            ":poop:": [ "1f4a9" ],
            ":shit:": [ "1f4a9" ],
            ":hankey:": [ "1f4a9" ],
            ":poo:": [ "1f4a9" ],
            ":keycap_ten:": [ "1f51f" ],
            ":muscle:": [ "1f4aa" ],
            ":capital_abcd:": [ "1f520" ],
            ":abcd:": [ "1f521" ],
            ":dizzy:": [ "1f4ab" ],
            ":1234:": [ "1f522" ],
            ":symbols:": [ "1f523" ],
            ":speech_balloon:": [ "1f4ac" ],
            ":abc:": [ "1f524" ],
            ":fire:": [ "1f525" ],
            ":flame:": [ "1f525" ],
            ":white_flower:": [ "1f4ae" ],
            ":flashlight:": [ "1f526" ],
            ":wrench:": [ "1f527" ],
            ":100:": [ "1f4af" ],
            ":hammer:": [ "1f528" ],
            ":nut_and_bolt:": [ "1f529" ],
            ":moneybag:": [ "1f4b0" ],
            ":knife:": [ "1f52a" ],
            ":gun:": [ "1f52b" ],
            ":currency_exchange:": [ "1f4b1" ],
            ":crystal_ball:": [ "1f52e" ],
            ":heavy_dollar_sign:": [ "1f4b2" ],
            ":six_pointed_star:": [ "1f52f" ],
            ":credit_card:": [ "1f4b3" ],
            ":beginner:": [ "1f530" ],
            ":trident:": [ "1f531" ],
            ":yen:": [ "1f4b4" ],
            ":black_square_button:": [ "1f532" ],
            ":white_square_button:": [ "1f533" ],
            ":dollar:": [ "1f4b5" ],
            ":red_circle:": [ "1f534" ],
            ":large_blue_circle:": [ "1f535" ],
            ":money_with_wings:": [ "1f4b8" ],
            ":large_orange_diamond:": [ "1f536" ],
            ":large_blue_diamond:": [ "1f537" ],
            ":chart:": [ "1f4b9" ],
            ":small_orange_diamond:": [ "1f538" ],
            ":small_blue_diamond:": [ "1f539" ],
            ":seat:": [ "1f4ba" ],
            ":small_red_triangle:": [ "1f53a" ],
            ":small_red_triangle_down:": [ "1f53b" ],
            ":computer:": [ "1f4bb" ],
            ":arrow_up_small:": [ "1f53c" ],
            ":briefcase:": [ "1f4bc" ],
            ":arrow_down_small:": [ "1f53d" ],
            ":clock1:": [ "1f550" ],
            ":minidisc:": [ "1f4bd" ],
            ":clock2:": [ "1f551" ],
            ":floppy_disk:": [ "1f4be" ],
            ":clock3:": [ "1f552" ],
            ":cd:": [ "1f4bf" ],
            ":clock4:": [ "1f553" ],
            ":dvd:": [ "1f4c0" ],
            ":clock5:": [ "1f554" ],
            ":clock6:": [ "1f555" ],
            ":file_folder:": [ "1f4c1" ],
            ":clock7:": [ "1f556" ],
            ":clock8:": [ "1f557" ],
            ":open_file_folder:": [ "1f4c2" ],
            ":clock9:": [ "1f558" ],
            ":clock10:": [ "1f559" ],
            ":page_with_curl:": [ "1f4c3" ],
            ":clock11:": [ "1f55a" ],
            ":clock12:": [ "1f55b" ],
            ":page_facing_up:": [ "1f4c4" ],
            ":mount_fuji:": [ "1f5fb" ],
            ":tokyo_tower:": [ "1f5fc" ],
            ":date:": [ "1f4c5" ],
            ":statue_of_liberty:": [ "1f5fd" ],
            ":japan:": [ "1f5fe" ],
            ":calendar:": [ "1f4c6" ],
            ":moyai:": [ "1f5ff" ],
            ":grin:": [ "1f601" ],
            ":joy:": [ "1f602" ],
            ":smiley:": [ "1f603" ],
            ":chart_with_upwards_trend:": [ "1f4c8" ],
            ":smile:": [ "1f604" ],
            ":sweat_smile:": [ "1f605" ],
            ":chart_with_downwards_trend:": [ "1f4c9" ],
            ":laughing:": [ "1f606" ],
            ":satisfied:": [ "1f606" ],
            ":wink:": [ "1f609" ],
            ":bar_chart:": [ "1f4ca" ],
            ":blush:": [ "1f60a" ],
            ":yum:": [ "1f60b" ],
            ":clipboard:": [ "1f4cb" ],
            ":relieved:": [ "1f60c" ],
            ":heart_eyes:": [ "1f60d" ],
            ":pushpin:": [ "1f4cc" ],
            ":smirk:": [ "1f60f" ],
            ":unamused:": [ "1f612" ],
            ":round_pushpin:": [ "1f4cd" ],
            ":sweat:": [ "1f613" ],
            ":pensive:": [ "1f614" ],
            ":paperclip:": [ "1f4ce" ],
            ":confounded:": [ "1f616" ],
            ":kissing_heart:": [ "1f618" ],
            ":straight_ruler:": [ "1f4cf" ],
            ":kissing_closed_eyes:": [ "1f61a" ],
            ":stuck_out_tongue_winking_eye:": [ "1f61c" ],
            ":triangular_ruler:": [ "1f4d0" ],
            ":stuck_out_tongue_closed_eyes:": [ "1f61d" ],
            ":disappointed:": [ "1f61e" ],
            ":bookmark_tabs:": [ "1f4d1" ],
            ":angry:": [ "1f620" ],
            ":rage:": [ "1f621" ],
            ":cry:": [ "1f622" ],
            ":persevere:": [ "1f623" ],
            ":triumph:": [ "1f624" ],
            ":disappointed_relieved:": [ "1f625" ],
            ":fearful:": [ "1f628" ],
            ":weary:": [ "1f629" ],
            ":sleepy:": [ "1f62a" ],
            ":tired_face:": [ "1f62b" ],
            ":sob:": [ "1f62d" ],
            ":cold_sweat:": [ "1f630" ],
            ":scream:": [ "1f631" ],
            ":astonished:": [ "1f632" ],
            ":flushed:": [ "1f633" ],
            ":dizzy_face:": [ "1f635" ],
            ":mask:": [ "1f637" ],
            ":smile_cat:": [ "1f638" ],
            ":joy_cat:": [ "1f639" ],
            ":smiley_cat:": [ "1f63a" ],
            ":heart_eyes_cat:": [ "1f63b" ],
            ":smirk_cat:": [ "1f63c" ],
            ":kissing_cat:": [ "1f63d" ],
            ":pouting_cat:": [ "1f63e" ],
            ":crying_cat_face:": [ "1f63f" ],
            ":scream_cat:": [ "1f640" ],
            ":no_good:": [ "1f645" ],
            ":ok_woman:": [ "1f646" ],
            ":bow:": [ "1f647" ],
            ":see_no_evil:": [ "1f648" ],
            ":hear_no_evil:": [ "1f649" ],
            ":speak_no_evil:": [ "1f64a" ],
            ":raising_hand:": [ "1f64b" ],
            ":raised_hands:": [ "1f64c" ],
            ":person_frowning:": [ "1f64d" ],
            ":person_with_pouting_face:": [ "1f64e" ],
            ":pray:": [ "1f64f" ],
            ":rocket:": [ "1f680" ],
            ":railway_car:": [ "1f683" ],
            ":bullettrain_side:": [ "1f684" ],
            ":bullettrain_front:": [ "1f685" ],
            ":metro:": [ "1f687" ],
            ":station:": [ "1f689" ],
            ":bus:": [ "1f68c" ],
            ":busstop:": [ "1f68f" ],
            ":ambulance:": [ "1f691" ],
            ":fire_engine:": [ "1f692" ],
            ":police_car:": [ "1f693" ],
            ":taxi:": [ "1f695" ],
            ":red_car:": [ "1f697" ],
            ":blue_car:": [ "1f699" ],
            ":truck:": [ "1f69a" ],
            ":ship:": [ "1f6a2" ],
            ":speedboat:": [ "1f6a4" ],
            ":traffic_light:": [ "1f6a5" ],
            ":construction:": [ "1f6a7" ],
            ":rotating_light:": [ "1f6a8" ],
            ":triangular_flag_on_post:": [ "1f6a9" ],
            ":door:": [ "1f6aa" ],
            ":no_entry_sign:": [ "1f6ab" ],
            ":smoking:": [ "1f6ac" ],
            ":no_smoking:": [ "1f6ad" ],
            ":bike:": [ "1f6b2" ],
            ":walking:": [ "1f6b6" ],
            ":mens:": [ "1f6b9" ],
            ":womens:": [ "1f6ba" ],
            ":restroom:": [ "1f6bb" ],
            ":baby_symbol:": [ "1f6bc" ],
            ":toilet:": [ "1f6bd" ],
            ":wc:": [ "1f6be" ],
            ":bath:": [ "1f6c0" ],
            ":grinning:": [ "1f600" ],
            ":innocent:": [ "1f607" ],
            ":smiling_imp:": [ "1f608" ],
            ":sunglasses:": [ "1f60e" ],
            ":neutral_face:": [ "1f610" ],
            ":expressionless:": [ "1f611" ],
            ":confused:": [ "1f615" ],
            ":kissing:": [ "1f617" ],
            ":kissing_smiling_eyes:": [ "1f619" ],
            ":stuck_out_tongue:": [ "1f61b" ],
            ":worried:": [ "1f61f" ],
            ":frowning:": [ "1f626" ],
            ":anguished:": [ "1f627" ],
            ":grimacing:": [ "1f62c" ],
            ":open_mouth:": [ "1f62e" ],
            ":hushed:": [ "1f62f" ],
            ":sleeping:": [ "1f634" ],
            ":no_mouth:": [ "1f636" ],
            ":helicopter:": [ "1f681" ],
            ":steam_locomotive:": [ "1f682" ],
            ":train2:": [ "1f686" ],
            ":light_rail:": [ "1f688" ],
            ":tram:": [ "1f68a" ],
            ":oncoming_bus:": [ "1f68d" ],
            ":trolleybus:": [ "1f68e" ],
            ":minibus:": [ "1f690" ],
            ":oncoming_police_car:": [ "1f694" ],
            ":oncoming_taxi:": [ "1f696" ],
            ":oncoming_automobile:": [ "1f698" ],
            ":articulated_lorry:": [ "1f69b" ],
            ":tractor:": [ "1f69c" ],
            ":monorail:": [ "1f69d" ],
            ":mountain_railway:": [ "1f69e" ],
            ":suspension_railway:": [ "1f69f" ],
            ":mountain_cableway:": [ "1f6a0" ],
            ":aerial_tramway:": [ "1f6a1" ],
            ":rowboat:": [ "1f6a3" ],
            ":vertical_traffic_light:": [ "1f6a6" ],
            ":put_litter_in_its_place:": [ "1f6ae" ],
            ":do_not_litter:": [ "1f6af" ],
            ":potable_water:": [ "1f6b0" ],
            ":non-potable_water:": [ "1f6b1" ],
            ":no_bicycles:": [ "1f6b3" ],
            ":bicyclist:": [ "1f6b4" ],
            ":mountain_bicyclist:": [ "1f6b5" ],
            ":no_pedestrians:": [ "1f6b7" ],
            ":children_crossing:": [ "1f6b8" ],
            ":shower:": [ "1f6bf" ],
            ":bathtub:": [ "1f6c1" ],
            ":passport_control:": [ "1f6c2" ],
            ":customs:": [ "1f6c3" ],
            ":baggage_claim:": [ "1f6c4" ],
            ":left_luggage:": [ "1f6c5" ],
            ":earth_africa:": [ "1f30d" ],
            ":earth_americas:": [ "1f30e" ],
            ":globe_with_meridians:": [ "1f310" ],
            ":waxing_crescent_moon:": [ "1f312" ],
            ":waning_gibbous_moon:": [ "1f316" ],
            ":last_quarter_moon:": [ "1f317" ],
            ":waning_crescent_moon:": [ "1f318" ],
            ":new_moon_with_face:": [ "1f31a" ],
            ":last_quarter_moon_with_face:": [ "1f31c" ],
            ":full_moon_with_face:": [ "1f31d" ],
            ":sun_with_face:": [ "1f31e" ],
            ":evergreen_tree:": [ "1f332" ],
            ":deciduous_tree:": [ "1f333" ],
            ":lemon:": [ "1f34b" ],
            ":pear:": [ "1f350" ],
            ":baby_bottle:": [ "1f37c" ],
            ":horse_racing:": [ "1f3c7" ],
            ":rugby_football:": [ "1f3c9" ],
            ":european_post_office:": [ "1f3e4" ],
            ":rat:": [ "1f400" ],
            ":mouse2:": [ "1f401" ],
            ":ox:": [ "1f402" ],
            ":water_buffalo:": [ "1f403" ],
            ":cow2:": [ "1f404" ],
            ":tiger2:": [ "1f405" ],
            ":leopard:": [ "1f406" ],
            ":rabbit2:": [ "1f407" ],
            ":cat2:": [ "1f408" ],
            ":dragon:": [ "1f409" ],
            ":crocodile:": [ "1f40a" ],
            ":whale2:": [ "1f40b" ],
            ":ram:": [ "1f40f" ],
            ":goat:": [ "1f410" ],
            ":rooster:": [ "1f413" ],
            ":dog2:": [ "1f415" ],
            ":pig2:": [ "1f416" ],
            ":dromedary_camel:": [ "1f42a" ],
            ":busts_in_silhouette:": [ "1f465" ],
            ":two_men_holding_hands:": [ "1f46c" ],
            ":two_women_holding_hands:": [ "1f46d" ],
            ":thought_balloon:": [ "1f4ad" ],
            ":euro:": [ "1f4b6" ],
            ":pound:": [ "1f4b7" ],
            ":mailbox_with_mail:": [ "1f4ec" ],
            ":mailbox_with_no_mail:": [ "1f4ed" ],
            ":postal_horn:": [ "1f4ef" ],
            ":no_mobile_phones:": [ "1f4f5" ],
            ":twisted_rightwards_arrows:": [ "1f500" ],
            ":repeat:": [ "1f501" ],
            ":repeat_one:": [ "1f502" ],
            ":arrows_counterclockwise:": [ "1f504" ],
            ":low_brightness:": [ "1f505" ],
            ":high_brightness:": [ "1f506" ],
            ":mute:": [ "1f507" ],
            ":sound:": [ "1f509" ],
            ":no_bell:": [ "1f515" ],
            ":microscope:": [ "1f52c" ],
            ":telescope:": [ "1f52d" ],
            ":clock130:": [ "1f55c" ],
            ":clock230:": [ "1f55d" ],
            ":clock330:": [ "1f55e" ],
            ":clock430:": [ "1f55f" ],
            ":clock530:": [ "1f560" ],
            ":clock630:": [ "1f561" ],
            ":clock730:": [ "1f562" ],
            ":clock830:": [ "1f563" ],
            ":clock930:": [ "1f564" ],
            ":clock1030:": [ "1f565" ],
            ":clock1130:": [ "1f566" ],
            ":clock1230:": [ "1f567" ],
            ":speaker:": [ "1f508" ],
            ":train:": [ "1f68b" ],
            ":loop:": [ "27bf" ],
            ":af:": [ "1f1e6-1f1eb" ],
            ":al:": [ "1f1e6-1f1f1" ],
            ":dz:": [ "1f1e9-1f1ff" ],
            ":ad:": [ "1f1e6-1f1e9" ],
            ":ao:": [ "1f1e6-1f1f4" ],
            ":ag:": [ "1f1e6-1f1ec" ],
            ":ar:": [ "1f1e6-1f1f7" ],
            ":am:": [ "1f1e6-1f1f2" ],
            ":au:": [ "1f1e6-1f1fa" ],
            ":at:": [ "1f1e6-1f1f9" ],
            ":az:": [ "1f1e6-1f1ff" ],
            ":bs:": [ "1f1e7-1f1f8" ],
            ":bh:": [ "1f1e7-1f1ed" ],
            ":bd:": [ "1f1e7-1f1e9" ],
            ":bb:": [ "1f1e7-1f1e7" ],
            ":by:": [ "1f1e7-1f1fe" ],
            ":be:": [ "1f1e7-1f1ea" ],
            ":bz:": [ "1f1e7-1f1ff" ],
            ":bj:": [ "1f1e7-1f1ef" ],
            ":bt:": [ "1f1e7-1f1f9" ],
            ":bo:": [ "1f1e7-1f1f4" ],
            ":ba:": [ "1f1e7-1f1e6" ],
            ":bw:": [ "1f1e7-1f1fc" ],
            ":br:": [ "1f1e7-1f1f7" ],
            ":bn:": [ "1f1e7-1f1f3" ],
            ":bg:": [ "1f1e7-1f1ec" ],
            ":bf:": [ "1f1e7-1f1eb" ],
            ":bi:": [ "1f1e7-1f1ee" ],
            ":kh:": [ "1f1f0-1f1ed" ],
            ":cm:": [ "1f1e8-1f1f2" ],
            ":ca:": [ "1f1e8-1f1e6" ],
            ":cv:": [ "1f1e8-1f1fb" ],
            ":cf:": [ "1f1e8-1f1eb" ],
            ":td:": [ "1f1f9-1f1e9" ],
            ":chile:": [ "1f1e8-1f1f1" ],
            ":co:": [ "1f1e8-1f1f4" ],
            ":km:": [ "1f1f0-1f1f2" ],
            ":cr:": [ "1f1e8-1f1f7" ],
            ":ci:": [ "1f1e8-1f1ee" ],
            ":hr:": [ "1f1ed-1f1f7" ],
            ":cu:": [ "1f1e8-1f1fa" ],
            ":cy:": [ "1f1e8-1f1fe" ],
            ":cz:": [ "1f1e8-1f1ff" ],
            ":congo:": [ "1f1e8-1f1e9" ],
            ":dk:": [ "1f1e9-1f1f0" ],
            ":dj:": [ "1f1e9-1f1ef" ],
            ":dm:": [ "1f1e9-1f1f2" ],
            ":do:": [ "1f1e9-1f1f4" ],
            ":tl:": [ "1f1f9-1f1f1" ],
            ":ec:": [ "1f1ea-1f1e8" ],
            ":eg:": [ "1f1ea-1f1ec" ],
            ":sv:": [ "1f1f8-1f1fb" ],
            ":gq:": [ "1f1ec-1f1f6" ],
            ":er:": [ "1f1ea-1f1f7" ],
            ":ee:": [ "1f1ea-1f1ea" ],
            ":et:": [ "1f1ea-1f1f9" ],
            ":fj:": [ "1f1eb-1f1ef" ],
            ":fi:": [ "1f1eb-1f1ee" ],
            ":ga:": [ "1f1ec-1f1e6" ],
            ":gm:": [ "1f1ec-1f1f2" ],
            ":ge:": [ "1f1ec-1f1ea" ],
            ":gh:": [ "1f1ec-1f1ed" ],
            ":gr:": [ "1f1ec-1f1f7" ],
            ":gd:": [ "1f1ec-1f1e9" ],
            ":gt:": [ "1f1ec-1f1f9" ],
            ":gn:": [ "1f1ec-1f1f3" ],
            ":gw:": [ "1f1ec-1f1fc" ],
            ":gy:": [ "1f1ec-1f1fe" ],
            ":ht:": [ "1f1ed-1f1f9" ],
            ":hn:": [ "1f1ed-1f1f3" ],
            ":hu:": [ "1f1ed-1f1fa" ],
            ":is:": [ "1f1ee-1f1f8" ],
            ":in:": [ "1f1ee-1f1f3" ],
            ":indonesia:": [ "1f1ee-1f1e9" ],
            ":ir:": [ "1f1ee-1f1f7" ],
            ":iq:": [ "1f1ee-1f1f6" ],
            ":ie:": [ "1f1ee-1f1ea" ],
            ":il:": [ "1f1ee-1f1f1" ],
            ":jm:": [ "1f1ef-1f1f2" ],
            ":jo:": [ "1f1ef-1f1f4" ],
            ":kz:": [ "1f1f0-1f1ff" ],
            ":ke:": [ "1f1f0-1f1ea" ],
            ":ki:": [ "1f1f0-1f1ee" ],
            ":xk:": [ "1f1fd-1f1f0" ],
            ":kw:": [ "1f1f0-1f1fc" ],
            ":kg:": [ "1f1f0-1f1ec" ],
            ":la:": [ "1f1f1-1f1e6" ],
            ":lv:": [ "1f1f1-1f1fb" ],
            ":lb:": [ "1f1f1-1f1e7" ],
            ":ls:": [ "1f1f1-1f1f8" ],
            ":lr:": [ "1f1f1-1f1f7" ],
            ":ly:": [ "1f1f1-1f1fe" ],
            ":li:": [ "1f1f1-1f1ee" ],
            ":lt:": [ "1f1f1-1f1f9" ],
            ":lu:": [ "1f1f1-1f1fa" ],
            ":mk:": [ "1f1f2-1f1f0" ],
            ":mg:": [ "1f1f2-1f1ec" ],
            ":mw:": [ "1f1f2-1f1fc" ],
            ":my:": [ "1f1f2-1f1fe" ],
            ":mv:": [ "1f1f2-1f1fb" ],
            ":ml:": [ "1f1f2-1f1f1" ],
            ":mt:": [ "1f1f2-1f1f9" ],
            ":mh:": [ "1f1f2-1f1ed" ],
            ":mr:": [ "1f1f2-1f1f7" ],
            ":mu:": [ "1f1f2-1f1fa" ],
            ":mx:": [ "1f1f2-1f1fd" ],
            ":fm:": [ "1f1eb-1f1f2" ],
            ":md:": [ "1f1f2-1f1e9" ],
            ":mc:": [ "1f1f2-1f1e8" ],
            ":mn:": [ "1f1f2-1f1f3" ],
            ":me:": [ "1f1f2-1f1ea" ],
            ":ma:": [ "1f1f2-1f1e6" ],
            ":mz:": [ "1f1f2-1f1ff" ],
            ":mm:": [ "1f1f2-1f1f2" ],
            ":na:": [ "1f1f3-1f1e6" ],
            ":nr:": [ "1f1f3-1f1f7" ],
            ":np:": [ "1f1f3-1f1f5" ],
            ":nl:": [ "1f1f3-1f1f1" ],
            ":nz:": [ "1f1f3-1f1ff" ],
            ":ni:": [ "1f1f3-1f1ee" ],
            ":ne:": [ "1f1f3-1f1ea" ],
            ":nigeria:": [ "1f1f3-1f1ec" ],
            ":kp:": [ "1f1f0-1f1f5" ],
            ":no:": [ "1f1f3-1f1f4" ],
            ":om:": [ "1f1f4-1f1f2" ],
            ":pk:": [ "1f1f5-1f1f0" ],
            ":pw:": [ "1f1f5-1f1fc" ],
            ":pa:": [ "1f1f5-1f1e6" ],
            ":pg:": [ "1f1f5-1f1ec" ],
            ":py:": [ "1f1f5-1f1fe" ],
            ":pe:": [ "1f1f5-1f1ea" ],
            ":ph:": [ "1f1f5-1f1ed" ],
            ":pl:": [ "1f1f5-1f1f1" ],
            ":pt:": [ "1f1f5-1f1f9" ],
            ":qa:": [ "1f1f6-1f1e6" ],
            ":tw:": [ "1f1f9-1f1fc" ],
            ":cg:": [ "1f1e8-1f1ec" ],
            ":ro:": [ "1f1f7-1f1f4" ],
            ":rw:": [ "1f1f7-1f1fc" ],
            ":kn:": [ "1f1f0-1f1f3" ],
            ":lc:": [ "1f1f1-1f1e8" ],
            ":vc:": [ "1f1fb-1f1e8" ],
            ":ws:": [ "1f1fc-1f1f8" ],
            ":sm:": [ "1f1f8-1f1f2" ],
            ":st:": [ "1f1f8-1f1f9" ],
            ":saudiarabia:": [ "1f1f8-1f1e6" ],
            ":saudi:": [ "1f1f8-1f1e6" ],
            ":sn:": [ "1f1f8-1f1f3" ],
            ":rs:": [ "1f1f7-1f1f8" ],
            ":sc:": [ "1f1f8-1f1e8" ],
            ":sl:": [ "1f1f8-1f1f1" ],
            ":sg:": [ "1f1f8-1f1ec" ],
            ":sk:": [ "1f1f8-1f1f0" ],
            ":si:": [ "1f1f8-1f1ee" ],
            ":sb:": [ "1f1f8-1f1e7" ],
            ":so:": [ "1f1f8-1f1f4" ],
            ":za:": [ "1f1ff-1f1e6" ],
            ":lk:": [ "1f1f1-1f1f0" ],
            ":sd:": [ "1f1f8-1f1e9" ],
            ":sr:": [ "1f1f8-1f1f7" ],
            ":sz:": [ "1f1f8-1f1ff" ],
            ":se:": [ "1f1f8-1f1ea" ],
            ":ch:": [ "1f1e8-1f1ed" ],
            ":sy:": [ "1f1f8-1f1fe" ],
            ":tj:": [ "1f1f9-1f1ef" ],
            ":tz:": [ "1f1f9-1f1ff" ],
            ":th:": [ "1f1f9-1f1ed" ],
            ":tg:": [ "1f1f9-1f1ec" ],
            ":to:": [ "1f1f9-1f1f4" ],
            ":tt:": [ "1f1f9-1f1f9" ],
            ":tn:": [ "1f1f9-1f1f3" ],
            ":tr:": [ "1f1f9-1f1f7" ],
            ":turkmenistan:": [ "1f1f9-1f1f2" ],
            ":tuvalu:": [ "1f1f9-1f1fb" ],
            ":ug:": [ "1f1fa-1f1ec" ],
            ":ua:": [ "1f1fa-1f1e6" ],
            ":ae:": [ "1f1e6-1f1ea" ],
            ":uy:": [ "1f1fa-1f1fe" ],
            ":uz:": [ "1f1fa-1f1ff" ],
            ":vu:": [ "1f1fb-1f1fa" ],
            ":va:": [ "1f1fb-1f1e6" ],
            ":ve:": [ "1f1fb-1f1ea" ],
            ":vn:": [ "1f1fb-1f1f3" ],
            ":eh:": [ "1f1ea-1f1ed" ],
            ":ye:": [ "1f1fe-1f1ea" ],
            ":zm:": [ "1f1ff-1f1f2" ],
            ":zw:": [ "1f1ff-1f1fc" ],
            ":pr:": [ "1f1f5-1f1f7" ],
            ":ky:": [ "1f1f0-1f1fe" ],
            ":bm:": [ "1f1e7-1f1f2" ],
            ":pf:": [ "1f1f5-1f1eb" ],
            ":ps:": [ "1f1f5-1f1f8" ],
            ":nc:": [ "1f1f3-1f1e8" ],
            ":sh:": [ "1f1f8-1f1ed" ],
            ":aw:": [ "1f1e6-1f1fc" ],
            ":vi:": [ "1f1fb-1f1ee" ],
            ":hk:": [ "1f1ed-1f1f0" ],
            ":ac:": [ "1f1e6-1f1e8" ],
            ":ms:": [ "1f1f2-1f1f8" ],
            ":gu:": [ "1f1ec-1f1fa" ],
            ":gl:": [ "1f1ec-1f1f1" ],
            ":nu:": [ "1f1f3-1f1fa" ],
            ":wf:": [ "1f1fc-1f1eb" ],
            ":mo:": [ "1f1f2-1f1f4" ],
            ":fo:": [ "1f1eb-1f1f4" ],
            ":fk:": [ "1f1eb-1f1f0" ],
            ":je:": [ "1f1ef-1f1ea" ],
            ":ai:": [ "1f1e6-1f1ee" ],
            ":gi:": [ "1f1ec-1f1ee" ]
        };
        ns.asciiList = {
            "<3": "2764",
            "</3": "1f494",
            ":')": "1f602",
            ":'-)": "1f602",
            ":D": "1f603",
            ":-D": "1f603",
            "=D": "1f603",
            ":)": "1f604",
            ":-)": "1f604",
            "=]": "1f604",
            "=)": "1f604",
            ":]": "1f604",
            "':)": "1f605",
            "':-)": "1f605",
            "'=)": "1f605",
            "':D": "1f605",
            "':-D": "1f605",
            "'=D": "1f605",
            ">:)": "1f606",
            ">;)": "1f606",
            ">:-)": "1f606",
            ">=)": "1f606",
            ";)": "1f609",
            ";-)": "1f609",
            "*-)": "1f609",
            "*)": "1f609",
            ";-]": "1f609",
            ";]": "1f609",
            ";D": "1f609",
            ";^)": "1f609",
            "':(": "1f613",
            "':-(": "1f613",
            "'=(": "1f613",
            ":*": "1f618",
            ":-*": "1f618",
            "=*": "1f618",
            ":^*": "1f618",
            ">:P": "1f61c",
            "X-P": "1f61c",
            "x-p": "1f61c",
            ">:[": "1f61e",
            ":-(": "1f61e",
            ":(": "1f61e",
            ":-[": "1f61e",
            ":[": "1f61e",
            "=(": "1f61e",
            ">:(": "1f620",
            ">:-(": "1f620",
            ":@": "1f620",
            ":'(": "1f622",
            ":'-(": "1f622",
            ";(": "1f622",
            ";-(": "1f622",
            ">.<": "1f623",
            ":$": "1f633",
            "=$": "1f633",
            "#-)": "1f635",
            "#)": "1f635",
            "%-)": "1f635",
            "%)": "1f635",
            "X)": "1f635",
            "X-)": "1f635",
            "*\\0/*": "1f646",
            "\\0/": "1f646",
            "*\\O/*": "1f646",
            "\\O/": "1f646",
            "O:-)": "1f607",
            "0:-3": "1f607",
            "0:3": "1f607",
            "0:-)": "1f607",
            "0:)": "1f607",
            "0;^)": "1f607",
            "O:)": "1f607",
            "O;-)": "1f607",
            "O=)": "1f607",
            "0;-)": "1f607",
            "O:-3": "1f607",
            "O:3": "1f607",
            "B-)": "1f60e",
            "B)": "1f60e",
            "8)": "1f60e",
            "8-)": "1f60e",
            "B-D": "1f60e",
            "8-D": "1f60e",
            "-_-": "1f611",
            "-__-": "1f611",
            "-___-": "1f611",
            ">:\\": "1f615",
            ">:/": "1f615",
            ":-/": "1f615",
            ":-.": "1f615",
            ":/": "1f615",
            ":\\": "1f615",
            "=/": "1f615",
            "=\\": "1f615",
            ":L": "1f615",
            "=L": "1f615",
            ":P": "1f61b",
            ":-P": "1f61b",
            "=P": "1f61b",
            ":-p": "1f61b",
            ":p": "1f61b",
            "=p": "1f61b",
            ":-Þ": "1f61b",
            ":Þ": "1f61b",
            ":þ": "1f61b",
            ":-þ": "1f61b",
            ":-b": "1f61b",
            ":b": "1f61b",
            "d:": "1f61b",
            ":-O": "1f62e",
            ":O": "1f62e",
            ":-o": "1f62e",
            ":o": "1f62e",
            O_O: "1f62e",
            ">:O": "1f62e",
            ":-X": "1f636",
            ":X": "1f636",
            ":-#": "1f636",
            ":#": "1f636",
            "=X": "1f636",
            "=x": "1f636",
            ":x": "1f636",
            ":-x": "1f636",
            "=#": "1f636"
        };
        ns.asciiRegexp = "(\\<3|&lt;3|\\<\\/3|&lt;\\/3|\\:'\\)|\\:'\\-\\)|\\:D|\\:\\-D|\\=D|\\:\\)|\\:\\-\\)|\\=\\]|\\=\\)|\\:\\]|'\\:\\)|'\\:\\-\\)|'\\=\\)|'\\:D|'\\:\\-D|'\\=D|\\>\\:\\)|&gt;\\:\\)|\\>;\\)|&gt;;\\)|\\>\\:\\-\\)|&gt;\\:\\-\\)|\\>\\=\\)|&gt;\\=\\)|;\\)|;\\-\\)|\\*\\-\\)|\\*\\)|;\\-\\]|;\\]|;D|;\\^\\)|'\\:\\(|'\\:\\-\\(|'\\=\\(|\\:\\*|\\:\\-\\*|\\=\\*|\\:\\^\\*|\\>\\:P|&gt;\\:P|X\\-P|x\\-p|\\>\\:\\[|&gt;\\:\\[|\\:\\-\\(|\\:\\(|\\:\\-\\[|\\:\\[|\\=\\(|\\>\\:\\(|&gt;\\:\\(|\\>\\:\\-\\(|&gt;\\:\\-\\(|\\:@|\\:'\\(|\\:'\\-\\(|;\\(|;\\-\\(|\\>\\.\\<|&gt;\\.&lt;|\\:\\$|\\=\\$|#\\-\\)|#\\)|%\\-\\)|%\\)|X\\)|X\\-\\)|\\*\\\\0\\/\\*|\\\\0\\/|\\*\\\\O\\/\\*|\\\\O\\/|O\\:\\-\\)|0\\:\\-3|0\\:3|0\\:\\-\\)|0\\:\\)|0;\\^\\)|O\\:\\-\\)|O\\:\\)|O;\\-\\)|O\\=\\)|0;\\-\\)|O\\:\\-3|O\\:3|B\\-\\)|B\\)|8\\)|8\\-\\)|B\\-D|8\\-D|\\-_\\-|\\-__\\-|\\-___\\-|\\>\\:\\\\|&gt;\\:\\\\|\\>\\:\\/|&gt;\\:\\/|\\:\\-\\/|\\:\\-\\.|\\:\\/|\\:\\\\|\\=\\/|\\=\\\\|\\:L|\\=L|\\:P|\\:\\-P|\\=P|\\:\\-p|\\:p|\\=p|\\:\\-Þ|\\:\\-&THORN;|\\:Þ|\\:&THORN;|\\:þ|\\:&thorn;|\\:\\-þ|\\:\\-&thorn;|\\:\\-b|\\:b|d\\:|\\:\\-O|\\:O|\\:\\-o|\\:o|O_O|\\>\\:O|&gt;\\:O|\\:\\-X|\\:X|\\:\\-#|\\:#|\\=X|\\=x|\\:x|\\:\\-x|\\=#)";
        ns.unicodeRegexp = "(#\\uFE0F\\u20E3|#\\u20E3|0\\uFE0F\\u20E3|0\\u20E3|1\\uFE0F\\u20E3|1\\u20E3|2\\uFE0F\\u20E3|2\\u20E3|3\\uFE0F\\u20E3|3\\u20E3|4\\uFE0F\\u20E3|4\\u20E3|5\\uFE0F\\u20E3|5\\u20E3|6\\uFE0F\\u20E3|6\\u20E3|7\\uFE0F\\u20E3|7\\u20E3|8\\uFE0F\\u20E3|8\\u20E3|9\\uFE0F\\u20E3|9\\u20E3|\\u00A9|\\u00AE|\\u203C\\uFE0F|\\u203C|\\u2049\\uFE0F|\\u2049|\\u2122|\\u2139\\uFE0F|\\u2139|\\u2194\\uFE0F|\\u2194|\\u2195\\uFE0F|\\u2195|\\u2196\\uFE0F|\\u2196|\\u2197\\uFE0F|\\u2197|\\u2198\\uFE0F|\\u2198|\\u2199\\uFE0F|\\u2199|\\u21A9\\uFE0F|\\u21A9|\\u21AA\\uFE0F|\\u21AA|\\u231A\\uFE0F|\\u231A|\\u231B\\uFE0F|\\u231B|\\u23E9|\\u23EA|\\u23EB|\\u23EC|\\u23F0|\\u23F3|\\u24C2\\uFE0F|\\u24C2|\\u25AA\\uFE0F|\\u25AA|\\u25AB\\uFE0F|\\u25AB|\\u25B6\\uFE0F|\\u25B6|\\u25C0\\uFE0F|\\u25C0|\\u25FB\\uFE0F|\\u25FB|\\u25FC\\uFE0F|\\u25FC|\\u25FD\\uFE0F|\\u25FD|\\u25FE\\uFE0F|\\u25FE|\\u2600\\uFE0F|\\u2600|\\u2601\\uFE0F|\\u2601|\\u260E\\uFE0F|\\u260E|\\u2611\\uFE0F|\\u2611|\\u2614\\uFE0F|\\u2614|\\u2615\\uFE0F|\\u2615|\\u261D\\uFE0F|\\u261D|\\u263A\\uFE0F|\\u263A|\\u2648\\uFE0F|\\u2648|\\u2649\\uFE0F|\\u2649|\\u264A\\uFE0F|\\u264A|\\u264B\\uFE0F|\\u264B|\\u264C\\uFE0F|\\u264C|\\u264D\\uFE0F|\\u264D|\\u264E\\uFE0F|\\u264E|\\u264F\\uFE0F|\\u264F|\\u2650\\uFE0F|\\u2650|\\u2651\\uFE0F|\\u2651|\\u2652\\uFE0F|\\u2652|\\u2653\\uFE0F|\\u2653|\\u2660\\uFE0F|\\u2660|\\u2663\\uFE0F|\\u2663|\\u2665\\uFE0F|\\u2665|\\u2666\\uFE0F|\\u2666|\\u2668\\uFE0F|\\u2668|\\u267B\\uFE0F|\\u267B|\\u267F\\uFE0F|\\u267F|\\u2693\\uFE0F|\\u2693|\\u26A0\\uFE0F|\\u26A0|\\u26A1\\uFE0F|\\u26A1|\\u26AA\\uFE0F|\\u26AA|\\u26AB\\uFE0F|\\u26AB|\\u26BD\\uFE0F|\\u26BD|\\u26BE\\uFE0F|\\u26BE|\\u26C4\\uFE0F|\\u26C4|\\u26C5\\uFE0F|\\u26C5|\\u26CE|\\u26D4\\uFE0F|\\u26D4|\\u26EA\\uFE0F|\\u26EA|\\u26F2\\uFE0F|\\u26F2|\\u26F3\\uFE0F|\\u26F3|\\u26F5\\uFE0F|\\u26F5|\\u26FA\\uFE0F|\\u26FA|\\u26FD\\uFE0F|\\u26FD|\\u2702\\uFE0F|\\u2702|\\u2705|\\u2708\\uFE0F|\\u2708|\\u2709\\uFE0F|\\u2709|\\u270A|\\u270B|\\u270C\\uFE0F|\\u270C|\\u270F\\uFE0F|\\u270F|\\u2712\\uFE0F|\\u2712|\\u2714\\uFE0F|\\u2714|\\u2716\\uFE0F|\\u2716|\\u2728|\\u2733\\uFE0F|\\u2733|\\u2734\\uFE0F|\\u2734|\\u2744\\uFE0F|\\u2744|\\u2747\\uFE0F|\\u2747|\\u274C|\\u274E|\\u2753|\\u2754|\\u2755|\\u2757\\uFE0F|\\u2757|\\u2764\\uFE0F|\\u2764|\\u2795|\\u2796|\\u2797|\\u27A1\\uFE0F|\\u27A1|\\u27B0|\\u2934\\uFE0F|\\u2934|\\u2935\\uFE0F|\\u2935|\\u2B05\\uFE0F|\\u2B05|\\u2B06\\uFE0F|\\u2B06|\\u2B07\\uFE0F|\\u2B07|\\u2B1B\\uFE0F|\\u2B1B|\\u2B1C\\uFE0F|\\u2B1C|\\u2B50\\uFE0F|\\u2B50|\\u2B55\\uFE0F|\\u2B55|\\u3030|\\u303D\\uFE0F|\\u303D|\\u3297\\uFE0F|\\u3297|\\u3299\\uFE0F|\\u3299|\\uD83C\\uDC04\\uFE0F|\\uD83C\\uDC04|\\uD83C\\uDCCF|\\uD83C\\uDD70|\\uD83C\\uDD71|\\uD83C\\uDD7E|\\uD83C\\uDD7F\\uFE0F|\\uD83C\\uDD7F|\\uD83C\\uDD8E|\\uD83C\\uDD91|\\uD83C\\uDD92|\\uD83C\\uDD93|\\uD83C\\uDD94|\\uD83C\\uDD95|\\uD83C\\uDD96|\\uD83C\\uDD97|\\uD83C\\uDD98|\\uD83C\\uDD99|\\uD83C\\uDD9A|\\uD83C\\uDDE8\\uD83C\\uDDF3|\\uD83C\\uDDE9\\uD83C\\uDDEA|\\uD83C\\uDDEA\\uD83C\\uDDF8|\\uD83C\\uDDEB\\uD83C\\uDDF7|\\uD83C\\uDDEC\\uD83C\\uDDE7|\\uD83C\\uDDEE\\uD83C\\uDDF9|\\uD83C\\uDDEF\\uD83C\\uDDF5|\\uD83C\\uDDF0\\uD83C\\uDDF7|\\uD83C\\uDDFA\\uD83C\\uDDF8|\\uD83C\\uDDF7\\uD83C\\uDDFA|\\uD83C\\uDE01|\\uD83C\\uDE02|\\uD83C\\uDE1A\\uFE0F|\\uD83C\\uDE1A|\\uD83C\\uDE2F\\uFE0F|\\uD83C\\uDE2F|\\uD83C\\uDE32|\\uD83C\\uDE33|\\uD83C\\uDE34|\\uD83C\\uDE35|\\uD83C\\uDE36|\\uD83C\\uDE37|\\uD83C\\uDE38|\\uD83C\\uDE39|\\uD83C\\uDE3A|\\uD83C\\uDE50|\\uD83C\\uDE51|\\uD83C\\uDF00|\\uD83C\\uDF01|\\uD83C\\uDF02|\\uD83C\\uDF03|\\uD83C\\uDF04|\\uD83C\\uDF05|\\uD83C\\uDF06|\\uD83C\\uDF07|\\uD83C\\uDF08|\\uD83C\\uDF09|\\uD83C\\uDF0A|\\uD83C\\uDF0B|\\uD83C\\uDF0C|\\uD83C\\uDF0F|\\uD83C\\uDF11|\\uD83C\\uDF13|\\uD83C\\uDF14|\\uD83C\\uDF15|\\uD83C\\uDF19|\\uD83C\\uDF1B|\\uD83C\\uDF1F|\\uD83C\\uDF20|\\uD83C\\uDF30|\\uD83C\\uDF31|\\uD83C\\uDF34|\\uD83C\\uDF35|\\uD83C\\uDF37|\\uD83C\\uDF38|\\uD83C\\uDF39|\\uD83C\\uDF3A|\\uD83C\\uDF3B|\\uD83C\\uDF3C|\\uD83C\\uDF3D|\\uD83C\\uDF3E|\\uD83C\\uDF3F|\\uD83C\\uDF40|\\uD83C\\uDF41|\\uD83C\\uDF42|\\uD83C\\uDF43|\\uD83C\\uDF44|\\uD83C\\uDF45|\\uD83C\\uDF46|\\uD83C\\uDF47|\\uD83C\\uDF48|\\uD83C\\uDF49|\\uD83C\\uDF4A|\\uD83C\\uDF4C|\\uD83C\\uDF4D|\\uD83C\\uDF4E|\\uD83C\\uDF4F|\\uD83C\\uDF51|\\uD83C\\uDF52|\\uD83C\\uDF53|\\uD83C\\uDF54|\\uD83C\\uDF55|\\uD83C\\uDF56|\\uD83C\\uDF57|\\uD83C\\uDF58|\\uD83C\\uDF59|\\uD83C\\uDF5A|\\uD83C\\uDF5B|\\uD83C\\uDF5C|\\uD83C\\uDF5D|\\uD83C\\uDF5E|\\uD83C\\uDF5F|\\uD83C\\uDF60|\\uD83C\\uDF61|\\uD83C\\uDF62|\\uD83C\\uDF63|\\uD83C\\uDF64|\\uD83C\\uDF65|\\uD83C\\uDF66|\\uD83C\\uDF67|\\uD83C\\uDF68|\\uD83C\\uDF69|\\uD83C\\uDF6A|\\uD83C\\uDF6B|\\uD83C\\uDF6C|\\uD83C\\uDF6D|\\uD83C\\uDF6E|\\uD83C\\uDF6F|\\uD83C\\uDF70|\\uD83C\\uDF71|\\uD83C\\uDF72|\\uD83C\\uDF73|\\uD83C\\uDF74|\\uD83C\\uDF75|\\uD83C\\uDF76|\\uD83C\\uDF77|\\uD83C\\uDF78|\\uD83C\\uDF79|\\uD83C\\uDF7A|\\uD83C\\uDF7B|\\uD83C\\uDF80|\\uD83C\\uDF81|\\uD83C\\uDF82|\\uD83C\\uDF83|\\uD83C\\uDF84|\\uD83C\\uDF85|\\uD83C\\uDF86|\\uD83C\\uDF87|\\uD83C\\uDF88|\\uD83C\\uDF89|\\uD83C\\uDF8A|\\uD83C\\uDF8B|\\uD83C\\uDF8C|\\uD83C\\uDF8D|\\uD83C\\uDF8E|\\uD83C\\uDF8F|\\uD83C\\uDF90|\\uD83C\\uDF91|\\uD83C\\uDF92|\\uD83C\\uDF93|\\uD83C\\uDFA0|\\uD83C\\uDFA1|\\uD83C\\uDFA2|\\uD83C\\uDFA3|\\uD83C\\uDFA4|\\uD83C\\uDFA5|\\uD83C\\uDFA6|\\uD83C\\uDFA7|\\uD83C\\uDFA8|\\uD83C\\uDFA9|\\uD83C\\uDFAA|\\uD83C\\uDFAB|\\uD83C\\uDFAC|\\uD83C\\uDFAD|\\uD83C\\uDFAE|\\uD83C\\uDFAF|\\uD83C\\uDFB0|\\uD83C\\uDFB1|\\uD83C\\uDFB2|\\uD83C\\uDFB3|\\uD83C\\uDFB4|\\uD83C\\uDFB5|\\uD83C\\uDFB6|\\uD83C\\uDFB7|\\uD83C\\uDFB8|\\uD83C\\uDFB9|\\uD83C\\uDFBA|\\uD83C\\uDFBB|\\uD83C\\uDFBC|\\uD83C\\uDFBD|\\uD83C\\uDFBE|\\uD83C\\uDFBF|\\uD83C\\uDFC0|\\uD83C\\uDFC1|\\uD83C\\uDFC2|\\uD83C\\uDFC3|\\uD83C\\uDFC4|\\uD83C\\uDFC6|\\uD83C\\uDFC8|\\uD83C\\uDFCA|\\uD83C\\uDFE0|\\uD83C\\uDFE1|\\uD83C\\uDFE2|\\uD83C\\uDFE3|\\uD83C\\uDFE5|\\uD83C\\uDFE6|\\uD83C\\uDFE7|\\uD83C\\uDFE8|\\uD83C\\uDFE9|\\uD83C\\uDFEA|\\uD83C\\uDFEB|\\uD83C\\uDFEC|\\uD83C\\uDFED|\\uD83C\\uDFEE|\\uD83C\\uDFEF|\\uD83C\\uDFF0|\\uD83D\\uDC0C|\\uD83D\\uDC0D|\\uD83D\\uDC0E|\\uD83D\\uDC11|\\uD83D\\uDC12|\\uD83D\\uDC14|\\uD83D\\uDC17|\\uD83D\\uDC18|\\uD83D\\uDC19|\\uD83D\\uDC1A|\\uD83D\\uDC1B|\\uD83D\\uDC1C|\\uD83D\\uDC1D|\\uD83D\\uDC1E|\\uD83D\\uDC1F|\\uD83D\\uDC20|\\uD83D\\uDC21|\\uD83D\\uDC22|\\uD83D\\uDC23|\\uD83D\\uDC24|\\uD83D\\uDC25|\\uD83D\\uDC26|\\uD83D\\uDC27|\\uD83D\\uDC28|\\uD83D\\uDC29|\\uD83D\\uDC2B|\\uD83D\\uDC2C|\\uD83D\\uDC2D|\\uD83D\\uDC2E|\\uD83D\\uDC2F|\\uD83D\\uDC30|\\uD83D\\uDC31|\\uD83D\\uDC32|\\uD83D\\uDC33|\\uD83D\\uDC34|\\uD83D\\uDC35|\\uD83D\\uDC36|\\uD83D\\uDC37|\\uD83D\\uDC38|\\uD83D\\uDC39|\\uD83D\\uDC3A|\\uD83D\\uDC3B|\\uD83D\\uDC3C|\\uD83D\\uDC3D|\\uD83D\\uDC3E|\\uD83D\\uDC40|\\uD83D\\uDC42|\\uD83D\\uDC43|\\uD83D\\uDC44|\\uD83D\\uDC45|\\uD83D\\uDC46|\\uD83D\\uDC47|\\uD83D\\uDC48|\\uD83D\\uDC49|\\uD83D\\uDC4A|\\uD83D\\uDC4B|\\uD83D\\uDC4C|\\uD83D\\uDC4D|\\uD83D\\uDC4E|\\uD83D\\uDC4F|\\uD83D\\uDC50|\\uD83D\\uDC51|\\uD83D\\uDC52|\\uD83D\\uDC53|\\uD83D\\uDC54|\\uD83D\\uDC55|\\uD83D\\uDC56|\\uD83D\\uDC57|\\uD83D\\uDC58|\\uD83D\\uDC59|\\uD83D\\uDC5A|\\uD83D\\uDC5B|\\uD83D\\uDC5C|\\uD83D\\uDC5D|\\uD83D\\uDC5E|\\uD83D\\uDC5F|\\uD83D\\uDC60|\\uD83D\\uDC61|\\uD83D\\uDC62|\\uD83D\\uDC63|\\uD83D\\uDC64|\\uD83D\\uDC66|\\uD83D\\uDC67|\\uD83D\\uDC68|\\uD83D\\uDC69|\\uD83D\\uDC6A|\\uD83D\\uDC6B|\\uD83D\\uDC6E|\\uD83D\\uDC6F|\\uD83D\\uDC70|\\uD83D\\uDC71|\\uD83D\\uDC72|\\uD83D\\uDC73|\\uD83D\\uDC74|\\uD83D\\uDC75|\\uD83D\\uDC76|\\uD83D\\uDC77|\\uD83D\\uDC78|\\uD83D\\uDC79|\\uD83D\\uDC7A|\\uD83D\\uDC7B|\\uD83D\\uDC7C|\\uD83D\\uDC7D|\\uD83D\\uDC7E|\\uD83D\\uDC7F|\\uD83D\\uDC80|\\uD83D\\uDCC7|\\uD83D\\uDC81|\\uD83D\\uDC82|\\uD83D\\uDC83|\\uD83D\\uDC84|\\uD83D\\uDC85|\\uD83D\\uDCD2|\\uD83D\\uDC86|\\uD83D\\uDCD3|\\uD83D\\uDC87|\\uD83D\\uDCD4|\\uD83D\\uDC88|\\uD83D\\uDCD5|\\uD83D\\uDC89|\\uD83D\\uDCD6|\\uD83D\\uDC8A|\\uD83D\\uDCD7|\\uD83D\\uDC8B|\\uD83D\\uDCD8|\\uD83D\\uDC8C|\\uD83D\\uDCD9|\\uD83D\\uDC8D|\\uD83D\\uDCDA|\\uD83D\\uDC8E|\\uD83D\\uDCDB|\\uD83D\\uDC8F|\\uD83D\\uDCDC|\\uD83D\\uDC90|\\uD83D\\uDCDD|\\uD83D\\uDC91|\\uD83D\\uDCDE|\\uD83D\\uDC92|\\uD83D\\uDCDF|\\uD83D\\uDCE0|\\uD83D\\uDC93|\\uD83D\\uDCE1|\\uD83D\\uDCE2|\\uD83D\\uDC94|\\uD83D\\uDCE3|\\uD83D\\uDCE4|\\uD83D\\uDC95|\\uD83D\\uDCE5|\\uD83D\\uDCE6|\\uD83D\\uDC96|\\uD83D\\uDCE7|\\uD83D\\uDCE8|\\uD83D\\uDC97|\\uD83D\\uDCE9|\\uD83D\\uDCEA|\\uD83D\\uDC98|\\uD83D\\uDCEB|\\uD83D\\uDCEE|\\uD83D\\uDC99|\\uD83D\\uDCF0|\\uD83D\\uDCF1|\\uD83D\\uDC9A|\\uD83D\\uDCF2|\\uD83D\\uDCF3|\\uD83D\\uDC9B|\\uD83D\\uDCF4|\\uD83D\\uDCF6|\\uD83D\\uDC9C|\\uD83D\\uDCF7|\\uD83D\\uDCF9|\\uD83D\\uDC9D|\\uD83D\\uDCFA|\\uD83D\\uDCFB|\\uD83D\\uDC9E|\\uD83D\\uDCFC|\\uD83D\\uDD03|\\uD83D\\uDC9F|\\uD83D\\uDD0A|\\uD83D\\uDD0B|\\uD83D\\uDCA0|\\uD83D\\uDD0C|\\uD83D\\uDD0D|\\uD83D\\uDCA1|\\uD83D\\uDD0E|\\uD83D\\uDD0F|\\uD83D\\uDCA2|\\uD83D\\uDD10|\\uD83D\\uDD11|\\uD83D\\uDCA3|\\uD83D\\uDD12|\\uD83D\\uDD13|\\uD83D\\uDCA4|\\uD83D\\uDD14|\\uD83D\\uDD16|\\uD83D\\uDCA5|\\uD83D\\uDD17|\\uD83D\\uDD18|\\uD83D\\uDCA6|\\uD83D\\uDD19|\\uD83D\\uDD1A|\\uD83D\\uDCA7|\\uD83D\\uDD1B|\\uD83D\\uDD1C|\\uD83D\\uDCA8|\\uD83D\\uDD1D|\\uD83D\\uDD1E|\\uD83D\\uDCA9|\\uD83D\\uDD1F|\\uD83D\\uDCAA|\\uD83D\\uDD20|\\uD83D\\uDD21|\\uD83D\\uDCAB|\\uD83D\\uDD22|\\uD83D\\uDD23|\\uD83D\\uDCAC|\\uD83D\\uDD24|\\uD83D\\uDD25|\\uD83D\\uDCAE|\\uD83D\\uDD26|\\uD83D\\uDD27|\\uD83D\\uDCAF|\\uD83D\\uDD28|\\uD83D\\uDD29|\\uD83D\\uDCB0|\\uD83D\\uDD2A|\\uD83D\\uDD2B|\\uD83D\\uDCB1|\\uD83D\\uDD2E|\\uD83D\\uDCB2|\\uD83D\\uDD2F|\\uD83D\\uDCB3|\\uD83D\\uDD30|\\uD83D\\uDD31|\\uD83D\\uDCB4|\\uD83D\\uDD32|\\uD83D\\uDD33|\\uD83D\\uDCB5|\\uD83D\\uDD34|\\uD83D\\uDD35|\\uD83D\\uDCB8|\\uD83D\\uDD36|\\uD83D\\uDD37|\\uD83D\\uDCB9|\\uD83D\\uDD38|\\uD83D\\uDD39|\\uD83D\\uDCBA|\\uD83D\\uDD3A|\\uD83D\\uDD3B|\\uD83D\\uDCBB|\\uD83D\\uDD3C|\\uD83D\\uDCBC|\\uD83D\\uDD3D|\\uD83D\\uDD50|\\uD83D\\uDCBD|\\uD83D\\uDD51|\\uD83D\\uDCBE|\\uD83D\\uDD52|\\uD83D\\uDCBF|\\uD83D\\uDD53|\\uD83D\\uDCC0|\\uD83D\\uDD54|\\uD83D\\uDD55|\\uD83D\\uDCC1|\\uD83D\\uDD56|\\uD83D\\uDD57|\\uD83D\\uDCC2|\\uD83D\\uDD58|\\uD83D\\uDD59|\\uD83D\\uDCC3|\\uD83D\\uDD5A|\\uD83D\\uDD5B|\\uD83D\\uDCC4|\\uD83D\\uDDFB|\\uD83D\\uDDFC|\\uD83D\\uDCC5|\\uD83D\\uDDFD|\\uD83D\\uDDFE|\\uD83D\\uDCC6|\\uD83D\\uDDFF|\\uD83D\\uDE01|\\uD83D\\uDE02|\\uD83D\\uDE03|\\uD83D\\uDCC8|\\uD83D\\uDE04|\\uD83D\\uDE05|\\uD83D\\uDCC9|\\uD83D\\uDE06|\\uD83D\\uDE09|\\uD83D\\uDCCA|\\uD83D\\uDE0A|\\uD83D\\uDE0B|\\uD83D\\uDCCB|\\uD83D\\uDE0C|\\uD83D\\uDE0D|\\uD83D\\uDCCC|\\uD83D\\uDE0F|\\uD83D\\uDE12|\\uD83D\\uDCCD|\\uD83D\\uDE13|\\uD83D\\uDE14|\\uD83D\\uDCCE|\\uD83D\\uDE16|\\uD83D\\uDE18|\\uD83D\\uDCCF|\\uD83D\\uDE1A|\\uD83D\\uDE1C|\\uD83D\\uDCD0|\\uD83D\\uDE1D|\\uD83D\\uDE1E|\\uD83D\\uDCD1|\\uD83D\\uDE20|\\uD83D\\uDE21|\\uD83D\\uDE22|\\uD83D\\uDE23|\\uD83D\\uDE24|\\uD83D\\uDE25|\\uD83D\\uDE28|\\uD83D\\uDE29|\\uD83D\\uDE2A|\\uD83D\\uDE2B|\\uD83D\\uDE2D|\\uD83D\\uDE30|\\uD83D\\uDE31|\\uD83D\\uDE32|\\uD83D\\uDE33|\\uD83D\\uDE35|\\uD83D\\uDE37|\\uD83D\\uDE38|\\uD83D\\uDE39|\\uD83D\\uDE3A|\\uD83D\\uDE3B|\\uD83D\\uDE3C|\\uD83D\\uDE3D|\\uD83D\\uDE3E|\\uD83D\\uDE3F|\\uD83D\\uDE40|\\uD83D\\uDE45|\\uD83D\\uDE46|\\uD83D\\uDE47|\\uD83D\\uDE48|\\uD83D\\uDE49|\\uD83D\\uDE4A|\\uD83D\\uDE4B|\\uD83D\\uDE4C|\\uD83D\\uDE4D|\\uD83D\\uDE4E|\\uD83D\\uDE4F|\\uD83D\\uDE80|\\uD83D\\uDE83|\\uD83D\\uDE84|\\uD83D\\uDE85|\\uD83D\\uDE87|\\uD83D\\uDE89|\\uD83D\\uDE8C|\\uD83D\\uDE8F|\\uD83D\\uDE91|\\uD83D\\uDE92|\\uD83D\\uDE93|\\uD83D\\uDE95|\\uD83D\\uDE97|\\uD83D\\uDE99|\\uD83D\\uDE9A|\\uD83D\\uDEA2|\\uD83D\\uDEA4|\\uD83D\\uDEA5|\\uD83D\\uDEA7|\\uD83D\\uDEA8|\\uD83D\\uDEA9|\\uD83D\\uDEAA|\\uD83D\\uDEAB|\\uD83D\\uDEAC|\\uD83D\\uDEAD|\\uD83D\\uDEB2|\\uD83D\\uDEB6|\\uD83D\\uDEB9|\\uD83D\\uDEBA|\\uD83D\\uDEBB|\\uD83D\\uDEBC|\\uD83D\\uDEBD|\\uD83D\\uDEBE|\\uD83D\\uDEC0|\\uD83D\\uDE00|\\uD83D\\uDE07|\\uD83D\\uDE08|\\uD83D\\uDE0E|\\uD83D\\uDE10|\\uD83D\\uDE11|\\uD83D\\uDE15|\\uD83D\\uDE17|\\uD83D\\uDE19|\\uD83D\\uDE1B|\\uD83D\\uDE1F|\\uD83D\\uDE26|\\uD83D\\uDE27|\\uD83D\\uDE2C|\\uD83D\\uDE2E|\\uD83D\\uDE2F|\\uD83D\\uDE34|\\uD83D\\uDE36|\\uD83D\\uDE81|\\uD83D\\uDE82|\\uD83D\\uDE86|\\uD83D\\uDE88|\\uD83D\\uDE8A|\\uD83D\\uDE8D|\\uD83D\\uDE8E|\\uD83D\\uDE90|\\uD83D\\uDE94|\\uD83D\\uDE96|\\uD83D\\uDE98|\\uD83D\\uDE9B|\\uD83D\\uDE9C|\\uD83D\\uDE9D|\\uD83D\\uDE9E|\\uD83D\\uDE9F|\\uD83D\\uDEA0|\\uD83D\\uDEA1|\\uD83D\\uDEA3|\\uD83D\\uDEA6|\\uD83D\\uDEAE|\\uD83D\\uDEAF|\\uD83D\\uDEB0|\\uD83D\\uDEB1|\\uD83D\\uDEB3|\\uD83D\\uDEB4|\\uD83D\\uDEB5|\\uD83D\\uDEB7|\\uD83D\\uDEB8|\\uD83D\\uDEBF|\\uD83D\\uDEC1|\\uD83D\\uDEC2|\\uD83D\\uDEC3|\\uD83D\\uDEC4|\\uD83D\\uDEC5|\\uD83C\\uDF0D|\\uD83C\\uDF0E|\\uD83C\\uDF10|\\uD83C\\uDF12|\\uD83C\\uDF16|\\uD83C\\uDF17|\\uD83C\\uDF18|\\uD83C\\uDF1A|\\uD83C\\uDF1C|\\uD83C\\uDF1D|\\uD83C\\uDF1E|\\uD83C\\uDF32|\\uD83C\\uDF33|\\uD83C\\uDF4B|\\uD83C\\uDF50|\\uD83C\\uDF7C|\\uD83C\\uDFC7|\\uD83C\\uDFC9|\\uD83C\\uDFE4|\\uD83D\\uDC00|\\uD83D\\uDC01|\\uD83D\\uDC02|\\uD83D\\uDC03|\\uD83D\\uDC04|\\uD83D\\uDC05|\\uD83D\\uDC06|\\uD83D\\uDC07|\\uD83D\\uDC08|\\uD83D\\uDC09|\\uD83D\\uDC0A|\\uD83D\\uDC0B|\\uD83D\\uDC0F|\\uD83D\\uDC10|\\uD83D\\uDC13|\\uD83D\\uDC15|\\uD83D\\uDC16|\\uD83D\\uDC2A|\\uD83D\\uDC65|\\uD83D\\uDC6C|\\uD83D\\uDC6D|\\uD83D\\uDCAD|\\uD83D\\uDCB6|\\uD83D\\uDCB7|\\uD83D\\uDCEC|\\uD83D\\uDCED|\\uD83D\\uDCEF|\\uD83D\\uDCF5|\\uD83D\\uDD00|\\uD83D\\uDD01|\\uD83D\\uDD02|\\uD83D\\uDD04|\\uD83D\\uDD05|\\uD83D\\uDD06|\\uD83D\\uDD07|\\uD83D\\uDD09|\\uD83D\\uDD15|\\uD83D\\uDD2C|\\uD83D\\uDD2D|\\uD83D\\uDD5C|\\uD83D\\uDD5D|\\uD83D\\uDD5E|\\uD83D\\uDD5F|\\uD83D\\uDD60|\\uD83D\\uDD61|\\uD83D\\uDD62|\\uD83D\\uDD63|\\uD83D\\uDD64|\\uD83D\\uDD65|\\uD83D\\uDD66|\\uD83D\\uDD67|\\uD83D\\uDD08|\\uD83D\\uDE8B|\\u27BF|\\uD83C\\uDDE6\\uD83C\\uDDEB|\\uD83C\\uDDE6\\uD83C\\uDDF1|\\uD83C\\uDDE9\\uD83C\\uDDFF|\\uD83C\\uDDE6\\uD83C\\uDDE9|\\uD83C\\uDDE6\\uD83C\\uDDF4|\\uD83C\\uDDE6\\uD83C\\uDDEC|\\uD83C\\uDDE6\\uD83C\\uDDF7|\\uD83C\\uDDE6\\uD83C\\uDDF2|\\uD83C\\uDDE6\\uD83C\\uDDFA|\\uD83C\\uDDE6\\uD83C\\uDDF9|\\uD83C\\uDDE6\\uD83C\\uDDFF|\\uD83C\\uDDE7\\uD83C\\uDDF8|\\uD83C\\uDDE7\\uD83C\\uDDED|\\uD83C\\uDDE7\\uD83C\\uDDE9|\\uD83C\\uDDE7\\uD83C\\uDDE7|\\uD83C\\uDDE7\\uD83C\\uDDFE|\\uD83C\\uDDE7\\uD83C\\uDDEA|\\uD83C\\uDDE7\\uD83C\\uDDFF|\\uD83C\\uDDE7\\uD83C\\uDDEF|\\uD83C\\uDDE7\\uD83C\\uDDF9|\\uD83C\\uDDE7\\uD83C\\uDDF4|\\uD83C\\uDDE7\\uD83C\\uDDE6|\\uD83C\\uDDE7\\uD83C\\uDDFC|\\uD83C\\uDDE7\\uD83C\\uDDF7|\\uD83C\\uDDE7\\uD83C\\uDDF3|\\uD83C\\uDDE7\\uD83C\\uDDEC|\\uD83C\\uDDE7\\uD83C\\uDDEB|\\uD83C\\uDDE7\\uD83C\\uDDEE|\\uD83C\\uDDF0\\uD83C\\uDDED|\\uD83C\\uDDE8\\uD83C\\uDDF2|\\uD83C\\uDDE8\\uD83C\\uDDE6|\\uD83C\\uDDE8\\uD83C\\uDDFB|\\uD83C\\uDDE8\\uD83C\\uDDEB|\\uD83C\\uDDF9\\uD83C\\uDDE9|\\uD83C\\uDDE8\\uD83C\\uDDF1|\\uD83C\\uDDE8\\uD83C\\uDDF4|\\uD83C\\uDDF0\\uD83C\\uDDF2|\\uD83C\\uDDE8\\uD83C\\uDDF7|\\uD83C\\uDDE8\\uD83C\\uDDEE|\\uD83C\\uDDED\\uD83C\\uDDF7|\\uD83C\\uDDE8\\uD83C\\uDDFA|\\uD83C\\uDDE8\\uD83C\\uDDFE|\\uD83C\\uDDE8\\uD83C\\uDDFF|\\uD83C\\uDDE8\\uD83C\\uDDE9|\\uD83C\\uDDE9\\uD83C\\uDDF0|\\uD83C\\uDDE9\\uD83C\\uDDEF|\\uD83C\\uDDE9\\uD83C\\uDDF2|\\uD83C\\uDDE9\\uD83C\\uDDF4|\\uD83C\\uDDF9\\uD83C\\uDDF1|\\uD83C\\uDDEA\\uD83C\\uDDE8|\\uD83C\\uDDEA\\uD83C\\uDDEC|\\uD83C\\uDDF8\\uD83C\\uDDFB|\\uD83C\\uDDEC\\uD83C\\uDDF6|\\uD83C\\uDDEA\\uD83C\\uDDF7|\\uD83C\\uDDEA\\uD83C\\uDDEA|\\uD83C\\uDDEA\\uD83C\\uDDF9|\\uD83C\\uDDEB\\uD83C\\uDDEF|\\uD83C\\uDDEB\\uD83C\\uDDEE|\\uD83C\\uDDEC\\uD83C\\uDDE6|\\uD83C\\uDDEC\\uD83C\\uDDF2|\\uD83C\\uDDEC\\uD83C\\uDDEA|\\uD83C\\uDDEC\\uD83C\\uDDED|\\uD83C\\uDDEC\\uD83C\\uDDF7|\\uD83C\\uDDEC\\uD83C\\uDDE9|\\uD83C\\uDDEC\\uD83C\\uDDF9|\\uD83C\\uDDEC\\uD83C\\uDDF3|\\uD83C\\uDDEC\\uD83C\\uDDFC|\\uD83C\\uDDEC\\uD83C\\uDDFE|\\uD83C\\uDDED\\uD83C\\uDDF9|\\uD83C\\uDDED\\uD83C\\uDDF3|\\uD83C\\uDDED\\uD83C\\uDDFA|\\uD83C\\uDDEE\\uD83C\\uDDF8|\\uD83C\\uDDEE\\uD83C\\uDDF3|\\uD83C\\uDDEE\\uD83C\\uDDE9|\\uD83C\\uDDEE\\uD83C\\uDDF7|\\uD83C\\uDDEE\\uD83C\\uDDF6|\\uD83C\\uDDEE\\uD83C\\uDDEA|\\uD83C\\uDDEE\\uD83C\\uDDF1|\\uD83C\\uDDEF\\uD83C\\uDDF2|\\uD83C\\uDDEF\\uD83C\\uDDF4|\\uD83C\\uDDF0\\uD83C\\uDDFF|\\uD83C\\uDDF0\\uD83C\\uDDEA|\\uD83C\\uDDF0\\uD83C\\uDDEE|\\uD83C\\uDDFD\\uD83C\\uDDF0|\\uD83C\\uDDF0\\uD83C\\uDDFC|\\uD83C\\uDDF0\\uD83C\\uDDEC|\\uD83C\\uDDF1\\uD83C\\uDDE6|\\uD83C\\uDDF1\\uD83C\\uDDFB|\\uD83C\\uDDF1\\uD83C\\uDDE7|\\uD83C\\uDDF1\\uD83C\\uDDF8|\\uD83C\\uDDF1\\uD83C\\uDDF7|\\uD83C\\uDDF1\\uD83C\\uDDFE|\\uD83C\\uDDF1\\uD83C\\uDDEE|\\uD83C\\uDDF1\\uD83C\\uDDF9|\\uD83C\\uDDF1\\uD83C\\uDDFA|\\uD83C\\uDDF2\\uD83C\\uDDF0|\\uD83C\\uDDF2\\uD83C\\uDDEC|\\uD83C\\uDDF2\\uD83C\\uDDFC|\\uD83C\\uDDF2\\uD83C\\uDDFE|\\uD83C\\uDDF2\\uD83C\\uDDFB|\\uD83C\\uDDF2\\uD83C\\uDDF1|\\uD83C\\uDDF2\\uD83C\\uDDF9|\\uD83C\\uDDF2\\uD83C\\uDDED|\\uD83C\\uDDF2\\uD83C\\uDDF7|\\uD83C\\uDDF2\\uD83C\\uDDFA|\\uD83C\\uDDF2\\uD83C\\uDDFD|\\uD83C\\uDDEB\\uD83C\\uDDF2|\\uD83C\\uDDF2\\uD83C\\uDDE9|\\uD83C\\uDDF2\\uD83C\\uDDE8|\\uD83C\\uDDF2\\uD83C\\uDDF3|\\uD83C\\uDDF2\\uD83C\\uDDEA|\\uD83C\\uDDF2\\uD83C\\uDDE6|\\uD83C\\uDDF2\\uD83C\\uDDFF|\\uD83C\\uDDF2\\uD83C\\uDDF2|\\uD83C\\uDDF3\\uD83C\\uDDE6|\\uD83C\\uDDF3\\uD83C\\uDDF7|\\uD83C\\uDDF3\\uD83C\\uDDF5|\\uD83C\\uDDF3\\uD83C\\uDDF1|\\uD83C\\uDDF3\\uD83C\\uDDFF|\\uD83C\\uDDF3\\uD83C\\uDDEE|\\uD83C\\uDDF3\\uD83C\\uDDEA|\\uD83C\\uDDF3\\uD83C\\uDDEC|\\uD83C\\uDDF0\\uD83C\\uDDF5|\\uD83C\\uDDF3\\uD83C\\uDDF4|\\uD83C\\uDDF4\\uD83C\\uDDF2|\\uD83C\\uDDF5\\uD83C\\uDDF0|\\uD83C\\uDDF5\\uD83C\\uDDFC|\\uD83C\\uDDF5\\uD83C\\uDDE6|\\uD83C\\uDDF5\\uD83C\\uDDEC|\\uD83C\\uDDF5\\uD83C\\uDDFE|\\uD83C\\uDDF5\\uD83C\\uDDEA|\\uD83C\\uDDF5\\uD83C\\uDDED|\\uD83C\\uDDF5\\uD83C\\uDDF1|\\uD83C\\uDDF5\\uD83C\\uDDF9|\\uD83C\\uDDF6\\uD83C\\uDDE6|\\uD83C\\uDDF9\\uD83C\\uDDFC|\\uD83C\\uDDE8\\uD83C\\uDDEC|\\uD83C\\uDDF7\\uD83C\\uDDF4|\\uD83C\\uDDF7\\uD83C\\uDDFC|\\uD83C\\uDDF0\\uD83C\\uDDF3|\\uD83C\\uDDF1\\uD83C\\uDDE8|\\uD83C\\uDDFB\\uD83C\\uDDE8|\\uD83C\\uDDFC\\uD83C\\uDDF8|\\uD83C\\uDDF8\\uD83C\\uDDF2|\\uD83C\\uDDF8\\uD83C\\uDDF9|\\uD83C\\uDDF8\\uD83C\\uDDE6|\\uD83C\\uDDF8\\uD83C\\uDDF3|\\uD83C\\uDDF7\\uD83C\\uDDF8|\\uD83C\\uDDF8\\uD83C\\uDDE8|\\uD83C\\uDDF8\\uD83C\\uDDF1|\\uD83C\\uDDF8\\uD83C\\uDDEC|\\uD83C\\uDDF8\\uD83C\\uDDF0|\\uD83C\\uDDF8\\uD83C\\uDDEE|\\uD83C\\uDDF8\\uD83C\\uDDE7|\\uD83C\\uDDF8\\uD83C\\uDDF4|\\uD83C\\uDDFF\\uD83C\\uDDE6|\\uD83C\\uDDF1\\uD83C\\uDDF0|\\uD83C\\uDDF8\\uD83C\\uDDE9|\\uD83C\\uDDF8\\uD83C\\uDDF7|\\uD83C\\uDDF8\\uD83C\\uDDFF|\\uD83C\\uDDF8\\uD83C\\uDDEA|\\uD83C\\uDDE8\\uD83C\\uDDED|\\uD83C\\uDDF8\\uD83C\\uDDFE|\\uD83C\\uDDF9\\uD83C\\uDDEF|\\uD83C\\uDDF9\\uD83C\\uDDFF|\\uD83C\\uDDF9\\uD83C\\uDDED|\\uD83C\\uDDF9\\uD83C\\uDDEC|\\uD83C\\uDDF9\\uD83C\\uDDF4|\\uD83C\\uDDF9\\uD83C\\uDDF9|\\uD83C\\uDDF9\\uD83C\\uDDF3|\\uD83C\\uDDF9\\uD83C\\uDDF7|\\uD83C\\uDDF9\\uD83C\\uDDF2|\\uD83C\\uDDF9\\uD83C\\uDDFB|\\uD83C\\uDDFA\\uD83C\\uDDEC|\\uD83C\\uDDFA\\uD83C\\uDDE6|\\uD83C\\uDDE6\\uD83C\\uDDEA|\\uD83C\\uDDFA\\uD83C\\uDDFE|\\uD83C\\uDDFA\\uD83C\\uDDFF|\\uD83C\\uDDFB\\uD83C\\uDDFA|\\uD83C\\uDDFB\\uD83C\\uDDE6|\\uD83C\\uDDFB\\uD83C\\uDDEA|\\uD83C\\uDDFB\\uD83C\\uDDF3|\\uD83C\\uDDEA\\uD83C\\uDDED|\\uD83C\\uDDFE\\uD83C\\uDDEA|\\uD83C\\uDDFF\\uD83C\\uDDF2|\\uD83C\\uDDFF\\uD83C\\uDDFC|\\uD83C\\uDDF5\\uD83C\\uDDF7|\\uD83C\\uDDF0\\uD83C\\uDDFE|\\uD83C\\uDDE7\\uD83C\\uDDF2|\\uD83C\\uDDF5\\uD83C\\uDDEB|\\uD83C\\uDDF5\\uD83C\\uDDF8|\\uD83C\\uDDF3\\uD83C\\uDDE8|\\uD83C\\uDDF8\\uD83C\\uDDED|\\uD83C\\uDDE6\\uD83C\\uDDFC|\\uD83C\\uDDFB\\uD83C\\uDDEE|\\uD83C\\uDDED\\uD83C\\uDDF0|\\uD83C\\uDDE6\\uD83C\\uDDE8|\\uD83C\\uDDF2\\uD83C\\uDDF8|\\uD83C\\uDDEC\\uD83C\\uDDFA|\\uD83C\\uDDEC\\uD83C\\uDDF1|\\uD83C\\uDDF3\\uD83C\\uDDFA|\\uD83C\\uDDFC\\uD83C\\uDDEB|\\uD83C\\uDDF2\\uD83C\\uDDF4|\\uD83C\\uDDEB\\uD83C\\uDDF4|\\uD83C\\uDDEB\\uD83C\\uDDF0|\\uD83C\\uDDEF\\uD83C\\uDDEA|\\uD83C\\uDDE6\\uD83C\\uDDEE|\\uD83C\\uDDEC\\uD83C\\uDDEE)";
        ns.jsecapeMap = {
            "#️⃣": "0023-20E3",
            "#⃣": "0023-20E3",
            "0️⃣": "0030-20E3",
            "0⃣": "0030-20E3",
            "1️⃣": "0031-20E3",
            "1⃣": "0031-20E3",
            "2️⃣": "0032-20E3",
            "2⃣": "0032-20E3",
            "3️⃣": "0033-20E3",
            "3⃣": "0033-20E3",
            "4️⃣": "0034-20E3",
            "4⃣": "0034-20E3",
            "5️⃣": "0035-20E3",
            "5⃣": "0035-20E3",
            "6️⃣": "0036-20E3",
            "6⃣": "0036-20E3",
            "7️⃣": "0037-20E3",
            "7⃣": "0037-20E3",
            "8️⃣": "0038-20E3",
            "8⃣": "0038-20E3",
            "9️⃣": "0039-20E3",
            "9⃣": "0039-20E3",
            "©": "00A9",
            "®": "00AE",
            "‼️": "203C",
            "‼": "203C",
            "⁉️": "2049",
            "⁉": "2049",
            "™": "2122",
            "ℹ️": "2139",
            "ℹ": "2139",
            "↔️": "2194",
            "↔": "2194",
            "↕️": "2195",
            "↕": "2195",
            "↖️": "2196",
            "↖": "2196",
            "↗️": "2197",
            "↗": "2197",
            "↘️": "2198",
            "↘": "2198",
            "↙️": "2199",
            "↙": "2199",
            "↩️": "21A9",
            "↩": "21A9",
            "↪️": "21AA",
            "↪": "21AA",
            "⌚️": "231A",
            "⌚": "231A",
            "⌛️": "231B",
            "⌛": "231B",
            "⏩": "23E9",
            "⏪": "23EA",
            "⏫": "23EB",
            "⏬": "23EC",
            "⏰": "23F0",
            "⏳": "23F3",
            "Ⓜ️": "24C2",
            "Ⓜ": "24C2",
            "▪️": "25AA",
            "▪": "25AA",
            "▫️": "25AB",
            "▫": "25AB",
            "▶️": "25B6",
            "▶": "25B6",
            "◀️": "25C0",
            "◀": "25C0",
            "◻️": "25FB",
            "◻": "25FB",
            "◼️": "25FC",
            "◼": "25FC",
            "◽️": "25FD",
            "◽": "25FD",
            "◾️": "25FE",
            "◾": "25FE",
            "☀️": "2600",
            "☀": "2600",
            "☁️": "2601",
            "☁": "2601",
            "☎️": "260E",
            "☎": "260E",
            "☑️": "2611",
            "☑": "2611",
            "☔️": "2614",
            "☔": "2614",
            "☕️": "2615",
            "☕": "2615",
            "☝️": "261D",
            "☝": "261D",
            "☺️": "263A",
            "☺": "263A",
            "♈️": "2648",
            "♈": "2648",
            "♉️": "2649",
            "♉": "2649",
            "♊️": "264A",
            "♊": "264A",
            "♋️": "264B",
            "♋": "264B",
            "♌️": "264C",
            "♌": "264C",
            "♍️": "264D",
            "♍": "264D",
            "♎️": "264E",
            "♎": "264E",
            "♏️": "264F",
            "♏": "264F",
            "♐️": "2650",
            "♐": "2650",
            "♑️": "2651",
            "♑": "2651",
            "♒️": "2652",
            "♒": "2652",
            "♓️": "2653",
            "♓": "2653",
            "♠️": "2660",
            "♠": "2660",
            "♣️": "2663",
            "♣": "2663",
            "♥️": "2665",
            "♥": "2665",
            "♦️": "2666",
            "♦": "2666",
            "♨️": "2668",
            "♨": "2668",
            "♻️": "267B",
            "♻": "267B",
            "♿️": "267F",
            "♿": "267F",
            "⚓️": "2693",
            "⚓": "2693",
            "⚠️": "26A0",
            "⚠": "26A0",
            "⚡️": "26A1",
            "⚡": "26A1",
            "⚪️": "26AA",
            "⚪": "26AA",
            "⚫️": "26AB",
            "⚫": "26AB",
            "⚽️": "26BD",
            "⚽": "26BD",
            "⚾️": "26BE",
            "⚾": "26BE",
            "⛄️": "26C4",
            "⛄": "26C4",
            "⛅️": "26C5",
            "⛅": "26C5",
            "⛎": "26CE",
            "⛔️": "26D4",
            "⛔": "26D4",
            "⛪️": "26EA",
            "⛪": "26EA",
            "⛲️": "26F2",
            "⛲": "26F2",
            "⛳️": "26F3",
            "⛳": "26F3",
            "⛵️": "26F5",
            "⛵": "26F5",
            "⛺️": "26FA",
            "⛺": "26FA",
            "⛽️": "26FD",
            "⛽": "26FD",
            "✂️": "2702",
            "✂": "2702",
            "✅": "2705",
            "✈️": "2708",
            "✈": "2708",
            "✉️": "2709",
            "✉": "2709",
            "✊": "270A",
            "✋": "270B",
            "✌️": "270C",
            "✌": "270C",
            "✏️": "270F",
            "✏": "270F",
            "✒️": "2712",
            "✒": "2712",
            "✔️": "2714",
            "✔": "2714",
            "✖️": "2716",
            "✖": "2716",
            "✨": "2728",
            "✳️": "2733",
            "✳": "2733",
            "✴️": "2734",
            "✴": "2734",
            "❄️": "2744",
            "❄": "2744",
            "❇️": "2747",
            "❇": "2747",
            "❌": "274C",
            "❎": "274E",
            "❓": "2753",
            "❔": "2754",
            "❕": "2755",
            "❗️": "2757",
            "❗": "2757",
            "❤️": "2764",
            "❤": "2764",
            "➕": "2795",
            "➖": "2796",
            "➗": "2797",
            "➡️": "27A1",
            "➡": "27A1",
            "➰": "27B0",
            "⤴️": "2934",
            "⤴": "2934",
            "⤵️": "2935",
            "⤵": "2935",
            "⬅️": "2B05",
            "⬅": "2B05",
            "⬆️": "2B06",
            "⬆": "2B06",
            "⬇️": "2B07",
            "⬇": "2B07",
            "⬛️": "2B1B",
            "⬛": "2B1B",
            "⬜️": "2B1C",
            "⬜": "2B1C",
            "⭐️": "2B50",
            "⭐": "2B50",
            "⭕️": "2B55",
            "⭕": "2B55",
            "〰": "3030",
            "〽️": "303D",
            "〽": "303D",
            "㊗️": "3297",
            "㊗": "3297",
            "㊙️": "3299",
            "㊙": "3299",
            "🀄️": "1F004",
            "🀄": "1F004",
            "🃏": "1F0CF",
            "🅰": "1F170",
            "🅱": "1F171",
            "🅾": "1F17E",
            "🅿️": "1F17F",
            "🅿": "1F17F",
            "🆎": "1F18E",
            "🆑": "1F191",
            "🆒": "1F192",
            "🆓": "1F193",
            "🆔": "1F194",
            "🆕": "1F195",
            "🆖": "1F196",
            "🆗": "1F197",
            "🆘": "1F198",
            "🆙": "1F199",
            "🆚": "1F19A",
            "🇨🇳": "1F1E8-1F1F3",
            "🇩🇪": "1F1E9-1F1EA",
            "🇪🇸": "1F1EA-1F1F8",
            "🇫🇷": "1F1EB-1F1F7",
            "🇬🇧": "1F1EC-1F1E7",
            "🇮🇹": "1F1EE-1F1F9",
            "🇯🇵": "1F1EF-1F1F5",
            "🇰🇷": "1F1F0-1F1F7",
            "🇺🇸": "1F1FA-1F1F8",
            "🇷🇺": "1F1F7-1F1FA",
            "🈁": "1F201",
            "🈂": "1F202",
            "🈚️": "1F21A",
            "🈚": "1F21A",
            "🈯️": "1F22F",
            "🈯": "1F22F",
            "🈲": "1F232",
            "🈳": "1F233",
            "🈴": "1F234",
            "🈵": "1F235",
            "🈶": "1F236",
            "🈷": "1F237",
            "🈸": "1F238",
            "🈹": "1F239",
            "🈺": "1F23A",
            "🉐": "1F250",
            "🉑": "1F251",
            "🌀": "1F300",
            "🌁": "1F301",
            "🌂": "1F302",
            "🌃": "1F303",
            "🌄": "1F304",
            "🌅": "1F305",
            "🌆": "1F306",
            "🌇": "1F307",
            "🌈": "1F308",
            "🌉": "1F309",
            "🌊": "1F30A",
            "🌋": "1F30B",
            "🌌": "1F30C",
            "🌏": "1F30F",
            "🌑": "1F311",
            "🌓": "1F313",
            "🌔": "1F314",
            "🌕": "1F315",
            "🌙": "1F319",
            "🌛": "1F31B",
            "🌟": "1F31F",
            "🌠": "1F320",
            "🌰": "1F330",
            "🌱": "1F331",
            "🌴": "1F334",
            "🌵": "1F335",
            "🌷": "1F337",
            "🌸": "1F338",
            "🌹": "1F339",
            "🌺": "1F33A",
            "🌻": "1F33B",
            "🌼": "1F33C",
            "🌽": "1F33D",
            "🌾": "1F33E",
            "🌿": "1F33F",
            "🍀": "1F340",
            "🍁": "1F341",
            "🍂": "1F342",
            "🍃": "1F343",
            "🍄": "1F344",
            "🍅": "1F345",
            "🍆": "1F346",
            "🍇": "1F347",
            "🍈": "1F348",
            "🍉": "1F349",
            "🍊": "1F34A",
            "🍌": "1F34C",
            "🍍": "1F34D",
            "🍎": "1F34E",
            "🍏": "1F34F",
            "🍑": "1F351",
            "🍒": "1F352",
            "🍓": "1F353",
            "🍔": "1F354",
            "🍕": "1F355",
            "🍖": "1F356",
            "🍗": "1F357",
            "🍘": "1F358",
            "🍙": "1F359",
            "🍚": "1F35A",
            "🍛": "1F35B",
            "🍜": "1F35C",
            "🍝": "1F35D",
            "🍞": "1F35E",
            "🍟": "1F35F",
            "🍠": "1F360",
            "🍡": "1F361",
            "🍢": "1F362",
            "🍣": "1F363",
            "🍤": "1F364",
            "🍥": "1F365",
            "🍦": "1F366",
            "🍧": "1F367",
            "🍨": "1F368",
            "🍩": "1F369",
            "🍪": "1F36A",
            "🍫": "1F36B",
            "🍬": "1F36C",
            "🍭": "1F36D",
            "🍮": "1F36E",
            "🍯": "1F36F",
            "🍰": "1F370",
            "🍱": "1F371",
            "🍲": "1F372",
            "🍳": "1F373",
            "🍴": "1F374",
            "🍵": "1F375",
            "🍶": "1F376",
            "🍷": "1F377",
            "🍸": "1F378",
            "🍹": "1F379",
            "🍺": "1F37A",
            "🍻": "1F37B",
            "🎀": "1F380",
            "🎁": "1F381",
            "🎂": "1F382",
            "🎃": "1F383",
            "🎄": "1F384",
            "🎅": "1F385",
            "🎆": "1F386",
            "🎇": "1F387",
            "🎈": "1F388",
            "🎉": "1F389",
            "🎊": "1F38A",
            "🎋": "1F38B",
            "🎌": "1F38C",
            "🎍": "1F38D",
            "🎎": "1F38E",
            "🎏": "1F38F",
            "🎐": "1F390",
            "🎑": "1F391",
            "🎒": "1F392",
            "🎓": "1F393",
            "🎠": "1F3A0",
            "🎡": "1F3A1",
            "🎢": "1F3A2",
            "🎣": "1F3A3",
            "🎤": "1F3A4",
            "🎥": "1F3A5",
            "🎦": "1F3A6",
            "🎧": "1F3A7",
            "🎨": "1F3A8",
            "🎩": "1F3A9",
            "🎪": "1F3AA",
            "🎫": "1F3AB",
            "🎬": "1F3AC",
            "🎭": "1F3AD",
            "🎮": "1F3AE",
            "🎯": "1F3AF",
            "🎰": "1F3B0",
            "🎱": "1F3B1",
            "🎲": "1F3B2",
            "🎳": "1F3B3",
            "🎴": "1F3B4",
            "🎵": "1F3B5",
            "🎶": "1F3B6",
            "🎷": "1F3B7",
            "🎸": "1F3B8",
            "🎹": "1F3B9",
            "🎺": "1F3BA",
            "🎻": "1F3BB",
            "🎼": "1F3BC",
            "🎽": "1F3BD",
            "🎾": "1F3BE",
            "🎿": "1F3BF",
            "🏀": "1F3C0",
            "🏁": "1F3C1",
            "🏂": "1F3C2",
            "🏃": "1F3C3",
            "🏄": "1F3C4",
            "🏆": "1F3C6",
            "🏈": "1F3C8",
            "🏊": "1F3CA",
            "🏠": "1F3E0",
            "🏡": "1F3E1",
            "🏢": "1F3E2",
            "🏣": "1F3E3",
            "🏥": "1F3E5",
            "🏦": "1F3E6",
            "🏧": "1F3E7",
            "🏨": "1F3E8",
            "🏩": "1F3E9",
            "🏪": "1F3EA",
            "🏫": "1F3EB",
            "🏬": "1F3EC",
            "🏭": "1F3ED",
            "🏮": "1F3EE",
            "🏯": "1F3EF",
            "🏰": "1F3F0",
            "🐌": "1F40C",
            "🐍": "1F40D",
            "🐎": "1F40E",
            "🐑": "1F411",
            "🐒": "1F412",
            "🐔": "1F414",
            "🐗": "1F417",
            "🐘": "1F418",
            "🐙": "1F419",
            "🐚": "1F41A",
            "🐛": "1F41B",
            "🐜": "1F41C",
            "🐝": "1F41D",
            "🐞": "1F41E",
            "🐟": "1F41F",
            "🐠": "1F420",
            "🐡": "1F421",
            "🐢": "1F422",
            "🐣": "1F423",
            "🐤": "1F424",
            "🐥": "1F425",
            "🐦": "1F426",
            "🐧": "1F427",
            "🐨": "1F428",
            "🐩": "1F429",
            "🐫": "1F42B",
            "🐬": "1F42C",
            "🐭": "1F42D",
            "🐮": "1F42E",
            "🐯": "1F42F",
            "🐰": "1F430",
            "🐱": "1F431",
            "🐲": "1F432",
            "🐳": "1F433",
            "🐴": "1F434",
            "🐵": "1F435",
            "🐶": "1F436",
            "🐷": "1F437",
            "🐸": "1F438",
            "🐹": "1F439",
            "🐺": "1F43A",
            "🐻": "1F43B",
            "🐼": "1F43C",
            "🐽": "1F43D",
            "🐾": "1F43E",
            "👀": "1F440",
            "👂": "1F442",
            "👃": "1F443",
            "👄": "1F444",
            "👅": "1F445",
            "👆": "1F446",
            "👇": "1F447",
            "👈": "1F448",
            "👉": "1F449",
            "👊": "1F44A",
            "👋": "1F44B",
            "👌": "1F44C",
            "👍": "1F44D",
            "👎": "1F44E",
            "👏": "1F44F",
            "👐": "1F450",
            "👑": "1F451",
            "👒": "1F452",
            "👓": "1F453",
            "👔": "1F454",
            "👕": "1F455",
            "👖": "1F456",
            "👗": "1F457",
            "👘": "1F458",
            "👙": "1F459",
            "👚": "1F45A",
            "👛": "1F45B",
            "👜": "1F45C",
            "👝": "1F45D",
            "👞": "1F45E",
            "👟": "1F45F",
            "👠": "1F460",
            "👡": "1F461",
            "👢": "1F462",
            "👣": "1F463",
            "👤": "1F464",
            "👦": "1F466",
            "👧": "1F467",
            "👨": "1F468",
            "👩": "1F469",
            "👪": "1F46A",
            "👫": "1F46B",
            "👮": "1F46E",
            "👯": "1F46F",
            "👰": "1F470",
            "👱": "1F471",
            "👲": "1F472",
            "👳": "1F473",
            "👴": "1F474",
            "👵": "1F475",
            "👶": "1F476",
            "👷": "1F477",
            "👸": "1F478",
            "👹": "1F479",
            "👺": "1F47A",
            "👻": "1F47B",
            "👼": "1F47C",
            "👽": "1F47D",
            "👾": "1F47E",
            "👿": "1F47F",
            "💀": "1F480",
            "📇": "1F4C7",
            "💁": "1F481",
            "💂": "1F482",
            "💃": "1F483",
            "💄": "1F484",
            "💅": "1F485",
            "📒": "1F4D2",
            "💆": "1F486",
            "📓": "1F4D3",
            "💇": "1F487",
            "📔": "1F4D4",
            "💈": "1F488",
            "📕": "1F4D5",
            "💉": "1F489",
            "📖": "1F4D6",
            "💊": "1F48A",
            "📗": "1F4D7",
            "💋": "1F48B",
            "📘": "1F4D8",
            "💌": "1F48C",
            "📙": "1F4D9",
            "💍": "1F48D",
            "📚": "1F4DA",
            "💎": "1F48E",
            "📛": "1F4DB",
            "💏": "1F48F",
            "📜": "1F4DC",
            "💐": "1F490",
            "📝": "1F4DD",
            "💑": "1F491",
            "📞": "1F4DE",
            "💒": "1F492",
            "📟": "1F4DF",
            "📠": "1F4E0",
            "💓": "1F493",
            "📡": "1F4E1",
            "📢": "1F4E2",
            "💔": "1F494",
            "📣": "1F4E3",
            "📤": "1F4E4",
            "💕": "1F495",
            "📥": "1F4E5",
            "📦": "1F4E6",
            "💖": "1F496",
            "📧": "1F4E7",
            "📨": "1F4E8",
            "💗": "1F497",
            "📩": "1F4E9",
            "📪": "1F4EA",
            "💘": "1F498",
            "📫": "1F4EB",
            "📮": "1F4EE",
            "💙": "1F499",
            "📰": "1F4F0",
            "📱": "1F4F1",
            "💚": "1F49A",
            "📲": "1F4F2",
            "📳": "1F4F3",
            "💛": "1F49B",
            "📴": "1F4F4",
            "📶": "1F4F6",
            "💜": "1F49C",
            "📷": "1F4F7",
            "📹": "1F4F9",
            "💝": "1F49D",
            "📺": "1F4FA",
            "📻": "1F4FB",
            "💞": "1F49E",
            "📼": "1F4FC",
            "🔃": "1F503",
            "💟": "1F49F",
            "🔊": "1F50A",
            "🔋": "1F50B",
            "💠": "1F4A0",
            "🔌": "1F50C",
            "🔍": "1F50D",
            "💡": "1F4A1",
            "🔎": "1F50E",
            "🔏": "1F50F",
            "💢": "1F4A2",
            "🔐": "1F510",
            "🔑": "1F511",
            "💣": "1F4A3",
            "🔒": "1F512",
            "🔓": "1F513",
            "💤": "1F4A4",
            "🔔": "1F514",
            "🔖": "1F516",
            "💥": "1F4A5",
            "🔗": "1F517",
            "🔘": "1F518",
            "💦": "1F4A6",
            "🔙": "1F519",
            "🔚": "1F51A",
            "💧": "1F4A7",
            "🔛": "1F51B",
            "🔜": "1F51C",
            "💨": "1F4A8",
            "🔝": "1F51D",
            "🔞": "1F51E",
            "💩": "1F4A9",
            "🔟": "1F51F",
            "💪": "1F4AA",
            "🔠": "1F520",
            "🔡": "1F521",
            "💫": "1F4AB",
            "🔢": "1F522",
            "🔣": "1F523",
            "💬": "1F4AC",
            "🔤": "1F524",
            "🔥": "1F525",
            "💮": "1F4AE",
            "🔦": "1F526",
            "🔧": "1F527",
            "💯": "1F4AF",
            "🔨": "1F528",
            "🔩": "1F529",
            "💰": "1F4B0",
            "🔪": "1F52A",
            "🔫": "1F52B",
            "💱": "1F4B1",
            "🔮": "1F52E",
            "💲": "1F4B2",
            "🔯": "1F52F",
            "💳": "1F4B3",
            "🔰": "1F530",
            "🔱": "1F531",
            "💴": "1F4B4",
            "🔲": "1F532",
            "🔳": "1F533",
            "💵": "1F4B5",
            "🔴": "1F534",
            "🔵": "1F535",
            "💸": "1F4B8",
            "🔶": "1F536",
            "🔷": "1F537",
            "💹": "1F4B9",
            "🔸": "1F538",
            "🔹": "1F539",
            "💺": "1F4BA",
            "🔺": "1F53A",
            "🔻": "1F53B",
            "💻": "1F4BB",
            "🔼": "1F53C",
            "💼": "1F4BC",
            "🔽": "1F53D",
            "🕐": "1F550",
            "💽": "1F4BD",
            "🕑": "1F551",
            "💾": "1F4BE",
            "🕒": "1F552",
            "💿": "1F4BF",
            "🕓": "1F553",
            "📀": "1F4C0",
            "🕔": "1F554",
            "🕕": "1F555",
            "📁": "1F4C1",
            "🕖": "1F556",
            "🕗": "1F557",
            "📂": "1F4C2",
            "🕘": "1F558",
            "🕙": "1F559",
            "📃": "1F4C3",
            "🕚": "1F55A",
            "🕛": "1F55B",
            "📄": "1F4C4",
            "🗻": "1F5FB",
            "🗼": "1F5FC",
            "📅": "1F4C5",
            "🗽": "1F5FD",
            "🗾": "1F5FE",
            "📆": "1F4C6",
            "🗿": "1F5FF",
            "😁": "1F601",
            "😂": "1F602",
            "😃": "1F603",
            "📈": "1F4C8",
            "😄": "1F604",
            "😅": "1F605",
            "📉": "1F4C9",
            "😆": "1F606",
            "😉": "1F609",
            "📊": "1F4CA",
            "😊": "1F60A",
            "😋": "1F60B",
            "📋": "1F4CB",
            "😌": "1F60C",
            "😍": "1F60D",
            "📌": "1F4CC",
            "😏": "1F60F",
            "😒": "1F612",
            "📍": "1F4CD",
            "😓": "1F613",
            "😔": "1F614",
            "📎": "1F4CE",
            "😖": "1F616",
            "😘": "1F618",
            "📏": "1F4CF",
            "😚": "1F61A",
            "😜": "1F61C",
            "📐": "1F4D0",
            "😝": "1F61D",
            "😞": "1F61E",
            "📑": "1F4D1",
            "😠": "1F620",
            "😡": "1F621",
            "😢": "1F622",
            "😣": "1F623",
            "😤": "1F624",
            "😥": "1F625",
            "😨": "1F628",
            "😩": "1F629",
            "😪": "1F62A",
            "😫": "1F62B",
            "😭": "1F62D",
            "😰": "1F630",
            "😱": "1F631",
            "😲": "1F632",
            "😳": "1F633",
            "😵": "1F635",
            "😷": "1F637",
            "😸": "1F638",
            "😹": "1F639",
            "😺": "1F63A",
            "😻": "1F63B",
            "😼": "1F63C",
            "😽": "1F63D",
            "😾": "1F63E",
            "😿": "1F63F",
            "🙀": "1F640",
            "🙅": "1F645",
            "🙆": "1F646",
            "🙇": "1F647",
            "🙈": "1F648",
            "🙉": "1F649",
            "🙊": "1F64A",
            "🙋": "1F64B",
            "🙌": "1F64C",
            "🙍": "1F64D",
            "🙎": "1F64E",
            "🙏": "1F64F",
            "🚀": "1F680",
            "🚃": "1F683",
            "🚄": "1F684",
            "🚅": "1F685",
            "🚇": "1F687",
            "🚉": "1F689",
            "🚌": "1F68C",
            "🚏": "1F68F",
            "🚑": "1F691",
            "🚒": "1F692",
            "🚓": "1F693",
            "🚕": "1F695",
            "🚗": "1F697",
            "🚙": "1F699",
            "🚚": "1F69A",
            "🚢": "1F6A2",
            "🚤": "1F6A4",
            "🚥": "1F6A5",
            "🚧": "1F6A7",
            "🚨": "1F6A8",
            "🚩": "1F6A9",
            "🚪": "1F6AA",
            "🚫": "1F6AB",
            "🚬": "1F6AC",
            "🚭": "1F6AD",
            "🚲": "1F6B2",
            "🚶": "1F6B6",
            "🚹": "1F6B9",
            "🚺": "1F6BA",
            "🚻": "1F6BB",
            "🚼": "1F6BC",
            "🚽": "1F6BD",
            "🚾": "1F6BE",
            "🛀": "1F6C0",
            "😀": "1F600",
            "😇": "1F607",
            "😈": "1F608",
            "😎": "1F60E",
            "😐": "1F610",
            "😑": "1F611",
            "😕": "1F615",
            "😗": "1F617",
            "😙": "1F619",
            "😛": "1F61B",
            "😟": "1F61F",
            "😦": "1F626",
            "😧": "1F627",
            "😬": "1F62C",
            "😮": "1F62E",
            "😯": "1F62F",
            "😴": "1F634",
            "😶": "1F636",
            "🚁": "1F681",
            "🚂": "1F682",
            "🚆": "1F686",
            "🚈": "1F688",
            "🚊": "1F68A",
            "🚍": "1F68D",
            "🚎": "1F68E",
            "🚐": "1F690",
            "🚔": "1F694",
            "🚖": "1F696",
            "🚘": "1F698",
            "🚛": "1F69B",
            "🚜": "1F69C",
            "🚝": "1F69D",
            "🚞": "1F69E",
            "🚟": "1F69F",
            "🚠": "1F6A0",
            "🚡": "1F6A1",
            "🚣": "1F6A3",
            "🚦": "1F6A6",
            "🚮": "1F6AE",
            "🚯": "1F6AF",
            "🚰": "1F6B0",
            "🚱": "1F6B1",
            "🚳": "1F6B3",
            "🚴": "1F6B4",
            "🚵": "1F6B5",
            "🚷": "1F6B7",
            "🚸": "1F6B8",
            "🚿": "1F6BF",
            "🛁": "1F6C1",
            "🛂": "1F6C2",
            "🛃": "1F6C3",
            "🛄": "1F6C4",
            "🛅": "1F6C5",
            "🌍": "1F30D",
            "🌎": "1F30E",
            "🌐": "1F310",
            "🌒": "1F312",
            "🌖": "1F316",
            "🌗": "1F317",
            "🌘": "1F318",
            "🌚": "1F31A",
            "🌜": "1F31C",
            "🌝": "1F31D",
            "🌞": "1F31E",
            "🌲": "1F332",
            "🌳": "1F333",
            "🍋": "1F34B",
            "🍐": "1F350",
            "🍼": "1F37C",
            "🏇": "1F3C7",
            "🏉": "1F3C9",
            "🏤": "1F3E4",
            "🐀": "1F400",
            "🐁": "1F401",
            "🐂": "1F402",
            "🐃": "1F403",
            "🐄": "1F404",
            "🐅": "1F405",
            "🐆": "1F406",
            "🐇": "1F407",
            "🐈": "1F408",
            "🐉": "1F409",
            "🐊": "1F40A",
            "🐋": "1F40B",
            "🐏": "1F40F",
            "🐐": "1F410",
            "🐓": "1F413",
            "🐕": "1F415",
            "🐖": "1F416",
            "🐪": "1F42A",
            "👥": "1F465",
            "👬": "1F46C",
            "👭": "1F46D",
            "💭": "1F4AD",
            "💶": "1F4B6",
            "💷": "1F4B7",
            "📬": "1F4EC",
            "📭": "1F4ED",
            "📯": "1F4EF",
            "📵": "1F4F5",
            "🔀": "1F500",
            "🔁": "1F501",
            "🔂": "1F502",
            "🔄": "1F504",
            "🔅": "1F505",
            "🔆": "1F506",
            "🔇": "1F507",
            "🔉": "1F509",
            "🔕": "1F515",
            "🔬": "1F52C",
            "🔭": "1F52D",
            "🕜": "1F55C",
            "🕝": "1F55D",
            "🕞": "1F55E",
            "🕟": "1F55F",
            "🕠": "1F560",
            "🕡": "1F561",
            "🕢": "1F562",
            "🕣": "1F563",
            "🕤": "1F564",
            "🕥": "1F565",
            "🕦": "1F566",
            "🕧": "1F567",
            "🔈": "1F508",
            "🚋": "1F68B",
            "➿": "27BF",
            "🇦🇫": "1F1E6-1F1EB",
            "🇦🇱": "1F1E6-1F1F1",
            "🇩🇿": "1F1E9-1F1FF",
            "🇦🇩": "1F1E6-1F1E9",
            "🇦🇴": "1F1E6-1F1F4",
            "🇦🇬": "1F1E6-1F1EC",
            "🇦🇷": "1F1E6-1F1F7",
            "🇦🇲": "1F1E6-1F1F2",
            "🇦🇺": "1F1E6-1F1FA",
            "🇦🇹": "1F1E6-1F1F9",
            "🇦🇿": "1F1E6-1F1FF",
            "🇧🇸": "1F1E7-1F1F8",
            "🇧🇭": "1F1E7-1F1ED",
            "🇧🇩": "1F1E7-1F1E9",
            "🇧🇧": "1F1E7-1F1E7",
            "🇧🇾": "1F1E7-1F1FE",
            "🇧🇪": "1F1E7-1F1EA",
            "🇧🇿": "1F1E7-1F1FF",
            "🇧🇯": "1F1E7-1F1EF",
            "🇧🇹": "1F1E7-1F1F9",
            "🇧🇴": "1F1E7-1F1F4",
            "🇧🇦": "1F1E7-1F1E6",
            "🇧🇼": "1F1E7-1F1FC",
            "🇧🇷": "1F1E7-1F1F7",
            "🇧🇳": "1F1E7-1F1F3",
            "🇧🇬": "1F1E7-1F1EC",
            "🇧🇫": "1F1E7-1F1EB",
            "🇧🇮": "1F1E7-1F1EE",
            "🇰🇭": "1F1F0-1F1ED",
            "🇨🇲": "1F1E8-1F1F2",
            "🇨🇦": "1F1E8-1F1E6",
            "🇨🇻": "1F1E8-1F1FB",
            "🇨🇫": "1F1E8-1F1EB",
            "🇹🇩": "1F1F9-1F1E9",
            "🇨🇱": "1F1E8-1F1F1",
            "🇨🇴": "1F1E8-1F1F4",
            "🇰🇲": "1F1F0-1F1F2",
            "🇨🇷": "1F1E8-1F1F7",
            "🇨🇮": "1F1E8-1F1EE",
            "🇭🇷": "1F1ED-1F1F7",
            "🇨🇺": "1F1E8-1F1FA",
            "🇨🇾": "1F1E8-1F1FE",
            "🇨🇿": "1F1E8-1F1FF",
            "🇨🇩": "1F1E8-1F1E9",
            "🇩🇰": "1F1E9-1F1F0",
            "🇩🇯": "1F1E9-1F1EF",
            "🇩🇲": "1F1E9-1F1F2",
            "🇩🇴": "1F1E9-1F1F4",
            "🇹🇱": "1F1F9-1F1F1",
            "🇪🇨": "1F1EA-1F1E8",
            "🇪🇬": "1F1EA-1F1EC",
            "🇸🇻": "1F1F8-1F1FB",
            "🇬🇶": "1F1EC-1F1F6",
            "🇪🇷": "1F1EA-1F1F7",
            "🇪🇪": "1F1EA-1F1EA",
            "🇪🇹": "1F1EA-1F1F9",
            "🇫🇯": "1F1EB-1F1EF",
            "🇫🇮": "1F1EB-1F1EE",
            "🇬🇦": "1F1EC-1F1E6",
            "🇬🇲": "1F1EC-1F1F2",
            "🇬🇪": "1F1EC-1F1EA",
            "🇬🇭": "1F1EC-1F1ED",
            "🇬🇷": "1F1EC-1F1F7",
            "🇬🇩": "1F1EC-1F1E9",
            "🇬🇹": "1F1EC-1F1F9",
            "🇬🇳": "1F1EC-1F1F3",
            "🇬🇼": "1F1EC-1F1FC",
            "🇬🇾": "1F1EC-1F1FE",
            "🇭🇹": "1F1ED-1F1F9",
            "🇭🇳": "1F1ED-1F1F3",
            "🇭🇺": "1F1ED-1F1FA",
            "🇮🇸": "1F1EE-1F1F8",
            "🇮🇳": "1F1EE-1F1F3",
            "🇮🇩": "1F1EE-1F1E9",
            "🇮🇷": "1F1EE-1F1F7",
            "🇮🇶": "1F1EE-1F1F6",
            "🇮🇪": "1F1EE-1F1EA",
            "🇮🇱": "1F1EE-1F1F1",
            "🇯🇲": "1F1EF-1F1F2",
            "🇯🇴": "1F1EF-1F1F4",
            "🇰🇿": "1F1F0-1F1FF",
            "🇰🇪": "1F1F0-1F1EA",
            "🇰🇮": "1F1F0-1F1EE",
            "🇽🇰": "1F1FD-1F1F0",
            "🇰🇼": "1F1F0-1F1FC",
            "🇰🇬": "1F1F0-1F1EC",
            "🇱🇦": "1F1F1-1F1E6",
            "🇱🇻": "1F1F1-1F1FB",
            "🇱🇧": "1F1F1-1F1E7",
            "🇱🇸": "1F1F1-1F1F8",
            "🇱🇷": "1F1F1-1F1F7",
            "🇱🇾": "1F1F1-1F1FE",
            "🇱🇮": "1F1F1-1F1EE",
            "🇱🇹": "1F1F1-1F1F9",
            "🇱🇺": "1F1F1-1F1FA",
            "🇲🇰": "1F1F2-1F1F0",
            "🇲🇬": "1F1F2-1F1EC",
            "🇲🇼": "1F1F2-1F1FC",
            "🇲🇾": "1F1F2-1F1FE",
            "🇲🇻": "1F1F2-1F1FB",
            "🇲🇱": "1F1F2-1F1F1",
            "🇲🇹": "1F1F2-1F1F9",
            "🇲🇭": "1F1F2-1F1ED",
            "🇲🇷": "1F1F2-1F1F7",
            "🇲🇺": "1F1F2-1F1FA",
            "🇲🇽": "1F1F2-1F1FD",
            "🇫🇲": "1F1EB-1F1F2",
            "🇲🇩": "1F1F2-1F1E9",
            "🇲🇨": "1F1F2-1F1E8",
            "🇲🇳": "1F1F2-1F1F3",
            "🇲🇪": "1F1F2-1F1EA",
            "🇲🇦": "1F1F2-1F1E6",
            "🇲🇿": "1F1F2-1F1FF",
            "🇲🇲": "1F1F2-1F1F2",
            "🇳🇦": "1F1F3-1F1E6",
            "🇳🇷": "1F1F3-1F1F7",
            "🇳🇵": "1F1F3-1F1F5",
            "🇳🇱": "1F1F3-1F1F1",
            "🇳🇿": "1F1F3-1F1FF",
            "🇳🇮": "1F1F3-1F1EE",
            "🇳🇪": "1F1F3-1F1EA",
            "🇳🇬": "1F1F3-1F1EC",
            "🇰🇵": "1F1F0-1F1F5",
            "🇳🇴": "1F1F3-1F1F4",
            "🇴🇲": "1F1F4-1F1F2",
            "🇵🇰": "1F1F5-1F1F0",
            "🇵🇼": "1F1F5-1F1FC",
            "🇵🇦": "1F1F5-1F1E6",
            "🇵🇬": "1F1F5-1F1EC",
            "🇵🇾": "1F1F5-1F1FE",
            "🇵🇪": "1F1F5-1F1EA",
            "🇵🇭": "1F1F5-1F1ED",
            "🇵🇱": "1F1F5-1F1F1",
            "🇵🇹": "1F1F5-1F1F9",
            "🇶🇦": "1F1F6-1F1E6",
            "🇹🇼": "1F1F9-1F1FC",
            "🇨🇬": "1F1E8-1F1EC",
            "🇷🇴": "1F1F7-1F1F4",
            "🇷🇼": "1F1F7-1F1FC",
            "🇰🇳": "1F1F0-1F1F3",
            "🇱🇨": "1F1F1-1F1E8",
            "🇻🇨": "1F1FB-1F1E8",
            "🇼🇸": "1F1FC-1F1F8",
            "🇸🇲": "1F1F8-1F1F2",
            "🇸🇹": "1F1F8-1F1F9",
            "🇸🇦": "1F1F8-1F1E6",
            "🇸🇳": "1F1F8-1F1F3",
            "🇷🇸": "1F1F7-1F1F8",
            "🇸🇨": "1F1F8-1F1E8",
            "🇸🇱": "1F1F8-1F1F1",
            "🇸🇬": "1F1F8-1F1EC",
            "🇸🇰": "1F1F8-1F1F0",
            "🇸🇮": "1F1F8-1F1EE",
            "🇸🇧": "1F1F8-1F1E7",
            "🇸🇴": "1F1F8-1F1F4",
            "🇿🇦": "1F1FF-1F1E6",
            "🇱🇰": "1F1F1-1F1F0",
            "🇸🇩": "1F1F8-1F1E9",
            "🇸🇷": "1F1F8-1F1F7",
            "🇸🇿": "1F1F8-1F1FF",
            "🇸🇪": "1F1F8-1F1EA",
            "🇨🇭": "1F1E8-1F1ED",
            "🇸🇾": "1F1F8-1F1FE",
            "🇹🇯": "1F1F9-1F1EF",
            "🇹🇿": "1F1F9-1F1FF",
            "🇹🇭": "1F1F9-1F1ED",
            "🇹🇬": "1F1F9-1F1EC",
            "🇹🇴": "1F1F9-1F1F4",
            "🇹🇹": "1F1F9-1F1F9",
            "🇹🇳": "1F1F9-1F1F3",
            "🇹🇷": "1F1F9-1F1F7",
            "🇹🇲": "1F1F9-1F1F2",
            "🇹🇻": "1F1F9-1F1FB",
            "🇺🇬": "1F1FA-1F1EC",
            "🇺🇦": "1F1FA-1F1E6",
            "🇦🇪": "1F1E6-1F1EA",
            "🇺🇾": "1F1FA-1F1FE",
            "🇺🇿": "1F1FA-1F1FF",
            "🇻🇺": "1F1FB-1F1FA",
            "🇻🇦": "1F1FB-1F1E6",
            "🇻🇪": "1F1FB-1F1EA",
            "🇻🇳": "1F1FB-1F1F3",
            "🇪🇭": "1F1EA-1F1ED",
            "🇾🇪": "1F1FE-1F1EA",
            "🇿🇲": "1F1FF-1F1F2",
            "🇿🇼": "1F1FF-1F1FC",
            "🇵🇷": "1F1F5-1F1F7",
            "🇰🇾": "1F1F0-1F1FE",
            "🇧🇲": "1F1E7-1F1F2",
            "🇵🇫": "1F1F5-1F1EB",
            "🇵🇸": "1F1F5-1F1F8",
            "🇳🇨": "1F1F3-1F1E8",
            "🇸🇭": "1F1F8-1F1ED",
            "🇦🇼": "1F1E6-1F1FC",
            "🇻🇮": "1F1FB-1F1EE",
            "🇭🇰": "1F1ED-1F1F0",
            "🇦🇨": "1F1E6-1F1E8",
            "🇲🇸": "1F1F2-1F1F8",
            "🇬🇺": "1F1EC-1F1FA",
            "🇬🇱": "1F1EC-1F1F1",
            "🇳🇺": "1F1F3-1F1FA",
            "🇼🇫": "1F1FC-1F1EB",
            "🇲🇴": "1F1F2-1F1F4",
            "🇫🇴": "1F1EB-1F1F4",
            "🇫🇰": "1F1EB-1F1F0",
            "🇯🇪": "1F1EF-1F1EA",
            "🇦🇮": "1F1E6-1F1EE",
            "🇬🇮": "1F1EC-1F1EE"
        };
        ns.shortnameRegexp = ":([-+\\w]+):";
        ns.imagePathPNG = "//cdn.jsdelivr.net/emojione/assets/png/";
        ns.imagePathSVG = "//cdn.jsdelivr.net/emojione/assets/svg/";
        ns.imagePathSVGSprites = "./../assets/sprites/emojione.sprites.svg";
        ns.imageType = "png";
        // or svg
        ns.sprites = false;
        // if this is true then sprite markup will be used (if SVG image type is set then you must include the SVG sprite file locally)
        ns.unicodeAlt = true;
        // use the unicode char as the alt attribute (makes copy and pasting the resulting text better)
        ns.ascii = false;
        // change to true to convert ascii smileys
        ns.cacheBustParam = "?v=1.2.4";
        // you can [optionally] modify this to force browsers to refresh their cache. it will be appended to the send of the filenames
        ns.toImage = function(str) {
            str = ns.unicodeToImage(str);
            str = ns.shortnameToImage(str);
            return str;
        };
        // Uses toShort to transform all unicode into a standard shortname
        // then transforms the shortname into unicode
        // This is done for standardization when converting several unicode types
        ns.unifyUnicode = function(str) {
            str = ns.toShort(str);
            str = ns.shortnameToUnicode(str);
            return str;
        };
        // Replace shortnames (:wink:) with Ascii equivalents ( ;^) )
        // Useful for systems that dont support unicode nor images
        ns.shortnameToAscii = function(str) {
            var unicode, // something to keep in mind here is that array flip will destroy
            // half of the ascii text "emojis" because the unicode numbers are duplicated
            // this is ok for what it's being used for
            unicodeToAscii = ns.objectFlip(ns.asciiList);
            str = str.replace(new RegExp("<object[^>]*>.*?</object>|<span[^>]*>.*?</span>|<(?:object|embed|svg|img|div|span|p|a)[^>]*>|(" + ns.shortnameRegexp + ")", "gi"), function(shortname) {
                if (typeof shortname === "undefined" || shortname === "" || !(shortname in ns.emojioneList)) {
                    // if the shortname doesnt exist just return the entire match
                    return shortname;
                } else {
                    unicode = ns.emojioneList[shortname][ns.emojioneList[shortname].length - 1].toLowerCase();
                    if (typeof unicodeToAscii[unicode] !== "undefined") {
                        return unicodeToAscii[unicode];
                    } else {
                        return shortname;
                    }
                }
            });
            return str;
        };
        // will output unicode from shortname
        // useful for sending emojis back to mobile devices
        ns.shortnameToUnicode = function(str) {
            // replace regular shortnames first
            var unicode;
            str = str.replace(new RegExp("<object[^>]*>.*?</object>|<span[^>]*>.*?</span>|<(?:object|embed|svg|img|div|span|p|a)[^>]*>|(" + ns.shortnameRegexp + ")", "gi"), function(shortname) {
                if (typeof shortname === "undefined" || shortname === "" || !(shortname in ns.emojioneList)) {
                    // if the shortname doesnt exist just return the entire match
                    return shortname;
                }
                unicode = ns.emojioneList[shortname][ns.emojioneList[shortname].length - 1].toUpperCase();
                return ns.convert(unicode);
            });
            // if ascii smileys are turned on, then we'll replace them!
            if (ns.ascii) {
                str = str.replace(new RegExp("<object[^>]*>.*?</object>|<span[^>]*>.*?</span>|<(?:object|embed|svg|img|div|span|p|a)[^>]*>|((\\s|^)" + ns.asciiRegexp + "(?=\\s|$|[!,.]))", "g"), function(entire, m1, m2, m3) {
                    if (typeof m3 === "undefined" || m3 === "" || !(ns.unescapeHTML(m3) in ns.asciiList)) {
                        // if the shortname doesnt exist just return the entire match
                        return entire;
                    }
                    m3 = ns.unescapeHTML(m3);
                    unicode = ns.asciiList[m3].toUpperCase();
                    return m2 + ns.convert(unicode);
                });
            }
            return str;
        };
        ns.shortnameToImage = function(str) {
            // replace regular shortnames first
            var replaceWith, unicode, alt;
            str = str.replace(new RegExp("<object[^>]*>.*?</object>|<span[^>]*>.*?</span>|<(?:object|embed|svg|img|div|span|p|a)[^>]*>|(" + ns.shortnameRegexp + ")", "gi"), function(shortname) {
                if (typeof shortname === "undefined" || shortname === "" || !(shortname in ns.emojioneList)) {
                    // if the shortname doesnt exist just return the entire match
                    return shortname;
                } else {
                    unicode = ns.emojioneList[shortname][ns.emojioneList[shortname].length - 1].toUpperCase();
                    // depending on the settings, we'll either add the native unicode as the alt tag, otherwise the shortname
                    alt = ns.unicodeAlt ? ns.convert(unicode) : shortname;
                    if (ns.imageType === "png") {
                        if (ns.sprites) {
                            replaceWith = '<span class="emojione-' + unicode + '" title="' + shortname + '">' + alt + "</span>";
                        } else {
                            replaceWith = '<img class="emojione" alt="' + alt + '" src="' + ns.imagePathPNG + unicode + ".png" + ns.cacheBustParam + '"/>';
                        }
                    } else {
                        // svg
                        if (ns.sprites) {
                            replaceWith = '<svg class="emojione"><description>' + alt + '</description><use xlink:href="' + ns.imagePathSVGSprites + "#emoji-" + unicode + '"></use></svg>';
                        } else {
                            replaceWith = '<object class="emojione" data="' + ns.imagePathSVG + unicode + ".svg" + ns.cacheBustParam + '" type="image/svg+xml" standby="' + alt + '">' + alt + "</object>";
                        }
                    }
                    return replaceWith;
                }
            });
            // if ascii smileys are turned on, then we'll replace them!
            if (ns.ascii) {
                str = str.replace(new RegExp("<object[^>]*>.*?</object>|<span[^>]*>.*?</span>|<(?:object|embed|svg|img|div|span|p|a)[^>]*>|((\\s|^)" + ns.asciiRegexp + "(?=\\s|$|[!,.]))", "g"), function(entire, m1, m2, m3) {
                    if (typeof m3 === "undefined" || m3 === "" || !(ns.unescapeHTML(m3) in ns.asciiList)) {
                        // if the shortname doesnt exist just return the entire match
                        return entire;
                    }
                    m3 = ns.unescapeHTML(m3);
                    unicode = ns.asciiList[m3].toUpperCase();
                    // depending on the settings, we'll either add the native unicode as the alt tag, otherwise the shortname
                    alt = ns.unicodeAlt ? ns.convert(unicode) : ns.escapeHTML(m3);
                    if (ns.imageType === "png") {
                        if (ns.sprites) {
                            replaceWith = m2 + '<span class="emojione-' + unicode.toUpperCase() + '" title="' + ns.escapeHTML(m3) + '">' + alt + "</span>";
                        } else {
                            replaceWith = m2 + '<img class="emojione" alt="' + alt + '" src="' + ns.imagePathPNG + unicode + ".png" + ns.cacheBustParam + '"/>';
                        }
                    } else {
                        // svg
                        if (ns.sprites) {
                            replaceWith = '<svg class="emojione"><description>' + alt + '</description><use xlink:href="' + ns.imagePathSVGSprites + "#emoji-" + unicode.toUpperCase() + '"></use></svg>';
                        } else {
                            replaceWith = m2 + '<object class="emojione" data="' + ns.imagePathSVG + unicode + ".svg" + ns.cacheBustParam + '" type="image/svg+xml" standby="' + alt + '">' + alt + "</object>";
                        }
                    }
                    return replaceWith;
                });
            }
            return str;
        };
        ns.unicodeToImage = function(str) {
            var replaceWith, unicode, alt;
            if (!ns.unicodeAlt || ns.sprites) {
                // if we are using the shortname as the alt tag then we need a reversed array to map unicode code point to shortnames
                var mappedUnicode = ns.mapShortToUnicode();
            }
            str = str.replace(new RegExp("<object[^>]*>.*?</object>|<span[^>]*>.*?</span>|<(?:object|embed|svg|img|div|span|p|a)[^>]*>|(" + ns.unicodeRegexp + ")", "gi"), function(unicodeChar) {
                if (typeof unicodeChar === "undefined" || unicodeChar === "" || !(unicodeChar in ns.jsecapeMap)) {
                    // if the unicodeChar doesnt exist just return the entire match
                    return unicodeChar;
                } else {
                    // get the unicode codepoint from the actual char
                    unicode = ns.jsecapeMap[unicodeChar];
                    // depending on the settings, we'll either add the native unicode as the alt tag, otherwise the shortname
                    alt = ns.unicodeAlt ? ns.convert(unicode) : mappedUnicode[unicode];
                    if (ns.imageType === "png") {
                        if (ns.sprites) {
                            replaceWith = '<span class="emojione-' + unicode.toUpperCase() + '" title="' + mappedUnicode[unicode] + '">' + alt + "</span>";
                        } else {
                            replaceWith = '<img class="emojione" alt="' + alt + '" src="' + ns.imagePathPNG + unicode + ".png" + ns.cacheBustParam + '"/>';
                        }
                    } else {
                        // svg
                        if (ns.sprites) {
                            replaceWith = '<svg class="emojione"><description>' + alt + '</description><use xlink:href="' + ns.imagePathSVGSprites + "#emoji-" + unicode.toUpperCase() + '"></use></svg>';
                        } else {
                            replaceWith = '<img class="emojione" alt="' + alt + '" src="' + ns.imagePathSVG + unicode + ".svg" + ns.cacheBustParam + '"/>';
                        }
                    }
                    return replaceWith;
                }
            });
            return str;
        };
        // super simple loop to replace all unicode emoji to shortnames
        // needs to be improved into one big replacement instead, for performance reasons
        ns.toShort = function(str) {
            // this is really just unicodeToShortname() but I opted for the shorthand name to match toImage()
            for (var shortcode in ns.emojioneList) {
                if (!ns.emojioneList.hasOwnProperty(shortcode)) {
                    continue;
                }
                for (var i = 0, len = ns.emojioneList[shortcode].length; i < len; i++) {
                    var unicode = ns.emojioneList[shortcode][i].toUpperCase();
                    str = ns.replaceAll(str, ns.convert(unicode), shortcode);
                }
            }
            return str;
        };
        // for converting unicode code points and code pairs to their respective characters
        ns.convert = function(unicode) {
            if (unicode.indexOf("-") > -1) {
                var parts = [];
                var s = unicode.split("-");
                for (var i = 0; i < s.length; i++) {
                    var part = parseInt(s[i], 16);
                    if (part >= 65536 && part <= 1114111) {
                        var hi = Math.floor((part - 65536) / 1024) + 55296;
                        var lo = (part - 65536) % 1024 + 56320;
                        part = String.fromCharCode(hi) + String.fromCharCode(lo);
                    } else {
                        part = String.fromCharCode(part);
                    }
                    parts.push(part);
                }
                return parts.join("");
            } else {
                var s = parseInt(unicode, 16);
                if (s >= 65536 && s <= 1114111) {
                    var hi = Math.floor((s - 65536) / 1024) + 55296;
                    var lo = (s - 65536) % 1024 + 56320;
                    return String.fromCharCode(hi) + String.fromCharCode(lo);
                } else {
                    return String.fromCharCode(s);
                }
            }
        };
        ns.escapeHTML = function(string) {
            var escaped = {
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#039;"
            };
            return string.replace(/[&<>"']/g, function(match) {
                return escaped[match];
            });
        };
        ns.unescapeHTML = function(string) {
            var unescaped = {
                "&amp;": "&",
                "&#38;": "&",
                "&#x26;": "&",
                "&lt;": "<",
                "&#60;": "<",
                "&#x3C;": "<",
                "&gt;": ">",
                "&#62;": ">",
                "&#x3E;": ">",
                "&quot;": '"',
                "&#34;": '"',
                "&#x22;": '"',
                "&apos;": "'",
                "&#39;": "'",
                "&#x27;": "'",
                "&#039": "'",
                nbsp: " "
            };
            return string.replace(/&(?:amp|#38|#x26|lt|#60|#x3C|gt|#62|#x3E|apos|#39|#x27|quot|#34|#x22);/gi, function(match) {
                return unescaped[match];
            });
        };
        ns.mapShortToUnicode = function() {
            var new_obj = {};
            for (var shortname in ns.emojioneList) {
                if (!ns.emojioneList.hasOwnProperty(shortname)) {
                    continue;
                }
                for (var i = 0, len = ns.emojioneList[shortname].length; i < len; i++) {
                    new_obj[ns.emojioneList[shortname][i].toUpperCase()] = shortname;
                }
            }
            return new_obj;
        };
        //reverse an object
        ns.objectFlip = function(obj) {
            var key, tmp_obj = {};
            for (key in obj) {
                if (obj.hasOwnProperty(key)) {
                    tmp_obj[obj[key]] = key;
                }
            }
            return tmp_obj;
        };
        ns.escapeRegExp = function(string) {
            return string.replace(/[-[\]{}()*+?.,;:&\\^$|#\s]/g, "\\$&");
        };
        ns.replaceAll = function(string, find, replaceWith) {
            var search = new RegExp("<object[^>]*>.*?</object>|<span[^>]*>.*?</span>|<(?:object|embed|svg|img|div|span|p|a)[^>]*>|(" + find + ")", "gi");
            // callback prevents replacing anything inside of these common html tags as well as between an <object></object> tag
            var replace = function(entire, m1) {
                return typeof m1 === "undefined" || m1 === "" ? entire : replaceWith;
            };
            return string.replace(search, replace);
        };
    })(this.emojione = this.emojione || {});
    if (typeof module === "object") module.exports = this.emojione;
    return this.emojione;
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
 * @info    播放器插件 - 弹幕
 */
define("util/barrage/player-plugin-barrage", [ "core/jquery/1.8.3/jquery", "util/log/log" ], function(require, exports, modules) {
    var $ = require("core/jquery/1.8.3/jquery"), log = require("util/log/log"), player = window.player, barrageTransfer = {}, appBarrage = null;
    // 弹幕设置 barrageSetting
    // data = {
    //  alpha : 0.5,
    //  visible : 0 | 1 //是否显示弹幕狂
    //  size : 28
    // }
    // 发送弹幕 sendBarrage
    // data = {
    //  content : '今天吃饭了吗',
    //  color : '#3399fe'
    // }
    // 播放弹幕 playBarrage
    // data = {
    //  playPoint : 14195739840,
    //  content : '今天吃饭了吗',
    //  userName : 'xxx',
    //  refName : 'live_300156' //vod/live_[cid]
    // }
    // player.onNotification({
    //     header : {
    //         type : "barrageSetting"
    //     },
    //     body : {
    //         data : data
    //     }
    // });
    //弹幕设置 - init之后
    //player.onInit.add(function(){
    player.onRegister("setupbarrage", function(data) {
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
    });
    //初始化
    barrageTransfer.init = function(app, player) {
        log("barrageTransfer init... ", app, player);
        appBarrage = app;
        barrageTransfer.get();
        barrageTransfer.clearbarrage();
        barrageTransfer.setXBSetting();
        barrageTransfer.getXBSetting();
        barrageTransfer.getXBWords();
    };
    //发送弹幕
    barrageTransfer.add = function(databody) {
        log("barrageTransfer add == ", databody);
        player.onNotification({
            header: {
                type: "sendbarrage"
            },
            body: {
                data: databody
            }
        });
    };
    //接收弹幕
    barrageTransfer.get = function() {
        player.onRegister("playbarrage", function(data) {
            log("barrageTransfer playbarrage get == ", data, data.body.data);
            var dataContent = data.body && data.body.data || {};
            appBarrage.add(dataContent);
        });
    };
    //清空弹幕 - 新增需求拖动不处理 - 重新改回来
    barrageTransfer.clearbarrage = function() {
        log("barrageTransfer clearbarrage == ");
        player.onRegister("clearbarrage", function(data) {
            appBarrage.clear();
        });
    };
    //小冰显示与否设置
    barrageTransfer.setXBSetting = function(databody) {
        log("barrageTransfer add == ", databody);
        player.onNotification({
            header: {
                type: "sendbarrage"
            },
            body: {
                data: databody
            }
        });
    };
    //小冰设置xbsettings
    //{ 'type':'xbsettings',    'data' : { 'xbisopen':BarrageConfig.xbisOpen,                   'name':BarrageConfig.xbName}}
    barrageTransfer.getXBSetting = function() {
        player.onRegister("xbsettings", function(data) {
            log("barrageTransfer xbsettings == ", data, data.body.data);
            var dataContent = data.body && data.body.data || {};
            appBarrage.initXBSetting(dataContent);
        });
    };
    //接收小冰说的话
    //{ 'type':'xiaobing',      'data' : 【{ "picurl":xiaobing['picUrl'], "text": xiaobing['text']】。。。}}
    barrageTransfer.getXBWords = function() {
        player.onRegister("xiaobing", function(data) {
            log("barrageTransfer xiaobing == ", data, data.body.data);
            var dataContent = data.body && data.body.data || {};
            appBarrage.addXBWords(dataContent);
        });
    };
    modules.exports = barrageTransfer;
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
