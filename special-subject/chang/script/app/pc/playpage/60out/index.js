/*! 一唱成名 create by ErickSong */
define("app/pc/playpage/60out/index", [ "core/jquery/1.8.3/jquery", "core/underscore/1.8.3/underscore", "../../../../util/vote/vote", "../../../../util/cookie/cookie", "../../../../util/loader/loader", "../../../../util/log/log", "../../../../util/platform/plt", "../../../../util/browser/browser", "../../../../util/net/urlquery", "../../../../util/user/user", "client", "../../../../util/vote/formatVote", "../../../../util/vote/counterTimer", "../../../../util/vote/uniformDate", "../../../../util/Timer/timer", "../../../../util/linkcfg/interfaceurl", "../../../../util/barrage/barrage", "../../../../util/login/login", "../../../../util/user/user-fix", "../../../../util/date/format", "../../../../util/event/event-aggregator", "../../../../util/barrage/emojione", "../../../../util/barrage/player-plugin-barrage", "../../index/common-joinvip", "./speed", "../../canvaslib/zrender", "../../canvaslib/dep/excanvas", "../../canvaslib/tool/util", "../../canvaslib/tool/log", "../../canvaslib/config", "../../canvaslib/tool/guid", "../../canvaslib/Handler", "../../canvaslib/tool/env", "../../canvaslib/tool/event", "../../canvaslib/mixin/Eventful", "../../canvaslib/tool/vector", "../../canvaslib/tool/matrix", "../../canvaslib/Painter", "../../canvaslib/loadingEffect/Base", "../../canvaslib/shape/Text", "../../canvaslib/tool/area", "../../canvaslib/tool/curve", "../../canvaslib/shape/Base", "../../canvaslib/mixin/Transformable", "../../canvaslib/tool/color", "../../canvaslib/shape/Rectangle", "../../canvaslib/shape/Image", "../../canvaslib/Storage", "../../canvaslib/Group", "../../canvaslib/animation/Animation", "../../canvaslib/animation/Clip", "../../canvaslib/animation/easing", "../../canvaslib/shape/Line", "../../canvaslib/shape/util/dashedLineTo", "../../canvaslib/shape/Circle", "../../canvaslib/shape/Ring" ], function(require, exports) {
    var $ = require("core/jquery/1.8.3/jquery");
    var _ = require("core/underscore/1.8.3/underscore");
    var vote = require("../../../../util/vote/vote");
    var formatVote = require("../../../../util/vote/formatVote");
    //var voteMap=require('../../../../util/vote/voteupdate');
    var counter = require("../../../../util/vote/counterTimer");
    var uniformDate = require("../../../../util/vote/uniformDate");
    var timer = require("../../../../util/Timer/timer");
    var loader = require("../../../../util/loader/loader");
    var urls = require("../../../../util/linkcfg/interfaceurl");
    var appBarrage = require("../../../../util/barrage/barrage");
    var cookie = require("../../../../util/cookie/cookie");
    var _ = require("core/underscore/1.8.3/underscore");
    //假数据
    var player = {
        player_id: $.trim($("[name=player_id]").val()),
        stage: $.trim($("[name=stage]").val()),
        scope: $.trim($("[name=scope]").val())
    };
    var DomPlayer = $("#pptv_playpage_box");
    //弹幕
    (function() {
        var BarrageHeight = 0;
        $(".module-playbox-page .playbox").append('<div class="barrage" id="barrage"></div>');
        var hasInited = false;
        var barrageapp = new appBarrage({
            wrapbox: $("#barrage"),
            player: window.player
        });
        require("../../../../util/barrage/player-plugin-barrage").init(barrageapp);
        window.player.onRegister("setupbarrage", function(data) {
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
    //剧场模式
    (function() {
        var isTheatreMode = false;
        var key = "theatremode";
        var DomPlayerSideBar = $("#barrage");
        //剧场模式
        window.player.onRegister("theatre", function(data) {
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
    })();
    //投票配置
    var counterDefaultTread = 10;
    var counterDefaultReward = 60;
    function getCounter(voteid, first, counterDefault) {
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
    //加入vip模块
    require("../../index/common-joinvip");
    //酬金js开始
    //js-vote初始化,votemapupdate
    /* voteMap.init({
        selector:'.js-vote',
        voteAttr:'data-sid',
        prior:'data-prior'
    });*/
    //酬金vote事件
    new vote({
        dom: ".vote-main .js-vote",
        voteAttr: "data-sid",
        afterVote: function(data, dom) {
            if (typeof data.counter != "undefined") {
                var domParent = dom.parent();
                var endCounter = getCounter(dom.attr("data-sid"), false, counterDefaultReward);
                voteAnimate(domParent, endCounter, counterDefaultReward);
                domParent.find("em.ml15").html(addKannma(exceptionCounter(data.counter)));
            } else if (data.errors) {
                //                console.log(data.errors);
                if (data.errors.code == 88) {
                    alert("请休息一会儿再投票哦！");
                } else if (data.errors.code == 91) {
                    alert("投票未开始");
                }
            }
        }
    });
    function exceptionCounter(counter) {
        if (typeof counter == "undefined" || counter == null) {
            return 0;
        } else {
            return counter;
        }
    }
    //锁定投票逻辑
    var rewardObj = $(".vote-wrap .vote-icon.js-vote");
    var rewardId = rewardObj.attr("data-sid");
    var endCounterReward = getCounter(rewardId, true, counterDefaultReward);
    if (endCounterReward != counterDefaultReward) {
        voteAnimate(rewardObj.parent(), endCounterReward);
    }
    //酬金动画
    function voteAnimate(domParent, endCounter, defaultCount, targetTop) {
        var maskDom = domParent.find(".vote-mask");
        var addDom = domParent.find(".vote-add");
        var originTop = addDom.css("marginTop");
        var targetTop = targetTop || -67;
        new counter({
            counter: endCounter,
            init: function() {
                maskDom.show();
                maskDom.text(endCounter);
            },
            update: function() {
                maskDom.text(this.counter);
            },
            finish: function() {
                maskDom.hide();
                maskDom.text("");
            }
        });
        if (endCounter == defaultCount) {
            addDom.css("display", "block").animate({
                marginTop: targetTop,
                opacity: 1
            }, 1e3, function() {
                setTimeout(function() {
                    addDom.fadeOut(function() {
                        addDom.css({
                            marginTop: originTop
                        });
                    });
                }, 1e3);
            });
        }
    }
    //千分位
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
    // 酬金结束
    //获取服务器时间
    var serverOffsetTime = 0;
    var getServerSuccess = false;
    var pageStartTime = new Date().getTime();
    $.ajax({
        url: "http://time.pptv.com?time=" + new Date().getTime(),
        type: "GET",
        dataType: "jsonp",
        cache: true,
        jsonp: "cb",
        success: function(data) {
            var servertime = new Date(data * 1e3);
            getServerSuccess = true;
            serverOffsetTime = servertime.getTime() - new Date().getTime();
            init();
        },
        error: function() {
            init();
        },
        timeout: 1e3
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
    //跑步机开始
    var treadmill = require("./speed");
    var treadmillObj = treadmill.create({
        index: 0,
        lineWidth: 25,
        lineStrokeWidth: 2,
        radius: 100,
        auxilary: true,
        hasCursor: true
    });
    //跑步机绑定投票
    var countDownTread = $(".treadmill-countdown");
    var runCid = window.webcfg.id;
    var totalSpeed = 5;
    var totalDangwei = 35;
    //常规倒计时
    function counterNormal(dom, count, first, originTxt) {
        if (first == true) {
            dom.text(count + "S");
        }
        setTimeout(function() {
            var tempCount = --count;
            dom.text(tempCount + "S");
            if (count != 0) {
                counterNormal(dom, count, false, originTxt);
            } else {
                dom.html(originTxt);
            }
        }, 1e3);
    }
    function nextRequest(nextRequestTime, tempNow) {
        // console.log(nextRequestTime);
        // console.log(tempNow);
        timer({
            startTime: tempNow,
            endTime: nextRequestTime,
            serverOffsetTime: serverOffsetTime,
            callback: function(status, times) {
                if (status == 2) {
                    loader.load("http://chang.pptv.com/api/speed", {
                        cid: runCid
                    }, function(data) {
                        //console.log(data);
                        if (data.err === 0) {
                            var tempSpeed = data.data.speed;
                            $(".treadmill-curSpeed strong").text(tempSpeed);
                            treadmillObj.update(Math.floor(tempSpeed / totalSpeed * totalDangwei));
                            if (data.data.offline_on === false || !data.data.offline_on) {
                                return false;
                            }
                            var nextRequestTime = new Date(data.data.offline_on * 1e3 + 1e3 * 3 + Math.random() * 1e3 * 3);
                            var tempNow = getNow();
                            if (nextRequestTime.getTime() > tempNow.getTime()) {
                                nextRequest(nextRequestTime, tempNow);
                            }
                        }
                    });
                }
            }
        });
    }
    //计票tips
    (function() {
        var $link = $(".treadmill-vote-wrap .js-vote");
        var $tips = $(".treadmill-vote-wrap .tips");
        var showTimer, hideTimer;
        $link.on("mouseenter", function() {
            var obj = $(this);
            if (!obj.hasClass("js-unbegin")) {
                return false;
            }
            if (obj.hasClass("vote-wrap-l")) {
                $tips.css("left", "-16px");
            } else if (obj.hasClass("vote-wrap-r")) {
                $tips.css("left", "124px");
            }
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
    var totalLast = 0;
    var phpCdnRefresh = 30;
    function finishUpdateReward() {
        if (globalRewardInterval != null) {
            clearInterval(globalRewardInterval);
            globalRewardInterval = null;
        }
        loaderReward();
        if (totalLast < 3) {
            totalLast++;
            setTimeout(function() {
                finishUpdateReward();
            }, phpCdnRefresh * 1e3);
        }
    }
    function bindVoteId(data) {
        var domUp = $(".vote-wrap-l");
        var domDown = $(".vote-wrap-r");
        // data.speedUpVoteId=34451;
        // data.slowDownVoteId=34751;
        //$(".treadmill-vote-wrap .js-vote").attr('title','投票未开始');
        domUp.attr("data-sid", data.speedUpVoteId);
        domDown.attr("data-sid", data.slowDownVoteId);
        var domUpCounter = getCounter(data.speedUpVoteId, true, counterDefaultTread);
        var domDownCounter = getCounter(data.slowDownVoteId, true, counterDefaultTread);
        if (domUpCounter != counterDefaultTread) {
            counterNormal(domUp, domUpCounter, true, domUp.html());
        }
        if (domDownCounter != counterDefaultTread) {
            counterNormal(domDown, domDownCounter, true, domDown.html());
        }
        var counterUp = data.speedUpVote.counter ? data.speedUpVote.counter : 0;
        var counterDown = data.slowDownVote.counter ? data.slowDownVote.counter : 0;
        //var tempEnd=new Date(uniformDate(data.endedAt));
        var speedExec = false;
        timer({
            startTime: getNow(),
            endTime: new Date($.trim($("[name=end]").val()) * 1e3),
            serverOffsetTime: serverOffsetTime,
            callback: function(status, times) {
                if (status == 2) {
                    countDownTread.html("00:00:00");
                    $(".treadmill-vote-wrap .js-vote").addClass("disabled").attr("title", "投票已结束");
                    //更新最后的酬金，为了防止cdn，请求3次
                    finishUpdateReward();
                } else if (status == 1) {
                    if (Number(times.hours) < 1 && speedExec == false) {
                        var $votes = $(".treadmill-vote-wrap .js-vote");
                        $votes.removeClass("js-unbegin");
                        $votes.removeClass("disabled").removeAttr("title");
                        speedExec = true;
                        loader.load("http://chang.pptv.com/api/speed", {
                            cid: runCid
                        }, function(data) {
                            if (data.err === 0) {
                                // console.log(data);
                                var tempSpeed = data.data.speed;
                                $(".treadmill-curSpeed strong").text(tempSpeed);
                                treadmillObj.update(Math.floor(tempSpeed / totalSpeed * totalDangwei));
                                //加延迟，在加防穿透时间
                                var nextRequestTime = new Date(data.data.offline_on * 1e3 + 1e3 * 3 + Math.random() * 1e3 * 3);
                                var tempNow = getNow();
                                if (nextRequestTime.getTime() > tempNow.getTime()) {
                                    //   console.log('next');
                                    nextRequest(nextRequestTime, tempNow);
                                }
                            }
                        });
                        countDownTread.html(times.hours + ":" + times.minitues + ":" + times.seconds);
                    } else {
                        countDownTread.html(times.hours + ":" + times.minitues + ":" + times.seconds);
                    }
                }
            }
        });
        new vote({
            dom: ".treadmill-votewrap .js-vote",
            voteAttr: "data-sid",
            beforeVote: function(data, dom) {
                if (dom.data("locked") === true) {
                    return false;
                }
                if (!!dom.hasClass("disabled")) {
                    return false;
                }
                if (/\d/.test($.trim(dom.text())) == true) {
                    return false;
                }
            },
            afterVote: function(data, dom) {
                //console.log(data);
                if (typeof data.counter != "undefined") {
                    var domParent = dom.parents(".treadmill-votewrap");
                    var idx = dom.index();
                    domParent.find(".tread-num").eq(idx).html(exceptionCounter(data.counter));
                    var originTxt = dom.text();
                    var endCounter = getCounter(dom.attr("data-sid"), false, counterDefaultTread);
                    new counter({
                        counter: endCounter,
                        init: function() {
                            dom.text(endCounter + "S");
                            dom.data("locked", true);
                            dom.css("opacity", "0.8");
                        },
                        update: function() {
                            dom.text(this.counter + "S");
                        },
                        finish: function() {
                            dom.text(originTxt);
                            dom.css("opacity", "1");
                            dom.data("locked", false);
                        }
                    });
                } else if (data.errors) {
                    if (data.errors.code == 88) {
                        alert("请休息一会儿再投票哦！");
                    } else if (data.errors.code == 91) {
                        alert("投票未开始");
                    }
                }
            }
        });
    }
    player.__config__ = {
        cdn: true,
        callback: "updatetreadmill"
    };
    var player_id = $("[name=player_id]").val();
    var scope = $("[name=scope]").val();
    var stage = $("[name=stage]").val();
    //请求酬金接口,依旧是假数据
    var rewardObj = {
        stage: stage,
        scope: scope
    };
    rewardObj.__config__ = {
        cdn: true,
        callback: "updateRewardList"
    };
    var moneyDom = $(".vote-main .money");
    function loaderReward() {
        loader.load(urls["interface"]["reward"], rewardObj, function(data) {
            if (data.err == 0) {
                var data = data.data;
                var playerCount = null;
                var totalCount = 0;
                for (var key in data) {
                    totalCount += Number(data[key]);
                    if (key == player_id) {
                        playerCount = data[key];
                    }
                }
                if (playerCount == null) {
                    playerCount = 0;
                }
                if (totalCount == 0) {
                    var percent = 0;
                } else {
                    var percent = Math.round(Number(playerCount) / totalCount * 1e3) / 10;
                }
                if (Number(playerCount) != 0 && percent == 0) {
                    percent = "0.0";
                }
                if (percent === 0) {
                    moneyDom.addClass("nomoney");
                } else {
                    moneyDom.removeClass("nomoney");
                }
                var targetDom = $(".money .bar p");
                $(".vote-main p em").html(addKannma(exceptionCounter(playerCount)));
                targetDom.css("width", percent + "%");
                var tempHtml = '<i class="bl"></i>' + percent + '%<i class="br"></i>';
                targetDom.html(tempHtml);
            }
        });
    }
    var globalRewardInterval = null;
    var freshTime = 45;
    function init() {
        loader.load(urls["interface"]["gettreadmill"], player, function(data) {
            if (data.code == 1) {
                var data = data.data;
                bindVoteId(data);
            }
        });
        loaderReward();
        globalRewardInterval = setInterval(function() {
            loaderReward();
        }, freshTime * 1e3);
    }
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

define("app/pc/playpage/60out/speed", [ "core/jquery/1.8.3/jquery", "app/pc/canvaslib/zrender", "app/pc/canvaslib/dep/excanvas", "app/pc/canvaslib/tool/util", "app/pc/canvaslib/tool/log", "app/pc/canvaslib/config", "app/pc/canvaslib/tool/guid", "app/pc/canvaslib/Handler", "app/pc/canvaslib/tool/env", "app/pc/canvaslib/tool/event", "app/pc/canvaslib/mixin/Eventful", "app/pc/canvaslib/tool/vector", "app/pc/canvaslib/tool/matrix", "app/pc/canvaslib/Painter", "app/pc/canvaslib/loadingEffect/Base", "app/pc/canvaslib/shape/Text", "app/pc/canvaslib/tool/area", "app/pc/canvaslib/tool/curve", "app/pc/canvaslib/shape/Base", "app/pc/canvaslib/mixin/Transformable", "app/pc/canvaslib/tool/color", "app/pc/canvaslib/shape/Rectangle", "app/pc/canvaslib/shape/Image", "app/pc/canvaslib/Storage", "app/pc/canvaslib/Group", "app/pc/canvaslib/animation/Animation", "app/pc/canvaslib/animation/Clip", "app/pc/canvaslib/animation/easing", "app/pc/canvaslib/shape/Line", "app/pc/canvaslib/shape/util/dashedLineTo", "app/pc/canvaslib/shape/Circle", "app/pc/canvaslib/shape/Ring" ], function(require, exports) {
    var $ = require("core/jquery/1.8.3/jquery");
    var zrender = require("app/pc/canvaslib/zrender");
    var Line = require("app/pc/canvaslib/shape/Line");
    var Text = require("app/pc/canvaslib/shape/Text");
    var Circle = require("app/pc/canvaslib/shape/Circle");
    var RingShape = require("app/pc/canvaslib/shape/Ring");
    var Group = require("app/pc/canvaslib/Group");
    function speed(options) {
        var defaults = {
            totalPiece: 35,
            lineWidth: 40,
            lineStrokeWidth: 5,
            lineStrokeActive: "#ff0000",
            lineStrokeBlank: "#dddddd",
            animateOffset: 20,
            originOffset: 200,
            index: 0,
            container: ".zr-speed",
            interpolateOffset: 5,
            offsetAngle: 0,
            offsetY: 0
        };
        this.opt = $.extend({}, defaults, options);
        this.container = $(this.opt.container);
        this.zr = zrender.init(this.container[0]);
        this.index = this.opt.index || 0;
        this.lineArr = [];
        this.isLock = true;
        this.init();
    }
    $.extend(speed.prototype, {
        init: function() {
            var self = this;
            var totalPiece = this.opt.totalPiece;
            var lineW = this.opt.lineWidth;
            var lineStrokeWidth = this.opt.lineStrokeWidth;
            var lineStrokeBlank = this.opt.lineStrokeBlank;
            var lineStrokeActive = this.opt.lineStrokeActive;
            //var hexArr=hexToArr(lineStrokeActive);
            var animateOffset = this.opt.animateOffset;
            var originOffset = this.opt.originOffset;
            var containW = this.container.width();
            var containH = this.container.height();
            var offsetY = this.opt.offsetY;
            var radius = this.opt.radius;
            if (!this.opt.radius) {
                var radius = containW * .4;
            } else if (this.opt.radius > 1) {
                var radius = this.opt.radius;
            } else {
                var radius = this.opt.radius * containW;
            }
            var zr = this.zr;
            var count = 0;
            if (this.index == 0) {
                this.isLock = false;
            }
            //偏移的角度 todo
            //var offsetAngle=this.opt.offsetAngle;
            var runPiece = totalPiece - 1;
            for (var i = 0; i <= runPiece; i++) {
                var xStart, yStart, xEnd, yEnd;
                xStart = -Math.cos(Math.PI / runPiece * i) * radius;
                yStart = -Math.sin(Math.PI / runPiece * i) * radius;
                xEnd = -Math.cos(Math.PI / runPiece * i) * (radius + lineW);
                yEnd = -Math.sin(Math.PI / runPiece * i) * (radius + lineW);
                var tempLine = new Line({
                    style: {
                        xStart: xStart,
                        yStart: yStart,
                        xEnd: xEnd,
                        yEnd: yEnd,
                        lineWidth: lineStrokeWidth,
                        strokeColor: lineStrokeBlank
                    },
                    position: [ containW / 2, containH - lineW / 2 - offsetY ],
                    hoverable: false
                });
                this.lineArr.push(tempLine);
                zr.addShape(tempLine);
                if (i < this.index) {
                    var tempDefer = zr.animate(tempLine, "style");
                    tempDefer.when(originOffset * (i + 1), {
                        strokeColor: lineStrokeBlank
                    }).when(originOffset * (i + 2), {
                        strokeColor: lineStrokeActive
                    }).done(function() {
                        count++;
                        if (count == self.index) {
                            self.isLock = false;
                        }
                    });
                    tempDefer.start();
                }
            }
            if (this.opt.auxilary == true) {
                var auxilaryPiece = 5;
                var tempArr = [ 0, 1, 2, 3, 4, 5 ];
                var fontSize = 13;
                for (var i = 0; i <= auxilaryPiece; i++) {
                    if (i == 1 || i == 2) {
                        var tempX = -Math.cos(Math.PI / auxilaryPiece * i - Math.PI / (totalPiece - 1)) * (radius + lineW + 15);
                        var tempy = -Math.sin(Math.PI / auxilaryPiece * i - Math.PI / (totalPiece - 1)) * (radius + lineW + 15);
                    } else if (i == 3) {
                        var tempX = -Math.cos(Math.PI / auxilaryPiece * i - Math.PI / (totalPiece - 1)) * (radius + lineW + 35);
                        var tempy = -Math.sin(Math.PI / auxilaryPiece * i - Math.PI / (totalPiece - 1)) * (radius + lineW + 10);
                    } else {
                        var tempX = -Math.cos(Math.PI / auxilaryPiece * i) * (radius + lineW + 10);
                        var tempy = -Math.sin(Math.PI / auxilaryPiece * i) * (radius + lineW + 10);
                    }
                    if (i < 3) {
                        var tempColor = "#dddddd";
                    } else {
                        var tempColor = "#ff3333";
                    }
                    //console.log(tempColor);
                    var tempText = new Text({
                        style: {
                            text: tempArr[i],
                            x: tempX,
                            y: tempy,
                            textFont: fontSize + "px Arial",
                            color: tempColor
                        },
                        position: [ containW / 2 - 1, containH - lineW / 2 - offsetY ],
                        hoverable: false
                    });
                    zr.addShape(tempText);
                }
            }
            if (this.opt.hasCursor) {
                var tempGroup;
                this.cursorImage = tempGroup = new Group();
                tempGroup.position[0] = containW / 2;
                tempGroup.position[1] = containH - 88;
                tempGroup.rotation = [ Math.PI / 2, 0, 75 ];
                tempGroup.addChild(new Line({
                    style: {
                        xStart: 0,
                        yStart: 0,
                        xEnd: 0,
                        yEnd: 70,
                        lineWidth: 2,
                        strokeColor: "#ff0000"
                    },
                    hoverable: false
                }));
                tempGroup.addChild(new RingShape({
                    style: {
                        x: 0,
                        y: 75,
                        r: 11,
                        r0: 9,
                        color: "#ff0000",
                        strokeColor: "#ffffff"
                    },
                    hoverable: false
                }));
                tempGroup.addChild(new Circle({
                    style: {
                        x: 0,
                        y: 75,
                        r: 6,
                        color: "#ff0000",
                        brushType: "fill"
                    },
                    hoverable: false
                }));
                zr.addShape(tempGroup);
                this.currentCursor = Math.PI / 2;
            }
            zr.render();
        },
        update: function(index) {
            var index = parseInt(index);
            //变色，速度变小
            if (this.index == index) {
                return false;
            }
            if (this.isLock == true) {
                return false;
            }
            var self = this;
            var originOffset = this.opt.originOffset;
            var zr = this.zr;
            var lineStrokeBlank = this.opt.lineStrokeBlank;
            var lineStrokeActive = this.opt.lineStrokeActive;
            var animateOffset = this.opt.animateOffset;
            //var hexArr=hexToArr(lineStrokeBlank);
            if (index < this.index && index >= 0) {
                self.isLock = true;
                var tempArr = this.lineArr.slice(index, this.index);
                var count = tempArr.length;
                var finishCount = 0;
                for (var i = count - 1; i >= 0; i--) {
                    var tempDefer = zr.animate(tempArr[i], "style");
                    tempDefer.when(originOffset * (count - i + 1), {
                        strokeColor: lineStrokeActive
                    }).when(originOffset * (count - i + 2), {
                        strokeColor: lineStrokeBlank
                    }).done(function() {
                        finishCount++;
                        if (finishCount == count) {
                            self.isLock = false;
                        }
                    });
                    tempDefer.start();
                }
                if (!!this.cursorImage) {
                    var tempCursorDefer = zr.animate(this.cursorImage);
                    var self = this;
                    if (index == 0) {
                        var tempCursor = Math.PI / 2;
                    } else {
                        var tempCursor = this.currentCursor + Math.PI * (count / (this.opt.totalPiece - 1));
                    }
                    tempCursorDefer.when(originOffset * (count + 2), {
                        rotation: [ tempCursor, 0, 75 ]
                    }).done(function() {
                        self.currentCursor = tempCursor;
                    });
                    tempCursorDefer.start();
                }
                this.index = index;
            } else if (index > this.index && index <= this.opt.totalPiece) {
                self.isLock = true;
                var tempArr = this.lineArr.slice(this.index, index);
                var count = tempArr.length;
                var finishCount = 0;
                for (var i = 0; i < count; i++) {
                    var tempDefer = zr.animate(tempArr[i], "style");
                    tempDefer.when(originOffset * (i + 1), {
                        strokeColor: lineStrokeBlank
                    }).when(originOffset * (i + 2), {
                        strokeColor: lineStrokeActive
                    }).done(function() {
                        finishCount++;
                        if (finishCount == count) {
                            self.isLock = false;
                        }
                    });
                    tempDefer.start();
                }
                if (!!this.cursorImage) {
                    var tempCursorDefer = zr.animate(this.cursorImage);
                    var self = this;
                    if (index == this.opt.totalPiece) {
                        var tempCursor = -Math.PI / 2;
                    } else if (index == 1) {
                        var tempCursor = Math.PI / 2;
                    } else {
                        if (this.index == 0) {
                            var tempCursor = this.currentCursor - Math.PI * ((count - 1) / (this.opt.totalPiece - 1));
                        } else {
                            var tempCursor = this.currentCursor - Math.PI * (count / (this.opt.totalPiece - 1));
                        }
                    }
                    tempCursorDefer.when(originOffset * (count + 2), {
                        rotation: [ tempCursor, 0, 75 ]
                    }).done(function() {
                        self.currentCursor = tempCursor;
                    });
                    tempCursorDefer.start();
                }
                this.index = index;
            }
        }
    });
    exports.create = function(options) {
        var speedObj = new speed(options);
        return speedObj;
    };
});

define("app/pc/canvaslib/zrender", [ "app/pc/canvaslib/dep/excanvas", "app/pc/canvaslib/tool/util", "app/pc/canvaslib/tool/log", "app/pc/canvaslib/config", "app/pc/canvaslib/tool/guid", "app/pc/canvaslib/Handler", "app/pc/canvaslib/tool/env", "app/pc/canvaslib/tool/event", "app/pc/canvaslib/mixin/Eventful", "app/pc/canvaslib/tool/vector", "app/pc/canvaslib/tool/matrix", "app/pc/canvaslib/Painter", "app/pc/canvaslib/loadingEffect/Base", "app/pc/canvaslib/shape/Text", "app/pc/canvaslib/tool/area", "app/pc/canvaslib/tool/curve", "app/pc/canvaslib/shape/Base", "app/pc/canvaslib/mixin/Transformable", "app/pc/canvaslib/tool/color", "app/pc/canvaslib/shape/Rectangle", "app/pc/canvaslib/shape/Image", "app/pc/canvaslib/Storage", "app/pc/canvaslib/Group", "app/pc/canvaslib/animation/Animation", "app/pc/canvaslib/animation/Clip", "app/pc/canvaslib/animation/easing" ], function(require, exports, module) {
    /*!
 * ZRender, a high performance canvas library.
 *  
 * Copyright (c) 2013, Baidu Inc.
 * All rights reserved.
 * 
 * LICENSE
 * https://github.com/ecomfe/zrender/blob/master/LICENSE.txt
 */
    /*
         * HTML5 Canvas for Internet Explorer!
         * Modern browsers like Firefox, Safari, Chrome and Opera support
         * the HTML5 canvas tag to allow 2D command-based drawing.
         * ExplorerCanvas brings the same functionality to Internet Explorer.
         * To use, web developers only need to include a single script tag
         * in their existing web pages.
         *
         * https://code.google.com/p/explorercanvas/
         * http://explorercanvas.googlecode.com/svn/trunk/excanvas.js
         */
    // 核心代码会生成一个全局变量 G_vmlCanvasManager，模块改造后借用于快速判断canvas支持
    require("app/pc/canvaslib/dep/excanvas");
    var util = require("app/pc/canvaslib/tool/util");
    var log = require("app/pc/canvaslib/tool/log");
    var guid = require("app/pc/canvaslib/tool/guid");
    var Handler = require("app/pc/canvaslib/Handler");
    var Painter = require("app/pc/canvaslib/Painter");
    var Storage = require("app/pc/canvaslib/Storage");
    var Animation = require("app/pc/canvaslib/animation/Animation");
    var _instances = {};
    // ZRender实例map索引
    /**
         * @exports zrender
         * @author Kener (@Kener-林峰, kener.linfeng@gmail.com)
         *         pissang (https://www.github.com/pissang)
         */
    var zrender = {};
    /**
         * @type {string}
         */
    zrender.version = "2.0.6";
    /**
         * 创建zrender实例
         *
         * @param {HTMLElement} dom 绘图容器
         * @return {module:zrender~ZRender} ZRender实例
         */
    // 不让外部直接new ZRender实例，为啥？
    // 不为啥，提供全局可控同时减少全局污染和降低命名冲突的风险！
    zrender.init = function(dom) {
        var zr = new ZRender(guid(), dom);
        _instances[zr.id] = zr;
        return zr;
    };
    /**
         * zrender实例销毁
         * @param {module:zrender~ZRender} zr ZRender对象，不传则销毁全部
         */
    // 在_instances里的索引也会删除了
    // 管生就得管死，可以通过zrender.dispose(zr)销毁指定ZRender实例
    // 当然也可以直接zr.dispose()自己销毁
    zrender.dispose = function(zr) {
        if (zr) {
            zr.dispose();
        } else {
            for (var key in _instances) {
                _instances[key].dispose();
            }
            _instances = {};
        }
        return zrender;
    };
    /**
         * 获取zrender实例
         * @param {string} id ZRender对象索引
         * @return {module:zrender~ZRender}
         */
    zrender.getInstance = function(id) {
        return _instances[id];
    };
    /**
         * 删除zrender实例，ZRender实例dispose时会调用，
         * 删除后getInstance则返回undefined
         * ps: 仅是删除，删除的实例不代表已经dispose了~~
         *     这是一个摆脱全局zrender.dispose()自动销毁的后门，
         *     take care of yourself~
         *
         * @param {string} id ZRender对象索引
         */
    zrender.delInstance = function(id) {
        delete _instances[id];
        return zrender;
    };
    function getFrameCallback(zrInstance) {
        return function() {
            var animatingElements = zrInstance.animatingElements;
            for (var i = 0, l = animatingElements.length; i < l; i++) {
                zrInstance.storage.mod(animatingElements[i].id);
            }
            if (animatingElements.length || zrInstance._needsRefreshNextFrame) {
                zrInstance.refresh();
            }
        };
    }
    /**
         * ZRender接口类，对外可用的所有接口都在这里
         * 非get接口统一返回支持链式调用
         *
         * @constructor
         * @alias module:zrender~ZRender
         * @param {string} id 唯一标识
         * @param {HTMLElement} dom dom对象，不帮你做document.getElementById
         * @return {ZRender} ZRender实例
         */
    var ZRender = function(id, dom) {
        /**
             * 实例 id
             * @type {string}
             */
        this.id = id;
        this.env = require("app/pc/canvaslib/tool/env");
        this.storage = new Storage();
        this.painter = new Painter(dom, this.storage);
        this.handler = new Handler(dom, this.storage, this.painter);
        // 动画控制
        this.animatingElements = [];
        /**
             * @type {module:zrender/animation/Animation}
             */
        this.animation = new Animation({
            stage: {
                update: getFrameCallback(this)
            }
        });
        this.animation.start();
        var self = this;
        this.painter.refreshNextFrame = function() {
            self.refreshNextFrame();
        };
        this._needsRefreshNextFrame = false;
    };
    /**
         * 获取实例唯一标识
         * @return {string}
         */
    ZRender.prototype.getId = function() {
        return this.id;
    };
    /**
         * 添加图形形状到根节点
         * 
         * @param {module:zrender/shape/Base} shape 形状对象，可用属性全集，详见各shape
         */
    ZRender.prototype.addShape = function(shape) {
        this.storage.addRoot(shape);
        return this;
    };
    /**
         * 添加组到根节点
         *
         * @param {module:zrender/Group} group
         */
    ZRender.prototype.addGroup = function(group) {
        this.storage.addRoot(group);
        return this;
    };
    /**
         * 从根节点删除图形形状
         * 
         * @param {string} shapeId 形状对象唯一标识
         */
    ZRender.prototype.delShape = function(shapeId) {
        this.storage.delRoot(shapeId);
        return this;
    };
    /**
         * 从根节点删除组
         * 
         * @param {string} groupId
         */
    ZRender.prototype.delGroup = function(groupId) {
        this.storage.delRoot(groupId);
        return this;
    };
    /**
         * 修改图形形状
         * 
         * @param {string} shapeId 形状对象唯一标识
         * @param {Object} shape 形状对象
         */
    ZRender.prototype.modShape = function(shapeId, shape) {
        this.storage.mod(shapeId, shape);
        return this;
    };
    /**
         * 修改组
         * 
         * @param {string} groupId
         * @param {Object} group
         */
    ZRender.prototype.modGroup = function(groupId, group) {
        this.storage.mod(groupId, group);
        return this;
    };
    /**
         * 修改指定zlevel的绘制配置项
         * 
         * @param {string} zLevel
         * @param {Object} config 配置对象
         * @param {string} [config.clearColor=0] 每次清空画布的颜色
         * @param {string} [config.motionBlur=false] 是否开启动态模糊
         * @param {number} [config.lastFrameAlpha=0.7]
         *                 在开启动态模糊的时候使用，与上一帧混合的alpha值，值越大尾迹越明显
         * @param {Array.<number>} [config.position] 层的平移
         * @param {Array.<number>} [config.rotation] 层的旋转
         * @param {Array.<number>} [config.scale] 层的缩放
         * @param {boolean} [config.zoomable=false] 层是否支持鼠标缩放操作
         * @param {boolean} [config.panable=false] 层是否支持鼠标平移操作
         */
    ZRender.prototype.modLayer = function(zLevel, config) {
        this.painter.modLayer(zLevel, config);
        return this;
    };
    /**
         * 添加额外高亮层显示，仅提供添加方法，每次刷新后高亮层图形均被清空
         * 
         * @param {Object} shape 形状对象
         */
    ZRender.prototype.addHoverShape = function(shape) {
        this.storage.addHover(shape);
        return this;
    };
    /**
         * 渲染
         * 
         * @param {Function} callback  渲染结束后回调函数
         */
    ZRender.prototype.render = function(callback) {
        this.painter.render(callback);
        this._needsRefreshNextFrame = false;
        return this;
    };
    /**
         * 视图更新
         * 
         * @param {Function} callback  视图更新后回调函数
         */
    ZRender.prototype.refresh = function(callback) {
        this.painter.refresh(callback);
        this._needsRefreshNextFrame = false;
        return this;
    };
    /**
         * 标记视图在浏览器下一帧需要绘制
         */
    ZRender.prototype.refreshNextFrame = function() {
        this._needsRefreshNextFrame = true;
        return this;
    };
    /**
         * 绘制高亮层
         * @param {Function} callback  视图更新后回调函数
         */
    ZRender.prototype.refreshHover = function(callback) {
        this.painter.refreshHover(callback);
        return this;
    };
    /**
         * 视图更新
         * 
         * @param {Array.<module:zrender/shape/Base>} shapeList 需要更新的图形列表
         * @param {Function} callback  视图更新后回调函数
         */
    ZRender.prototype.refreshShapes = function(shapeList, callback) {
        this.painter.refreshShapes(shapeList, callback);
        return this;
    };
    /**
         * 调整视图大小
         */
    ZRender.prototype.resize = function() {
        this.painter.resize();
        return this;
    };
    /**
         * 动画
         * 
         * @param {string|module:zrender/Group|module:zrender/shape/Base} el 动画对象
         * @param {string} path 需要添加动画的属性获取路径，可以通过a.b.c来获取深层的属性
         * @param {boolean} [loop] 动画是否循环
         * @return {module:zrender/animation/Animation~Animator}
         * @example:
         *     zr.animate(circle.id, 'style', false)
         *         .when(1000, {x: 10} )
         *         .done(function(){ // Animation done })
         *         .start()
         */
    ZRender.prototype.animate = function(el, path, loop) {
        if (typeof el === "string") {
            el = this.storage.get(el);
        }
        if (el) {
            var target;
            if (path) {
                var pathSplitted = path.split(".");
                var prop = el;
                for (var i = 0, l = pathSplitted.length; i < l; i++) {
                    if (!prop) {
                        continue;
                    }
                    prop = prop[pathSplitted[i]];
                }
                if (prop) {
                    target = prop;
                }
            } else {
                target = el;
            }
            if (!target) {
                log('Property "' + path + '" is not existed in element ' + el.id);
                return;
            }
            var animatingElements = this.animatingElements;
            if (typeof el.__aniCount === "undefined") {
                // 正在进行的动画记数
                el.__aniCount = 0;
            }
            if (el.__aniCount === 0) {
                animatingElements.push(el);
            }
            el.__aniCount++;
            return this.animation.animate(target, {
                loop: loop
            }).done(function() {
                el.__aniCount--;
                if (el.__aniCount === 0) {
                    // 从animatingElements里移除
                    var idx = util.indexOf(animatingElements, el);
                    animatingElements.splice(idx, 1);
                }
            });
        } else {
            log("Element not existed");
        }
    };
    /**
         * 停止所有动画
         */
    ZRender.prototype.clearAnimation = function() {
        this.animation.clear();
    };
    /**
         * loading显示
         * 
         * @param {Object=} loadingEffect loading效果对象
         */
    ZRender.prototype.showLoading = function(loadingEffect) {
        this.painter.showLoading(loadingEffect);
        return this;
    };
    /**
         * loading结束
         */
    ZRender.prototype.hideLoading = function() {
        this.painter.hideLoading();
        return this;
    };
    /**
         * 获取视图宽度
         */
    ZRender.prototype.getWidth = function() {
        return this.painter.getWidth();
    };
    /**
         * 获取视图高度
         */
    ZRender.prototype.getHeight = function() {
        return this.painter.getHeight();
    };
    /**
         * 图像导出
         * @param {string} type
         * @param {string} [backgroundColor='#fff'] 背景色
         * @return {string} 图片的Base64 url
         */
    ZRender.prototype.toDataURL = function(type, backgroundColor, args) {
        return this.painter.toDataURL(type, backgroundColor, args);
    };
    /**
         * 将常规shape转成image shape
         * @param {module:zrender/shape/Base} e
         * @param {number} width
         * @param {number} height
         */
    ZRender.prototype.shapeToImage = function(e, width, height) {
        var id = guid();
        return this.painter.shapeToImage(id, e, width, height);
    };
    /**
         * 事件绑定
         * 
         * @param {string} eventName 事件名称
         * @param {Function} eventHandler 响应函数
         */
    ZRender.prototype.on = function(eventName, eventHandler) {
        this.handler.on(eventName, eventHandler);
        return this;
    };
    /**
         * 事件解绑定，参数为空则解绑所有自定义事件
         * 
         * @param {string} eventName 事件名称
         * @param {Function} eventHandler 响应函数
         */
    ZRender.prototype.un = function(eventName, eventHandler) {
        this.handler.un(eventName, eventHandler);
        return this;
    };
    /**
         * 事件触发
         * 
         * @param {string} eventName 事件名称，resize，hover，drag，etc
         * @param {event=} event event dom事件对象
         */
    ZRender.prototype.trigger = function(eventName, event) {
        this.handler.trigger(eventName, event);
        return this;
    };
    /**
         * 清除当前ZRender下所有类图的数据和显示，clear后MVC和已绑定事件均还存在在，ZRender可用
         */
    ZRender.prototype.clear = function() {
        this.storage.delRoot();
        this.painter.clear();
        return this;
    };
    /**
         * 释放当前ZR实例（删除包括dom，数据、显示和事件绑定），dispose后ZR不可用
         */
    ZRender.prototype.dispose = function() {
        this.animation.stop();
        this.clear();
        this.storage.dispose();
        this.painter.dispose();
        this.handler.dispose();
        this.animation = this.animatingElements = this.storage = this.painter = this.handler = null;
        // 释放后告诉全局删除对自己的索引，没想到啥好方法
        zrender.delInstance(this.id);
    };
    module.exports = zrender;
});

define("app/pc/canvaslib/dep/excanvas", [], function(require, exports, module) {
    // Copyright 2006 Google Inc.
    //
    // Licensed under the Apache License, Version 2.0 (the "License");
    // you may not use this file except in compliance with the License.
    // You may obtain a copy of the License at
    //
    //   http://www.apache.org/licenses/LICENSE-2.0
    //
    // Unless required by applicable law or agreed to in writing, software
    // distributed under the License is distributed on an "AS IS" BASIS,
    // WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
    // See the License for the specific language governing permissions and
    // limitations under the License.
    // Known Issues:
    //
    // * Patterns only support repeat.
    // * Radial gradient are not implemented. The VML version of these look very
    //   different from the canvas one.
    // * Clipping paths are not implemented.
    // * Coordsize. The width and height attribute have higher priority than the
    //   width and height style values which isn't correct.
    // * Painting mode isn't implemented.
    // * Canvas width/height should is using content-box by default. IE in
    //   Quirks mode will draw the canvas using border-box. Either change your
    //   doctype to HTML5
    //   (http://www.whatwg.org/specs/web-apps/current-work/#the-doctype)
    //   or use Box Sizing Behavior from WebFX
    //   (http://webfx.eae.net/dhtml/boxsizing/boxsizing.html)
    // * Non uniform scaling does not correctly scale strokes.
    // * Optimize. There is always room for speed improvements.
    // AMD by kener.linfeng@gmail.com
    // Only add this code if we do not already have a canvas implementation
    if (!document.createElement("canvas").getContext) {
        (function() {
            // alias some functions to make (compiled) code shorter
            var m = Math;
            var mr = m.round;
            var ms = m.sin;
            var mc = m.cos;
            var abs = m.abs;
            var sqrt = m.sqrt;
            // this is used for sub pixel precision
            var Z = 10;
            var Z2 = Z / 2;
            var IE_VERSION = +navigator.userAgent.match(/MSIE ([\d.]+)?/)[1];
            /**
   * This funtion is assigned to the <canvas> elements as element.getContext().
   * @this {HTMLElement}
   * @return {CanvasRenderingContext2D_}
   */
            function getContext() {
                return this.context_ || (this.context_ = new CanvasRenderingContext2D_(this));
            }
            var slice = Array.prototype.slice;
            /**
   * Binds a function to an object. The returned function will always use the
   * passed in {@code obj} as {@code this}.
   *
   * Example:
   *
   *   g = bind(f, obj, a, b)
   *   g(c, d) // will do f.call(obj, a, b, c, d)
   *
   * @param {Function} f The function to bind the object to
   * @param {Object} obj The object that should act as this when the function
   *     is called
   * @param {*} var_args Rest arguments that will be used as the initial
   *     arguments when the function is called
   * @return {Function} A new function that has bound this
   */
            function bind(f, obj, var_args) {
                var a = slice.call(arguments, 2);
                return function() {
                    return f.apply(obj, a.concat(slice.call(arguments)));
                };
            }
            function encodeHtmlAttribute(s) {
                return String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;");
            }
            function addNamespace(doc, prefix, urn) {
                if (!doc.namespaces[prefix]) {
                    doc.namespaces.add(prefix, urn, "#default#VML");
                }
            }
            function addNamespacesAndStylesheet(doc) {
                addNamespace(doc, "g_vml_", "urn:schemas-microsoft-com:vml");
                addNamespace(doc, "g_o_", "urn:schemas-microsoft-com:office:office");
                // Setup default CSS.  Only add one style sheet per document
                if (!doc.styleSheets["ex_canvas_"]) {
                    var ss = doc.createStyleSheet();
                    ss.owningElement.id = "ex_canvas_";
                    ss.cssText = "canvas{display:inline-block;overflow:hidden;" + // default size is 300x150 in Gecko and Opera
                    "text-align:left;width:300px;height:150px}";
                }
            }
            // Add namespaces and stylesheet at startup.
            addNamespacesAndStylesheet(document);
            var G_vmlCanvasManager_ = {
                init: function(opt_doc) {
                    var doc = opt_doc || document;
                    // Create a dummy element so that IE will allow canvas elements to be
                    // recognized.
                    doc.createElement("canvas");
                    doc.attachEvent("onreadystatechange", bind(this.init_, this, doc));
                },
                init_: function(doc) {
                    // find all canvas elements
                    var els = doc.getElementsByTagName("canvas");
                    for (var i = 0; i < els.length; i++) {
                        this.initElement(els[i]);
                    }
                },
                /**
     * Public initializes a canvas element so that it can be used as canvas
     * element from now on. This is called automatically before the page is
     * loaded but if you are creating elements using createElement you need to
     * make sure this is called on the element.
     * @param {HTMLElement} el The canvas element to initialize.
     * @return {HTMLElement} the element that was created.
     */
                initElement: function(el) {
                    if (!el.getContext) {
                        el.getContext = getContext;
                        // Add namespaces and stylesheet to document of the element.
                        addNamespacesAndStylesheet(el.ownerDocument);
                        // Remove fallback content. There is no way to hide text nodes so we
                        // just remove all childNodes. We could hide all elements and remove
                        // text nodes but who really cares about the fallback content.
                        el.innerHTML = "";
                        // do not use inline function because that will leak memory
                        el.attachEvent("onpropertychange", onPropertyChange);
                        el.attachEvent("onresize", onResize);
                        var attrs = el.attributes;
                        if (attrs.width && attrs.width.specified) {
                            // TODO: use runtimeStyle and coordsize
                            // el.getContext().setWidth_(attrs.width.nodeValue);
                            el.style.width = attrs.width.nodeValue + "px";
                        } else {
                            el.width = el.clientWidth;
                        }
                        if (attrs.height && attrs.height.specified) {
                            // TODO: use runtimeStyle and coordsize
                            // el.getContext().setHeight_(attrs.height.nodeValue);
                            el.style.height = attrs.height.nodeValue + "px";
                        } else {
                            el.height = el.clientHeight;
                        }
                    }
                    return el;
                }
            };
            function onPropertyChange(e) {
                var el = e.srcElement;
                switch (e.propertyName) {
                  case "width":
                    el.getContext().clearRect();
                    el.style.width = el.attributes.width.nodeValue + "px";
                    // In IE8 this does not trigger onresize.
                    el.firstChild.style.width = el.clientWidth + "px";
                    break;

                  case "height":
                    el.getContext().clearRect();
                    el.style.height = el.attributes.height.nodeValue + "px";
                    el.firstChild.style.height = el.clientHeight + "px";
                    break;
                }
            }
            function onResize(e) {
                var el = e.srcElement;
                if (el.firstChild) {
                    el.firstChild.style.width = el.clientWidth + "px";
                    el.firstChild.style.height = el.clientHeight + "px";
                }
            }
            G_vmlCanvasManager_.init();
            // precompute "00" to "FF"
            var decToHex = [];
            for (var i = 0; i < 16; i++) {
                for (var j = 0; j < 16; j++) {
                    decToHex[i * 16 + j] = i.toString(16) + j.toString(16);
                }
            }
            function createMatrixIdentity() {
                return [ [ 1, 0, 0 ], [ 0, 1, 0 ], [ 0, 0, 1 ] ];
            }
            function matrixMultiply(m1, m2) {
                var result = createMatrixIdentity();
                for (var x = 0; x < 3; x++) {
                    for (var y = 0; y < 3; y++) {
                        var sum = 0;
                        for (var z = 0; z < 3; z++) {
                            sum += m1[x][z] * m2[z][y];
                        }
                        result[x][y] = sum;
                    }
                }
                return result;
            }
            function copyState(o1, o2) {
                o2.fillStyle = o1.fillStyle;
                o2.lineCap = o1.lineCap;
                o2.lineJoin = o1.lineJoin;
                o2.lineWidth = o1.lineWidth;
                o2.miterLimit = o1.miterLimit;
                o2.shadowBlur = o1.shadowBlur;
                o2.shadowColor = o1.shadowColor;
                o2.shadowOffsetX = o1.shadowOffsetX;
                o2.shadowOffsetY = o1.shadowOffsetY;
                o2.strokeStyle = o1.strokeStyle;
                o2.globalAlpha = o1.globalAlpha;
                o2.font = o1.font;
                o2.textAlign = o1.textAlign;
                o2.textBaseline = o1.textBaseline;
                o2.scaleX_ = o1.scaleX_;
                o2.scaleY_ = o1.scaleY_;
                o2.lineScale_ = o1.lineScale_;
            }
            var colorData = {
                aliceblue: "#F0F8FF",
                antiquewhite: "#FAEBD7",
                aquamarine: "#7FFFD4",
                azure: "#F0FFFF",
                beige: "#F5F5DC",
                bisque: "#FFE4C4",
                black: "#000000",
                blanchedalmond: "#FFEBCD",
                blueviolet: "#8A2BE2",
                brown: "#A52A2A",
                burlywood: "#DEB887",
                cadetblue: "#5F9EA0",
                chartreuse: "#7FFF00",
                chocolate: "#D2691E",
                coral: "#FF7F50",
                cornflowerblue: "#6495ED",
                cornsilk: "#FFF8DC",
                crimson: "#DC143C",
                cyan: "#00FFFF",
                darkblue: "#00008B",
                darkcyan: "#008B8B",
                darkgoldenrod: "#B8860B",
                darkgray: "#A9A9A9",
                darkgreen: "#006400",
                darkgrey: "#A9A9A9",
                darkkhaki: "#BDB76B",
                darkmagenta: "#8B008B",
                darkolivegreen: "#556B2F",
                darkorange: "#FF8C00",
                darkorchid: "#9932CC",
                darkred: "#8B0000",
                darksalmon: "#E9967A",
                darkseagreen: "#8FBC8F",
                darkslateblue: "#483D8B",
                darkslategray: "#2F4F4F",
                darkslategrey: "#2F4F4F",
                darkturquoise: "#00CED1",
                darkviolet: "#9400D3",
                deeppink: "#FF1493",
                deepskyblue: "#00BFFF",
                dimgray: "#696969",
                dimgrey: "#696969",
                dodgerblue: "#1E90FF",
                firebrick: "#B22222",
                floralwhite: "#FFFAF0",
                forestgreen: "#228B22",
                gainsboro: "#DCDCDC",
                ghostwhite: "#F8F8FF",
                gold: "#FFD700",
                goldenrod: "#DAA520",
                grey: "#808080",
                greenyellow: "#ADFF2F",
                honeydew: "#F0FFF0",
                hotpink: "#FF69B4",
                indianred: "#CD5C5C",
                indigo: "#4B0082",
                ivory: "#FFFFF0",
                khaki: "#F0E68C",
                lavender: "#E6E6FA",
                lavenderblush: "#FFF0F5",
                lawngreen: "#7CFC00",
                lemonchiffon: "#FFFACD",
                lightblue: "#ADD8E6",
                lightcoral: "#F08080",
                lightcyan: "#E0FFFF",
                lightgoldenrodyellow: "#FAFAD2",
                lightgreen: "#90EE90",
                lightgrey: "#D3D3D3",
                lightpink: "#FFB6C1",
                lightsalmon: "#FFA07A",
                lightseagreen: "#20B2AA",
                lightskyblue: "#87CEFA",
                lightslategray: "#778899",
                lightslategrey: "#778899",
                lightsteelblue: "#B0C4DE",
                lightyellow: "#FFFFE0",
                limegreen: "#32CD32",
                linen: "#FAF0E6",
                magenta: "#FF00FF",
                mediumaquamarine: "#66CDAA",
                mediumblue: "#0000CD",
                mediumorchid: "#BA55D3",
                mediumpurple: "#9370DB",
                mediumseagreen: "#3CB371",
                mediumslateblue: "#7B68EE",
                mediumspringgreen: "#00FA9A",
                mediumturquoise: "#48D1CC",
                mediumvioletred: "#C71585",
                midnightblue: "#191970",
                mintcream: "#F5FFFA",
                mistyrose: "#FFE4E1",
                moccasin: "#FFE4B5",
                navajowhite: "#FFDEAD",
                oldlace: "#FDF5E6",
                olivedrab: "#6B8E23",
                orange: "#FFA500",
                orangered: "#FF4500",
                orchid: "#DA70D6",
                palegoldenrod: "#EEE8AA",
                palegreen: "#98FB98",
                paleturquoise: "#AFEEEE",
                palevioletred: "#DB7093",
                papayawhip: "#FFEFD5",
                peachpuff: "#FFDAB9",
                peru: "#CD853F",
                pink: "#FFC0CB",
                plum: "#DDA0DD",
                powderblue: "#B0E0E6",
                rosybrown: "#BC8F8F",
                royalblue: "#4169E1",
                saddlebrown: "#8B4513",
                salmon: "#FA8072",
                sandybrown: "#F4A460",
                seagreen: "#2E8B57",
                seashell: "#FFF5EE",
                sienna: "#A0522D",
                skyblue: "#87CEEB",
                slateblue: "#6A5ACD",
                slategray: "#708090",
                slategrey: "#708090",
                snow: "#FFFAFA",
                springgreen: "#00FF7F",
                steelblue: "#4682B4",
                tan: "#D2B48C",
                thistle: "#D8BFD8",
                tomato: "#FF6347",
                turquoise: "#40E0D0",
                violet: "#EE82EE",
                wheat: "#F5DEB3",
                whitesmoke: "#F5F5F5",
                yellowgreen: "#9ACD32"
            };
            function getRgbHslContent(styleString) {
                var start = styleString.indexOf("(", 3);
                var end = styleString.indexOf(")", start + 1);
                var parts = styleString.substring(start + 1, end).split(",");
                // add alpha if needed
                if (parts.length != 4 || styleString.charAt(3) != "a") {
                    parts[3] = 1;
                }
                return parts;
            }
            function percent(s) {
                return parseFloat(s) / 100;
            }
            function clamp(v, min, max) {
                return Math.min(max, Math.max(min, v));
            }
            function hslToRgb(parts) {
                var r, g, b, h, s, l;
                h = parseFloat(parts[0]) / 360 % 360;
                if (h < 0) h++;
                s = clamp(percent(parts[1]), 0, 1);
                l = clamp(percent(parts[2]), 0, 1);
                if (s == 0) {
                    r = g = b = l;
                } else {
                    var q = l < .5 ? l * (1 + s) : l + s - l * s;
                    var p = 2 * l - q;
                    r = hueToRgb(p, q, h + 1 / 3);
                    g = hueToRgb(p, q, h);
                    b = hueToRgb(p, q, h - 1 / 3);
                }
                return "#" + decToHex[Math.floor(r * 255)] + decToHex[Math.floor(g * 255)] + decToHex[Math.floor(b * 255)];
            }
            function hueToRgb(m1, m2, h) {
                if (h < 0) h++;
                if (h > 1) h--;
                if (6 * h < 1) return m1 + (m2 - m1) * 6 * h; else if (2 * h < 1) return m2; else if (3 * h < 2) return m1 + (m2 - m1) * (2 / 3 - h) * 6; else return m1;
            }
            var processStyleCache = {};
            function processStyle(styleString) {
                if (styleString in processStyleCache) {
                    return processStyleCache[styleString];
                }
                var str, alpha = 1;
                styleString = String(styleString);
                if (styleString.charAt(0) == "#") {
                    str = styleString;
                } else if (/^rgb/.test(styleString)) {
                    var parts = getRgbHslContent(styleString);
                    var str = "#", n;
                    for (var i = 0; i < 3; i++) {
                        if (parts[i].indexOf("%") != -1) {
                            n = Math.floor(percent(parts[i]) * 255);
                        } else {
                            n = +parts[i];
                        }
                        str += decToHex[clamp(n, 0, 255)];
                    }
                    alpha = +parts[3];
                } else if (/^hsl/.test(styleString)) {
                    var parts = getRgbHslContent(styleString);
                    str = hslToRgb(parts);
                    alpha = parts[3];
                } else {
                    str = colorData[styleString] || styleString;
                }
                return processStyleCache[styleString] = {
                    color: str,
                    alpha: alpha
                };
            }
            var DEFAULT_STYLE = {
                style: "normal",
                variant: "normal",
                weight: "normal",
                size: 12,
                //10
                family: "微软雅黑"
            };
            // Internal text style cache
            var fontStyleCache = {};
            function processFontStyle(styleString) {
                if (fontStyleCache[styleString]) {
                    return fontStyleCache[styleString];
                }
                var el = document.createElement("div");
                var style = el.style;
                var fontFamily;
                try {
                    style.font = styleString;
                    fontFamily = style.fontFamily.split(",")[0];
                } catch (ex) {}
                return fontStyleCache[styleString] = {
                    style: style.fontStyle || DEFAULT_STYLE.style,
                    variant: style.fontVariant || DEFAULT_STYLE.variant,
                    weight: style.fontWeight || DEFAULT_STYLE.weight,
                    size: style.fontSize || DEFAULT_STYLE.size,
                    family: fontFamily || DEFAULT_STYLE.family
                };
            }
            function getComputedStyle(style, element) {
                var computedStyle = {};
                for (var p in style) {
                    computedStyle[p] = style[p];
                }
                // Compute the size
                var canvasFontSize = parseFloat(element.currentStyle.fontSize), fontSize = parseFloat(style.size);
                if (typeof style.size == "number") {
                    computedStyle.size = style.size;
                } else if (style.size.indexOf("px") != -1) {
                    computedStyle.size = fontSize;
                } else if (style.size.indexOf("em") != -1) {
                    computedStyle.size = canvasFontSize * fontSize;
                } else if (style.size.indexOf("%") != -1) {
                    computedStyle.size = canvasFontSize / 100 * fontSize;
                } else if (style.size.indexOf("pt") != -1) {
                    computedStyle.size = fontSize / .75;
                } else {
                    computedStyle.size = canvasFontSize;
                }
                // Different scaling between normal text and VML text. This was found using
                // trial and error to get the same size as non VML text.
                //computedStyle.size *= 0.981;
                return computedStyle;
            }
            function buildStyle(style) {
                return style.style + " " + style.variant + " " + style.weight + " " + style.size + "px '" + style.family + "'";
            }
            var lineCapMap = {
                butt: "flat",
                round: "round"
            };
            function processLineCap(lineCap) {
                return lineCapMap[lineCap] || "square";
            }
            /**
   * This class implements CanvasRenderingContext2D interface as described by
   * the WHATWG.
   * @param {HTMLElement} canvasElement The element that the 2D context should
   * be associated with
   */
            function CanvasRenderingContext2D_(canvasElement) {
                this.m_ = createMatrixIdentity();
                this.mStack_ = [];
                this.aStack_ = [];
                this.currentPath_ = [];
                // Canvas context properties
                this.strokeStyle = "#000";
                this.fillStyle = "#000";
                this.lineWidth = 1;
                this.lineJoin = "miter";
                this.lineCap = "butt";
                this.miterLimit = Z * 1;
                this.globalAlpha = 1;
                // this.font = '10px sans-serif';
                this.font = "12px 微软雅黑";
                // 决定还是改这吧，影响代价最小
                this.textAlign = "left";
                this.textBaseline = "alphabetic";
                this.canvas = canvasElement;
                var cssText = "width:" + canvasElement.clientWidth + "px;height:" + canvasElement.clientHeight + "px;overflow:hidden;position:absolute";
                var el = canvasElement.ownerDocument.createElement("div");
                el.style.cssText = cssText;
                canvasElement.appendChild(el);
                var overlayEl = el.cloneNode(false);
                // Use a non transparent background.
                overlayEl.style.backgroundColor = "#fff";
                //red, I don't know why, it work! 
                overlayEl.style.filter = "alpha(opacity=0)";
                canvasElement.appendChild(overlayEl);
                this.element_ = el;
                this.scaleX_ = 1;
                this.scaleY_ = 1;
                this.lineScale_ = 1;
            }
            var contextPrototype = CanvasRenderingContext2D_.prototype;
            contextPrototype.clearRect = function() {
                if (this.textMeasureEl_) {
                    this.textMeasureEl_.removeNode(true);
                    this.textMeasureEl_ = null;
                }
                this.element_.innerHTML = "";
            };
            contextPrototype.beginPath = function() {
                // TODO: Branch current matrix so that save/restore has no effect
                //       as per safari docs.
                this.currentPath_ = [];
            };
            contextPrototype.moveTo = function(aX, aY) {
                var p = getCoords(this, aX, aY);
                this.currentPath_.push({
                    type: "moveTo",
                    x: p.x,
                    y: p.y
                });
                this.currentX_ = p.x;
                this.currentY_ = p.y;
            };
            contextPrototype.lineTo = function(aX, aY) {
                var p = getCoords(this, aX, aY);
                this.currentPath_.push({
                    type: "lineTo",
                    x: p.x,
                    y: p.y
                });
                this.currentX_ = p.x;
                this.currentY_ = p.y;
            };
            contextPrototype.bezierCurveTo = function(aCP1x, aCP1y, aCP2x, aCP2y, aX, aY) {
                var p = getCoords(this, aX, aY);
                var cp1 = getCoords(this, aCP1x, aCP1y);
                var cp2 = getCoords(this, aCP2x, aCP2y);
                bezierCurveTo(this, cp1, cp2, p);
            };
            // Helper function that takes the already fixed cordinates.
            function bezierCurveTo(self, cp1, cp2, p) {
                self.currentPath_.push({
                    type: "bezierCurveTo",
                    cp1x: cp1.x,
                    cp1y: cp1.y,
                    cp2x: cp2.x,
                    cp2y: cp2.y,
                    x: p.x,
                    y: p.y
                });
                self.currentX_ = p.x;
                self.currentY_ = p.y;
            }
            contextPrototype.quadraticCurveTo = function(aCPx, aCPy, aX, aY) {
                // the following is lifted almost directly from
                // http://developer.mozilla.org/en/docs/Canvas_tutorial:Drawing_shapes
                var cp = getCoords(this, aCPx, aCPy);
                var p = getCoords(this, aX, aY);
                var cp1 = {
                    x: this.currentX_ + 2 / 3 * (cp.x - this.currentX_),
                    y: this.currentY_ + 2 / 3 * (cp.y - this.currentY_)
                };
                var cp2 = {
                    x: cp1.x + (p.x - this.currentX_) / 3,
                    y: cp1.y + (p.y - this.currentY_) / 3
                };
                bezierCurveTo(this, cp1, cp2, p);
            };
            contextPrototype.arc = function(aX, aY, aRadius, aStartAngle, aEndAngle, aClockwise) {
                aRadius *= Z;
                var arcType = aClockwise ? "at" : "wa";
                var xStart = aX + mc(aStartAngle) * aRadius - Z2;
                var yStart = aY + ms(aStartAngle) * aRadius - Z2;
                var xEnd = aX + mc(aEndAngle) * aRadius - Z2;
                var yEnd = aY + ms(aEndAngle) * aRadius - Z2;
                // IE won't render arches drawn counter clockwise if xStart == xEnd.
                if (xStart == xEnd && !aClockwise) {
                    xStart += .125;
                }
                var p = getCoords(this, aX, aY);
                var pStart = getCoords(this, xStart, yStart);
                var pEnd = getCoords(this, xEnd, yEnd);
                this.currentPath_.push({
                    type: arcType,
                    x: p.x,
                    y: p.y,
                    radius: aRadius,
                    xStart: pStart.x,
                    yStart: pStart.y,
                    xEnd: pEnd.x,
                    yEnd: pEnd.y
                });
            };
            contextPrototype.rect = function(aX, aY, aWidth, aHeight) {
                this.moveTo(aX, aY);
                this.lineTo(aX + aWidth, aY);
                this.lineTo(aX + aWidth, aY + aHeight);
                this.lineTo(aX, aY + aHeight);
                this.closePath();
            };
            contextPrototype.strokeRect = function(aX, aY, aWidth, aHeight) {
                var oldPath = this.currentPath_;
                this.beginPath();
                this.moveTo(aX, aY);
                this.lineTo(aX + aWidth, aY);
                this.lineTo(aX + aWidth, aY + aHeight);
                this.lineTo(aX, aY + aHeight);
                this.closePath();
                this.stroke();
                this.currentPath_ = oldPath;
            };
            contextPrototype.fillRect = function(aX, aY, aWidth, aHeight) {
                var oldPath = this.currentPath_;
                this.beginPath();
                this.moveTo(aX, aY);
                this.lineTo(aX + aWidth, aY);
                this.lineTo(aX + aWidth, aY + aHeight);
                this.lineTo(aX, aY + aHeight);
                this.closePath();
                this.fill();
                this.currentPath_ = oldPath;
            };
            contextPrototype.createLinearGradient = function(aX0, aY0, aX1, aY1) {
                var gradient = new CanvasGradient_("gradient");
                gradient.x0_ = aX0;
                gradient.y0_ = aY0;
                gradient.x1_ = aX1;
                gradient.y1_ = aY1;
                return gradient;
            };
            contextPrototype.createRadialGradient = function(aX0, aY0, aR0, aX1, aY1, aR1) {
                var gradient = new CanvasGradient_("gradientradial");
                gradient.x0_ = aX0;
                gradient.y0_ = aY0;
                gradient.r0_ = aR0;
                gradient.x1_ = aX1;
                gradient.y1_ = aY1;
                gradient.r1_ = aR1;
                return gradient;
            };
            contextPrototype.drawImage = function(image, var_args) {
                var dx, dy, dw, dh, sx, sy, sw, sh;
                // to find the original width we overide the width and height
                var oldRuntimeWidth = image.runtimeStyle.width;
                var oldRuntimeHeight = image.runtimeStyle.height;
                image.runtimeStyle.width = "auto";
                image.runtimeStyle.height = "auto";
                // get the original size
                var w = image.width;
                var h = image.height;
                // and remove overides
                image.runtimeStyle.width = oldRuntimeWidth;
                image.runtimeStyle.height = oldRuntimeHeight;
                if (arguments.length == 3) {
                    dx = arguments[1];
                    dy = arguments[2];
                    sx = sy = 0;
                    sw = dw = w;
                    sh = dh = h;
                } else if (arguments.length == 5) {
                    dx = arguments[1];
                    dy = arguments[2];
                    dw = arguments[3];
                    dh = arguments[4];
                    sx = sy = 0;
                    sw = w;
                    sh = h;
                } else if (arguments.length == 9) {
                    sx = arguments[1];
                    sy = arguments[2];
                    sw = arguments[3];
                    sh = arguments[4];
                    dx = arguments[5];
                    dy = arguments[6];
                    dw = arguments[7];
                    dh = arguments[8];
                } else {
                    throw Error("Invalid number of arguments");
                }
                var d = getCoords(this, dx, dy);
                var w2 = sw / 2;
                var h2 = sh / 2;
                var vmlStr = [];
                var W = 10;
                var H = 10;
                var scaleX = scaleY = 1;
                // For some reason that I've now forgotten, using divs didn't work
                vmlStr.push(" <g_vml_:group", ' coordsize="', Z * W, ",", Z * H, '"', ' coordorigin="0,0"', ' style="width:', W, "px;height:", H, "px;position:absolute;");
                // If filters are necessary (rotation exists), create them
                // filters are bog-slow, so only create them if abbsolutely necessary
                // The following check doesn't account for skews (which don't exist
                // in the canvas spec (yet) anyway.
                if (this.m_[0][0] != 1 || this.m_[0][1] || this.m_[1][1] != 1 || this.m_[1][0]) {
                    var filter = [];
                    var scaleX = this.scaleX_;
                    var scaleY = this.scaleY_;
                    // Note the 12/21 reversal
                    filter.push("M11=", this.m_[0][0] / scaleX, ",", "M12=", this.m_[1][0] / scaleY, ",", "M21=", this.m_[0][1] / scaleX, ",", "M22=", this.m_[1][1] / scaleY, ",", "Dx=", mr(d.x / Z), ",", "Dy=", mr(d.y / Z), "");
                    // Bounding box calculation (need to minimize displayed area so that
                    // filters don't waste time on unused pixels.
                    var max = d;
                    var c2 = getCoords(this, dx + dw, dy);
                    var c3 = getCoords(this, dx, dy + dh);
                    var c4 = getCoords(this, dx + dw, dy + dh);
                    max.x = m.max(max.x, c2.x, c3.x, c4.x);
                    max.y = m.max(max.y, c2.y, c3.y, c4.y);
                    vmlStr.push("padding:0 ", mr(max.x / Z), "px ", mr(max.y / Z), "px 0;filter:progid:DXImageTransform.Microsoft.Matrix(", filter.join(""), ", SizingMethod='clip');");
                } else {
                    vmlStr.push("top:", mr(d.y / Z), "px;left:", mr(d.x / Z), "px;");
                }
                vmlStr.push(' ">');
                // Draw a special cropping div if needed
                if (sx || sy) {
                    // Apply scales to width and height
                    vmlStr.push('<div style="overflow: hidden; width:', Math.ceil((dw + sx * dw / sw) * scaleX), "px;", " height:", Math.ceil((dh + sy * dh / sh) * scaleY), "px;", " filter:progid:DxImageTransform.Microsoft.Matrix(Dx=", -sx * dw / sw * scaleX, ",Dy=", -sy * dh / sh * scaleY, ');">');
                }
                // Apply scales to width and height
                vmlStr.push('<div style="width:', Math.round(scaleX * w * dw / sw), "px;", " height:", Math.round(scaleY * h * dh / sh), "px;", " filter:");
                // If there is a globalAlpha, apply it to image
                if (this.globalAlpha < 1) {
                    vmlStr.push(" progid:DXImageTransform.Microsoft.Alpha(opacity=" + this.globalAlpha * 100 + ")");
                }
                vmlStr.push(" progid:DXImageTransform.Microsoft.AlphaImageLoader(src=", image.src, ',sizingMethod=scale)">');
                // Close the crop div if necessary            
                if (sx || sy) vmlStr.push("</div>");
                vmlStr.push("</div></div>");
                this.element_.insertAdjacentHTML("BeforeEnd", vmlStr.join(""));
            };
            contextPrototype.stroke = function(aFill) {
                var lineStr = [];
                var lineOpen = false;
                var W = 10;
                var H = 10;
                lineStr.push("<g_vml_:shape", ' filled="', !!aFill, '"', ' style="position:absolute;width:', W, "px;height:", H, 'px;"', ' coordorigin="0,0"', ' coordsize="', Z * W, ",", Z * H, '"', ' stroked="', !aFill, '"', ' path="');
                var newSeq = false;
                var min = {
                    x: null,
                    y: null
                };
                var max = {
                    x: null,
                    y: null
                };
                for (var i = 0; i < this.currentPath_.length; i++) {
                    var p = this.currentPath_[i];
                    var c;
                    switch (p.type) {
                      case "moveTo":
                        c = p;
                        lineStr.push(" m ", mr(p.x), ",", mr(p.y));
                        break;

                      case "lineTo":
                        lineStr.push(" l ", mr(p.x), ",", mr(p.y));
                        break;

                      case "close":
                        lineStr.push(" x ");
                        p = null;
                        break;

                      case "bezierCurveTo":
                        lineStr.push(" c ", mr(p.cp1x), ",", mr(p.cp1y), ",", mr(p.cp2x), ",", mr(p.cp2y), ",", mr(p.x), ",", mr(p.y));
                        break;

                      case "at":
                      case "wa":
                        lineStr.push(" ", p.type, " ", mr(p.x - this.scaleX_ * p.radius), ",", mr(p.y - this.scaleY_ * p.radius), " ", mr(p.x + this.scaleX_ * p.radius), ",", mr(p.y + this.scaleY_ * p.radius), " ", mr(p.xStart), ",", mr(p.yStart), " ", mr(p.xEnd), ",", mr(p.yEnd));
                        break;
                    }
                    // TODO: Following is broken for curves due to
                    //       move to proper paths.
                    // Figure out dimensions so we can do gradient fills
                    // properly
                    if (p) {
                        if (min.x == null || p.x < min.x) {
                            min.x = p.x;
                        }
                        if (max.x == null || p.x > max.x) {
                            max.x = p.x;
                        }
                        if (min.y == null || p.y < min.y) {
                            min.y = p.y;
                        }
                        if (max.y == null || p.y > max.y) {
                            max.y = p.y;
                        }
                    }
                }
                lineStr.push(' ">');
                if (!aFill) {
                    appendStroke(this, lineStr);
                } else {
                    appendFill(this, lineStr, min, max);
                }
                lineStr.push("</g_vml_:shape>");
                this.element_.insertAdjacentHTML("beforeEnd", lineStr.join(""));
            };
            function appendStroke(ctx, lineStr) {
                var a = processStyle(ctx.strokeStyle);
                var color = a.color;
                var opacity = a.alpha * ctx.globalAlpha;
                var lineWidth = ctx.lineScale_ * ctx.lineWidth;
                // VML cannot correctly render a line if the width is less than 1px.
                // In that case, we dilute the color to make the line look thinner.
                if (lineWidth < 1) {
                    opacity *= lineWidth;
                }
                lineStr.push("<g_vml_:stroke", ' opacity="', opacity, '"', ' joinstyle="', ctx.lineJoin, '"', ' miterlimit="', ctx.miterLimit, '"', ' endcap="', processLineCap(ctx.lineCap), '"', ' weight="', lineWidth, 'px"', ' color="', color, '" />');
            }
            function appendFill(ctx, lineStr, min, max) {
                var fillStyle = ctx.fillStyle;
                var arcScaleX = ctx.scaleX_;
                var arcScaleY = ctx.scaleY_;
                var width = max.x - min.x;
                var height = max.y - min.y;
                if (fillStyle instanceof CanvasGradient_) {
                    // TODO: Gradients transformed with the transformation matrix.
                    var angle = 0;
                    var focus = {
                        x: 0,
                        y: 0
                    };
                    // additional offset
                    var shift = 0;
                    // scale factor for offset
                    var expansion = 1;
                    if (fillStyle.type_ == "gradient") {
                        var x0 = fillStyle.x0_ / arcScaleX;
                        var y0 = fillStyle.y0_ / arcScaleY;
                        var x1 = fillStyle.x1_ / arcScaleX;
                        var y1 = fillStyle.y1_ / arcScaleY;
                        var p0 = getCoords(ctx, x0, y0);
                        var p1 = getCoords(ctx, x1, y1);
                        var dx = p1.x - p0.x;
                        var dy = p1.y - p0.y;
                        angle = Math.atan2(dx, dy) * 180 / Math.PI;
                        // The angle should be a non-negative number.
                        if (angle < 0) {
                            angle += 360;
                        }
                        // Very small angles produce an unexpected result because they are
                        // converted to a scientific notation string.
                        if (angle < 1e-6) {
                            angle = 0;
                        }
                    } else {
                        var p0 = getCoords(ctx, fillStyle.x0_, fillStyle.y0_);
                        focus = {
                            x: (p0.x - min.x) / width,
                            y: (p0.y - min.y) / height
                        };
                        width /= arcScaleX * Z;
                        height /= arcScaleY * Z;
                        var dimension = m.max(width, height);
                        shift = 2 * fillStyle.r0_ / dimension;
                        expansion = 2 * fillStyle.r1_ / dimension - shift;
                    }
                    // We need to sort the color stops in ascending order by offset,
                    // otherwise IE won't interpret it correctly.
                    var stops = fillStyle.colors_;
                    stops.sort(function(cs1, cs2) {
                        return cs1.offset - cs2.offset;
                    });
                    var length = stops.length;
                    var color1 = stops[0].color;
                    var color2 = stops[length - 1].color;
                    var opacity1 = stops[0].alpha * ctx.globalAlpha;
                    var opacity2 = stops[length - 1].alpha * ctx.globalAlpha;
                    var colors = [];
                    for (var i = 0; i < length; i++) {
                        var stop = stops[i];
                        colors.push(stop.offset * expansion + shift + " " + stop.color);
                    }
                    // When colors attribute is used, the meanings of opacity and o:opacity2
                    // are reversed.
                    lineStr.push('<g_vml_:fill type="', fillStyle.type_, '"', ' method="none" focus="100%"', ' color="', color1, '"', ' color2="', color2, '"', ' colors="', colors.join(","), '"', ' opacity="', opacity2, '"', ' g_o_:opacity2="', opacity1, '"', ' angle="', angle, '"', ' focusposition="', focus.x, ",", focus.y, '" />');
                } else if (fillStyle instanceof CanvasPattern_) {
                    if (width && height) {
                        var deltaLeft = -min.x;
                        var deltaTop = -min.y;
                        lineStr.push("<g_vml_:fill", ' position="', deltaLeft / width * arcScaleX * arcScaleX, ",", deltaTop / height * arcScaleY * arcScaleY, '"', ' type="tile"', // TODO: Figure out the correct size to fit the scale.
                        //' size="', w, 'px ', h, 'px"',
                        ' src="', fillStyle.src_, '" />');
                    }
                } else {
                    var a = processStyle(ctx.fillStyle);
                    var color = a.color;
                    var opacity = a.alpha * ctx.globalAlpha;
                    lineStr.push('<g_vml_:fill color="', color, '" opacity="', opacity, '" />');
                }
            }
            contextPrototype.fill = function() {
                this.stroke(true);
            };
            contextPrototype.closePath = function() {
                this.currentPath_.push({
                    type: "close"
                });
            };
            function getCoords(ctx, aX, aY) {
                var m = ctx.m_;
                return {
                    x: Z * (aX * m[0][0] + aY * m[1][0] + m[2][0]) - Z2,
                    y: Z * (aX * m[0][1] + aY * m[1][1] + m[2][1]) - Z2
                };
            }
            contextPrototype.save = function() {
                var o = {};
                copyState(this, o);
                this.aStack_.push(o);
                this.mStack_.push(this.m_);
                this.m_ = matrixMultiply(createMatrixIdentity(), this.m_);
            };
            contextPrototype.restore = function() {
                if (this.aStack_.length) {
                    copyState(this.aStack_.pop(), this);
                    this.m_ = this.mStack_.pop();
                }
            };
            function matrixIsFinite(m) {
                return isFinite(m[0][0]) && isFinite(m[0][1]) && isFinite(m[1][0]) && isFinite(m[1][1]) && isFinite(m[2][0]) && isFinite(m[2][1]);
            }
            function setM(ctx, m, updateLineScale) {
                if (!matrixIsFinite(m)) {
                    return;
                }
                ctx.m_ = m;
                ctx.scaleX_ = Math.sqrt(m[0][0] * m[0][0] + m[0][1] * m[0][1]);
                ctx.scaleY_ = Math.sqrt(m[1][0] * m[1][0] + m[1][1] * m[1][1]);
                if (updateLineScale) {
                    // Get the line scale.
                    // Determinant of this.m_ means how much the area is enlarged by the
                    // transformation. So its square root can be used as a scale factor
                    // for width.
                    var det = m[0][0] * m[1][1] - m[0][1] * m[1][0];
                    ctx.lineScale_ = sqrt(abs(det));
                }
            }
            contextPrototype.translate = function(aX, aY) {
                var m1 = [ [ 1, 0, 0 ], [ 0, 1, 0 ], [ aX, aY, 1 ] ];
                setM(this, matrixMultiply(m1, this.m_), false);
            };
            contextPrototype.rotate = function(aRot) {
                var c = mc(aRot);
                var s = ms(aRot);
                var m1 = [ [ c, s, 0 ], [ -s, c, 0 ], [ 0, 0, 1 ] ];
                setM(this, matrixMultiply(m1, this.m_), false);
            };
            contextPrototype.scale = function(aX, aY) {
                var m1 = [ [ aX, 0, 0 ], [ 0, aY, 0 ], [ 0, 0, 1 ] ];
                setM(this, matrixMultiply(m1, this.m_), true);
            };
            contextPrototype.transform = function(m11, m12, m21, m22, dx, dy) {
                var m1 = [ [ m11, m12, 0 ], [ m21, m22, 0 ], [ dx, dy, 1 ] ];
                setM(this, matrixMultiply(m1, this.m_), true);
            };
            contextPrototype.setTransform = function(m11, m12, m21, m22, dx, dy) {
                var m = [ [ m11, m12, 0 ], [ m21, m22, 0 ], [ dx, dy, 1 ] ];
                setM(this, m, true);
            };
            /**
   * The text drawing function.
   * The maxWidth argument isn't taken in account, since no browser supports
   * it yet.
   */
            contextPrototype.drawText_ = function(text, x, y, maxWidth, stroke) {
                var m = this.m_, delta = 1e3, left = 0, right = delta, offset = {
                    x: 0,
                    y: 0
                }, lineStr = [];
                var fontStyle = getComputedStyle(processFontStyle(this.font), this.element_);
                var fontStyleString = buildStyle(fontStyle);
                var elementStyle = this.element_.currentStyle;
                var textAlign = this.textAlign.toLowerCase();
                switch (textAlign) {
                  case "left":
                  case "center":
                  case "right":
                    break;

                  case "end":
                    textAlign = elementStyle.direction == "ltr" ? "right" : "left";
                    break;

                  case "start":
                    textAlign = elementStyle.direction == "rtl" ? "right" : "left";
                    break;

                  default:
                    textAlign = "left";
                }
                // 1.75 is an arbitrary number, as there is no info about the text baseline
                switch (this.textBaseline) {
                  case "hanging":
                  case "top":
                    offset.y = fontStyle.size / 1.75;
                    break;

                  case "middle":
                    break;

                  default:
                  case null:
                  case "alphabetic":
                  case "ideographic":
                  case "bottom":
                    offset.y = -fontStyle.size / 2.25;
                    break;
                }
                switch (textAlign) {
                  case "right":
                    left = delta;
                    right = .05;
                    break;

                  case "center":
                    left = right = delta / 2;
                    break;
                }
                var d = getCoords(this, x + offset.x, y + offset.y);
                lineStr.push('<g_vml_:line from="', -left, ' 0" to="', right, ' 0.05" ', ' coordsize="100 100" coordorigin="0 0"', ' filled="', !stroke, '" stroked="', !!stroke, '" style="position:absolute;width:1px;height:1px;">');
                if (stroke) {
                    appendStroke(this, lineStr);
                } else {
                    // TODO: Fix the min and max params.
                    appendFill(this, lineStr, {
                        x: -left,
                        y: 0
                    }, {
                        x: right,
                        y: fontStyle.size
                    });
                }
                var skewM = m[0][0].toFixed(3) + "," + m[1][0].toFixed(3) + "," + m[0][1].toFixed(3) + "," + m[1][1].toFixed(3) + ",0,0";
                var skewOffset = mr(d.x / Z) + "," + mr(d.y / Z);
                lineStr.push('<g_vml_:skew on="t" matrix="', skewM, '" ', ' offset="', skewOffset, '" origin="', left, ' 0" />', '<g_vml_:path textpathok="true" />', '<g_vml_:textpath on="true" string="', encodeHtmlAttribute(text), '" style="v-text-align:', textAlign, ";font:", encodeHtmlAttribute(fontStyleString), '" /></g_vml_:line>');
                this.element_.insertAdjacentHTML("beforeEnd", lineStr.join(""));
            };
            contextPrototype.fillText = function(text, x, y, maxWidth) {
                this.drawText_(text, x, y, maxWidth, false);
            };
            contextPrototype.strokeText = function(text, x, y, maxWidth) {
                this.drawText_(text, x, y, maxWidth, true);
            };
            contextPrototype.measureText = function(text) {
                if (!this.textMeasureEl_) {
                    var s = '<span style="position:absolute;' + "top:-20000px;left:0;padding:0;margin:0;border:none;" + 'white-space:pre;"></span>';
                    this.element_.insertAdjacentHTML("beforeEnd", s);
                    this.textMeasureEl_ = this.element_.lastChild;
                }
                var doc = this.element_.ownerDocument;
                this.textMeasureEl_.innerHTML = "";
                this.textMeasureEl_.style.font = this.font;
                // Don't use innerHTML or innerText because they allow markup/whitespace.
                this.textMeasureEl_.appendChild(doc.createTextNode(text));
                return {
                    width: this.textMeasureEl_.offsetWidth
                };
            };
            /******** STUBS ********/
            contextPrototype.clip = function() {};
            contextPrototype.arcTo = function() {};
            contextPrototype.createPattern = function(image, repetition) {
                return new CanvasPattern_(image, repetition);
            };
            // Gradient / Pattern Stubs
            function CanvasGradient_(aType) {
                this.type_ = aType;
                this.x0_ = 0;
                this.y0_ = 0;
                this.r0_ = 0;
                this.x1_ = 0;
                this.y1_ = 0;
                this.r1_ = 0;
                this.colors_ = [];
            }
            CanvasGradient_.prototype.addColorStop = function(aOffset, aColor) {
                aColor = processStyle(aColor);
                this.colors_.push({
                    offset: aOffset,
                    color: aColor.color,
                    alpha: aColor.alpha
                });
            };
            function CanvasPattern_(image, repetition) {
                assertImageIsValid(image);
                switch (repetition) {
                  case "repeat":
                  case null:
                  case "":
                    this.repetition_ = "repeat";
                    break;

                  case "repeat-x":
                  case "repeat-y":
                  case "no-repeat":
                    this.repetition_ = repetition;
                    break;

                  default:
                    throwException("SYNTAX_ERR");
                }
                this.src_ = image.src;
                this.width_ = image.width;
                this.height_ = image.height;
            }
            function throwException(s) {
                throw new DOMException_(s);
            }
            function assertImageIsValid(img) {
                if (!img || img.nodeType != 1 || img.tagName != "IMG") {
                    throwException("TYPE_MISMATCH_ERR");
                }
                if (img.readyState != "complete") {
                    throwException("INVALID_STATE_ERR");
                }
            }
            function DOMException_(s) {
                this.code = this[s];
                this.message = s + ": DOM Exception " + this.code;
            }
            var p = DOMException_.prototype = new Error();
            p.INDEX_SIZE_ERR = 1;
            p.DOMSTRING_SIZE_ERR = 2;
            p.HIERARCHY_REQUEST_ERR = 3;
            p.WRONG_DOCUMENT_ERR = 4;
            p.INVALID_CHARACTER_ERR = 5;
            p.NO_DATA_ALLOWED_ERR = 6;
            p.NO_MODIFICATION_ALLOWED_ERR = 7;
            p.NOT_FOUND_ERR = 8;
            p.NOT_SUPPORTED_ERR = 9;
            p.INUSE_ATTRIBUTE_ERR = 10;
            p.INVALID_STATE_ERR = 11;
            p.SYNTAX_ERR = 12;
            p.INVALID_MODIFICATION_ERR = 13;
            p.NAMESPACE_ERR = 14;
            p.INVALID_ACCESS_ERR = 15;
            p.VALIDATION_ERR = 16;
            p.TYPE_MISMATCH_ERR = 17;
            // set up externs
            G_vmlCanvasManager = G_vmlCanvasManager_;
            CanvasRenderingContext2D = CanvasRenderingContext2D_;
            CanvasGradient = CanvasGradient_;
            CanvasPattern = CanvasPattern_;
            DOMException = DOMException_;
        })();
    } else {
        // make the canvas test simple by kener.linfeng@gmail.com
        G_vmlCanvasManager = false;
    }
    module.exports = G_vmlCanvasManager;
});

define("app/pc/canvaslib/tool/util", [ "app/pc/canvaslib/dep/excanvas" ], function(require, exports, module) {
    /**
 * zrender: 公共辅助函数
 *
 * @author Kener (@Kener-林峰, kener.linfeng@gmail.com)
 *
 * clone：深度克隆
 * merge：合并源对象的属性到目标对象
 * getContext：获取一个自由使用的canvas 2D context，使用原生方法，如isPointInPath，measureText等
 */
    // 用于处理merge时无法遍历Date等对象的问题
    var BUILTIN_OBJECT = {
        "[object Function]": 1,
        "[object RegExp]": 1,
        "[object Date]": 1,
        "[object Error]": 1,
        "[object CanvasGradient]": 1
    };
    /**
         * 对一个object进行深度拷贝
         *
         * @param {Any} source 需要进行拷贝的对象
         * @return {Any} 拷贝后的新对象
         */
    function clone(source) {
        if (typeof source == "object" && source !== null) {
            var result = source;
            if (source instanceof Array) {
                result = [];
                for (var i = 0, len = source.length; i < len; i++) {
                    result[i] = clone(source[i]);
                }
            } else if (!BUILTIN_OBJECT[Object.prototype.toString.call(source)]) {
                result = {};
                for (var key in source) {
                    if (source.hasOwnProperty(key)) {
                        result[key] = clone(source[key]);
                    }
                }
            }
            return result;
        }
        return source;
    }
    function mergeItem(target, source, key, overwrite) {
        if (source.hasOwnProperty(key)) {
            if (typeof target[key] == "object" && !BUILTIN_OBJECT[Object.prototype.toString.call(target[key])]) {
                // 如果需要递归覆盖，就递归调用merge
                merge(target[key], source[key], overwrite);
            } else if (overwrite || !(key in target)) {
                // 否则只处理overwrite为true，或者在目标对象中没有此属性的情况
                target[key] = source[key];
            }
        }
    }
    /**
         * 合并源对象的属性到目标对象
         * modify from Tangram
         * @param {*} target 目标对象
         * @param {*} source 源对象
         * @param {boolean} overwrite 是否覆盖
         */
    function merge(target, source, overwrite) {
        for (var i in source) {
            mergeItem(target, source, i, overwrite);
        }
        return target;
    }
    var _ctx;
    function getContext() {
        if (!_ctx) {
            require("app/pc/canvaslib/dep/excanvas");
            /* jshint ignore:start */
            if (window["G_vmlCanvasManager"]) {
                var _div = document.createElement("div");
                _div.style.position = "absolute";
                _div.style.top = "-1000px";
                document.body.appendChild(_div);
                _ctx = G_vmlCanvasManager.initElement(_div).getContext("2d");
            } else {
                _ctx = document.createElement("canvas").getContext("2d");
            }
        }
        return _ctx;
    }
    var _canvas;
    var _pixelCtx;
    var _width;
    var _height;
    var _offsetX = 0;
    var _offsetY = 0;
    /**
         * 获取像素拾取专用的上下文
         * @return {Object} 上下文
         */
    function getPixelContext() {
        if (!_pixelCtx) {
            _canvas = document.createElement("canvas");
            _width = _canvas.width;
            _height = _canvas.height;
            _pixelCtx = _canvas.getContext("2d");
        }
        return _pixelCtx;
    }
    /**
         * 如果坐标处在_canvas外部，改变_canvas的大小
         * @param {number} x : 横坐标
         * @param {number} y : 纵坐标
         * 注意 修改canvas的大小 需要重新设置translate
         */
    function adjustCanvasSize(x, y) {
        // 每次加的长度
        var _v = 100;
        var _flag;
        if (x + _offsetX > _width) {
            _width = x + _offsetX + _v;
            _canvas.width = _width;
            _flag = true;
        }
        if (y + _offsetY > _height) {
            _height = y + _offsetY + _v;
            _canvas.height = _height;
            _flag = true;
        }
        if (x < -_offsetX) {
            _offsetX = Math.ceil(-x / _v) * _v;
            _width += _offsetX;
            _canvas.width = _width;
            _flag = true;
        }
        if (y < -_offsetY) {
            _offsetY = Math.ceil(-y / _v) * _v;
            _height += _offsetY;
            _canvas.height = _height;
            _flag = true;
        }
        if (_flag) {
            _pixelCtx.translate(_offsetX, _offsetY);
        }
    }
    /**
         * 获取像素canvas的偏移量
         * @return {Object} 偏移量
         */
    function getPixelOffset() {
        return {
            x: _offsetX,
            y: _offsetY
        };
    }
    /**
         * 查询数组中元素的index
         */
    function indexOf(array, value) {
        if (array.indexOf) {
            return array.indexOf(value);
        }
        for (var i = 0, len = array.length; i < len; i++) {
            if (array[i] === value) {
                return i;
            }
        }
        return -1;
    }
    /**
         * 构造类继承关系
         * 
         * @param {Function} clazz 源类
         * @param {Function} baseClazz 基类
         */
    function inherits(clazz, baseClazz) {
        var clazzPrototype = clazz.prototype;
        function F() {}
        F.prototype = baseClazz.prototype;
        clazz.prototype = new F();
        for (var prop in clazzPrototype) {
            clazz.prototype[prop] = clazzPrototype[prop];
        }
        clazz.constructor = clazz;
    }
    module.exports = {
        inherits: inherits,
        clone: clone,
        merge: merge,
        getContext: getContext,
        getPixelContext: getPixelContext,
        getPixelOffset: getPixelOffset,
        adjustCanvasSize: adjustCanvasSize,
        indexOf: indexOf
    };
});

define("app/pc/canvaslib/tool/log", [ "app/pc/canvaslib/config" ], function(require, exports, module) {
    var config = require("app/pc/canvaslib/config");
    module.exports = function() {
        if (config.debugMode === 0) {
            return;
        } else if (config.debugMode == 1) {
            for (var k in arguments) {
                throw new Error(arguments[k]);
            }
        } else if (config.debugMode > 1) {
            for (var k in arguments) {
                console.log(arguments[k]);
            }
        }
    };
});

define("app/pc/canvaslib/config", [], function(require, exports, module) {
    /**
     * config默认配置项
     * @exports zrender/config
     * @author Kener (@Kener-林峰, kener.linfeng@gmail.com)
     */
    var config = {
        /**
         * @namespace module:zrender/config.EVENT
         */
        EVENT: {
            /**
             * 窗口大小变化
             * @type {string}
             */
            RESIZE: "resize",
            /**
             * 鼠标按钮被（手指）按下，事件对象是：目标图形元素或空
             * @type {string}
             */
            CLICK: "click",
            /**
             * 双击事件
             * @type {string}
             */
            DBLCLICK: "dblclick",
            /**
             * 鼠标滚轮变化，事件对象是：目标图形元素或空
             * @type {string}
             */
            MOUSEWHEEL: "mousewheel",
            /**
             * 鼠标（手指）被移动，事件对象是：目标图形元素或空
             * @type {string}
             */
            MOUSEMOVE: "mousemove",
            /**
             * 鼠标移到某图形元素之上，事件对象是：目标图形元素
             * @type {string}
             */
            MOUSEOVER: "mouseover",
            /**
             * 鼠标从某图形元素移开，事件对象是：目标图形元素
             * @type {string}
             */
            MOUSEOUT: "mouseout",
            /**
             * 鼠标按钮（手指）被按下，事件对象是：目标图形元素或空
             * @type {string}
             */
            MOUSEDOWN: "mousedown",
            /**
             * 鼠标按键（手指）被松开，事件对象是：目标图形元素或空
             * @type {string}
             */
            MOUSEUP: "mouseup",
            /**
             * 全局离开，MOUSEOUT触发比较频繁，一次离开优化绑定
             * @type {string}
             */
            GLOBALOUT: "globalout",
            // 
            // 一次成功元素拖拽的行为事件过程是：
            // dragstart > dragenter > dragover [> dragleave] > drop > dragend
            /**
             * 开始拖拽时触发，事件对象是：被拖拽图形元素
             * @type {string}
             */
            DRAGSTART: "dragstart",
            /**
             * 拖拽完毕时触发（在drop之后触发），事件对象是：被拖拽图形元素
             * @type {string}
             */
            DRAGEND: "dragend",
            /**
             * 拖拽图形元素进入目标图形元素时触发，事件对象是：目标图形元素
             * @type {string}
             */
            DRAGENTER: "dragenter",
            /**
             * 拖拽图形元素在目标图形元素上移动时触发，事件对象是：目标图形元素
             * @type {string}
             */
            DRAGOVER: "dragover",
            /**
             * 拖拽图形元素离开目标图形元素时触发，事件对象是：目标图形元素
             * @type {string}
             */
            DRAGLEAVE: "dragleave",
            /**
             * 拖拽图形元素放在目标图形元素内时触发，事件对象是：目标图形元素
             * @type {string}
             */
            DROP: "drop",
            /**
             * touch end - start < delay is click
             * @type {number}
             */
            touchClickDelay: 300
        },
        // 是否异常捕获
        catchBrushException: false,
        /**
         * debug日志选项：catchBrushException为true下有效
         * 0 : 不生成debug数据，发布用
         * 1 : 异常抛出，调试用
         * 2 : 控制台输出，调试用
         */
        debugMode: 0
    };
    module.exports = config;
});

define("app/pc/canvaslib/tool/guid", [], function(require, exports, module) {
    /**
 * zrender: 生成唯一id
 *
 * @author errorrik (errorrik@gmail.com)
 */
    var idStart = 2311;
    module.exports = function() {
        return "zrender__" + idStart++;
    };
});

define("app/pc/canvaslib/Handler", [ "app/pc/canvaslib/config", "app/pc/canvaslib/tool/env", "app/pc/canvaslib/tool/event", "app/pc/canvaslib/mixin/Eventful", "app/pc/canvaslib/tool/util", "app/pc/canvaslib/dep/excanvas", "app/pc/canvaslib/tool/vector", "app/pc/canvaslib/tool/matrix" ], function(require, exports, module) {
    /**
 * Handler控制模块
 * @module zrender/Handler
 * @author Kener (@Kener-林峰, kener.linfeng@gmail.com)
 *         errorrik (errorrik@gmail.com)
 *
 */
    // TODO mouseover 只触发一次
    "use strict";
    var config = require("app/pc/canvaslib/config");
    var env = require("app/pc/canvaslib/tool/env");
    var eventTool = require("app/pc/canvaslib/tool/event");
    var util = require("app/pc/canvaslib/tool/util");
    var vec2 = require("app/pc/canvaslib/tool/vector");
    var mat2d = require("app/pc/canvaslib/tool/matrix");
    var EVENT = config.EVENT;
    var Eventful = require("app/pc/canvaslib/mixin/Eventful");
    var domHandlerNames = [ "resize", "click", "dblclick", "mousewheel", "mousemove", "mouseout", "mouseup", "mousedown", "touchstart", "touchend", "touchmove" ];
    var domHandlers = {
        /**
             * 窗口大小改变响应函数
             * @inner
             * @param {Event} event
             */
        resize: function(event) {
            event = event || window.event;
            this._lastHover = null;
            this._isMouseDown = 0;
            // 分发config.EVENT.RESIZE事件，global
            this.dispatch(EVENT.RESIZE, event);
        },
        /**
             * 点击响应函数
             * @inner
             * @param {Event} event
             */
        click: function(event) {
            event = this._zrenderEventFixed(event);
            // 分发config.EVENT.CLICK事件
            var _lastHover = this._lastHover;
            if (_lastHover && _lastHover.clickable || !_lastHover) {
                // 判断没有发生拖拽才触发click事件
                if (this._clickThreshold < 5) {
                    this._dispatchAgency(_lastHover, EVENT.CLICK, event);
                }
            }
            this._mousemoveHandler(event);
        },
        /**
             * 双击响应函数
             * @inner
             * @param {Event} event
             */
        dblclick: function(event) {
            event = event || window.event;
            event = this._zrenderEventFixed(event);
            // 分发config.EVENT.DBLCLICK事件
            var _lastHover = this._lastHover;
            if (_lastHover && _lastHover.clickable || !_lastHover) {
                // 判断没有发生拖拽才触发dblclick事件
                if (this._clickThreshold < 5) {
                    this._dispatchAgency(_lastHover, EVENT.DBLCLICK, event);
                }
            }
            this._mousemoveHandler(event);
        },
        /**
             * 鼠标滚轮响应函数
             * @inner
             * @param {Event} event
             */
        mousewheel: function(event) {
            event = this._zrenderEventFixed(event);
            // http://www.sitepoint.com/html5-javascript-mouse-wheel/
            // https://developer.mozilla.org/en-US/docs/DOM/DOM_event_reference/mousewheel
            var delta = event.wheelDelta || -event.detail;
            // Firefox
            var scale = delta > 0 ? 1.1 : 1 / 1.1;
            var layers = this.painter.getLayers();
            var needsRefresh = false;
            for (var z in layers) {
                if (z !== "hover") {
                    var layer = layers[z];
                    var pos = layer.position;
                    if (layer.zoomable) {
                        layer.__zoom = layer.__zoom || 1;
                        var newZoom = layer.__zoom;
                        newZoom *= scale;
                        newZoom = Math.max(Math.min(layer.maxZoom, newZoom), layer.minZoom);
                        scale = newZoom / layer.__zoom;
                        layer.__zoom = newZoom;
                        // Keep the mouse center when scaling
                        pos[0] -= (this._mouseX - pos[0]) * (scale - 1);
                        pos[1] -= (this._mouseY - pos[1]) * (scale - 1);
                        layer.scale[0] *= scale;
                        layer.scale[1] *= scale;
                        layer.dirty = true;
                        needsRefresh = true;
                        // Prevent browser default scroll action 
                        eventTool.stop(event);
                    }
                }
            }
            if (needsRefresh) {
                this.painter.refresh();
            }
            // 分发config.EVENT.MOUSEWHEEL事件
            this._dispatchAgency(this._lastHover, EVENT.MOUSEWHEEL, event);
            this._mousemoveHandler(event);
        },
        /**
             * 鼠标（手指）移动响应函数
             * @inner
             * @param {Event} event
             */
        mousemove: function(event) {
            if (this.painter.isLoading()) {
                return;
            }
            // 拖拽不触发click事件
            this._clickThreshold++;
            event = this._zrenderEventFixed(event);
            this._lastX = this._mouseX;
            this._lastY = this._mouseY;
            this._mouseX = eventTool.getX(event);
            this._mouseY = eventTool.getY(event);
            var dx = this._mouseX - this._lastX;
            var dy = this._mouseY - this._lastY;
            // 可能出现config.EVENT.DRAGSTART事件
            // 避免手抖点击误认为拖拽
            // if (this._mouseX - this._lastX > 1 || this._mouseY - this._lastY > 1) {
            this._processDragStart(event);
            // }
            this._hasfound = 0;
            this._event = event;
            this._iterateAndFindHover();
            // 找到的在迭代函数里做了处理，没找到得在迭代完后处理
            if (!this._hasfound) {
                // 过滤首次拖拽产生的mouseout和dragLeave
                if (!this._draggingTarget || this._lastHover && this._lastHover != this._draggingTarget) {
                    // 可能出现config.EVENT.MOUSEOUT事件
                    this._processOutShape(event);
                    // 可能出现config.EVENT.DRAGLEAVE事件
                    this._processDragLeave(event);
                }
                this._lastHover = null;
                this.storage.delHover();
                this.painter.clearHover();
            }
            // set cursor for root element
            var cursor = "default";
            // 如果存在拖拽中元素，被拖拽的图形元素最后addHover
            if (this._draggingTarget) {
                this.storage.drift(this._draggingTarget.id, dx, dy);
                this._draggingTarget.modSelf();
                this.storage.addHover(this._draggingTarget);
            } else if (this._isMouseDown) {
                // Layer dragging
                var layers = this.painter.getLayers();
                var needsRefresh = false;
                for (var z in layers) {
                    if (z !== "hover") {
                        var layer = layers[z];
                        if (layer.panable) {
                            // PENDING
                            cursor = "move";
                            // Keep the mouse center when scaling
                            layer.position[0] += dx;
                            layer.position[1] += dy;
                            needsRefresh = true;
                            layer.dirty = true;
                        }
                    }
                }
                if (needsRefresh) {
                    this.painter.refresh();
                }
            }
            if (this._draggingTarget || this._hasfound && this._lastHover.draggable) {
                cursor = "move";
            } else if (this._hasfound && this._lastHover.clickable) {
                cursor = "pointer";
            }
            this.root.style.cursor = cursor;
            // 分发config.EVENT.MOUSEMOVE事件
            this._dispatchAgency(this._lastHover, EVENT.MOUSEMOVE, event);
            if (this._draggingTarget || this._hasfound || this.storage.hasHoverShape()) {
                this.painter.refreshHover();
            }
        },
        /**
             * 鼠标（手指）离开响应函数
             * @inner
             * @param {Event} event
             */
        mouseout: function(event) {
            event = this._zrenderEventFixed(event);
            var element = event.toElement || event.relatedTarget;
            if (element != this.root) {
                while (element && element.nodeType != 9) {
                    // 忽略包含在root中的dom引起的mouseOut
                    if (element == this.root) {
                        this._mousemoveHandler(event);
                        return;
                    }
                    element = element.parentNode;
                }
            }
            event.zrenderX = this._lastX;
            event.zrenderY = this._lastY;
            this.root.style.cursor = "default";
            this._isMouseDown = 0;
            this._processOutShape(event);
            this._processDrop(event);
            this._processDragEnd(event);
            if (!this.painter.isLoading()) {
                this.painter.refreshHover();
            }
            this.dispatch(EVENT.GLOBALOUT, event);
        },
        /**
             * 鼠标（手指）按下响应函数
             * @inner
             * @param {Event} event
             */
        mousedown: function(event) {
            // 重置 clickThreshold
            this._clickThreshold = 0;
            if (this._lastDownButton == 2) {
                this._lastDownButton = event.button;
                this._mouseDownTarget = null;
                // 仅作为关闭右键菜单使用
                return;
            }
            this._lastMouseDownMoment = new Date();
            event = this._zrenderEventFixed(event);
            this._isMouseDown = 1;
            // 分发config.EVENT.MOUSEDOWN事件
            this._mouseDownTarget = this._lastHover;
            this._dispatchAgency(this._lastHover, EVENT.MOUSEDOWN, event);
            this._lastDownButton = event.button;
        },
        /**
             * 鼠标（手指）抬起响应函数
             * @inner
             * @param {Event} event
             */
        mouseup: function(event) {
            event = this._zrenderEventFixed(event);
            this.root.style.cursor = "default";
            this._isMouseDown = 0;
            this._clickThreshold = 0;
            this._mouseDownTarget = null;
            // 分发config.EVENT.MOUSEUP事件
            this._dispatchAgency(this._lastHover, EVENT.MOUSEUP, event);
            this._processDrop(event);
            this._processDragEnd(event);
        },
        /**
             * Touch开始响应函数
             * @inner
             * @param {Event} event
             */
        touchstart: function(event) {
            // eventTool.stop(event);// 阻止浏览器默认事件，重要
            event = this._zrenderEventFixed(event, true);
            this._lastTouchMoment = new Date();
            // 平板补充一次findHover
            this._mobildFindFixed(event);
            this._mousedownHandler(event);
        },
        /**
             * Touch移动响应函数
             * @inner
             * @param {Event} event
             */
        touchmove: function(event) {
            event = this._zrenderEventFixed(event, true);
            this._mousemoveHandler(event);
            if (this._isDragging) {
                eventTool.stop(event);
            }
        },
        /**
             * Touch结束响应函数
             * @inner
             * @param {Event} event
             */
        touchend: function(event) {
            // eventTool.stop(event);// 阻止浏览器默认事件，重要
            event = this._zrenderEventFixed(event, true);
            this._mouseupHandler(event);
            var now = new Date();
            if (now - this._lastTouchMoment < EVENT.touchClickDelay) {
                this._mobildFindFixed(event);
                this._clickHandler(event);
                if (now - this._lastClickMoment < EVENT.touchClickDelay / 2) {
                    this._dblclickHandler(event);
                    if (this._lastHover && this._lastHover.clickable) {
                        eventTool.stop(event);
                    }
                }
                this._lastClickMoment = now;
            }
            this.painter.clearHover();
        }
    };
    /**
         * bind一个参数的function
         * 
         * @inner
         * @param {Function} handler 要bind的function
         * @param {Object} context 运行时this环境
         * @return {Function}
         */
    function bind1Arg(handler, context) {
        return function(e) {
            return handler.call(context, e);
        };
    }
    /**function bind2Arg(handler, context) {
            return function (arg1, arg2) {
                return handler.call(context, arg1, arg2);
            };
        }*/
    function bind3Arg(handler, context) {
        return function(arg1, arg2, arg3) {
            return handler.call(context, arg1, arg2, arg3);
        };
    }
    /**
         * 为控制类实例初始化dom 事件处理函数
         * 
         * @inner
         * @param {module:zrender/Handler} instance 控制类实例
         */
    function initDomHandler(instance) {
        var len = domHandlerNames.length;
        while (len--) {
            var name = domHandlerNames[len];
            instance["_" + name + "Handler"] = bind1Arg(domHandlers[name], instance);
        }
    }
    /**
         * @alias module:zrender/Handler
         * @constructor
         * @extends module:zrender/mixin/Eventful
         * @param {HTMLElement} root 绘图区域
         * @param {module:zrender/Storage} storage Storage实例
         * @param {module:zrender/Painter} painter Painter实例
         */
    var Handler = function(root, storage, painter) {
        // 添加事件分发器特性
        Eventful.call(this);
        this.root = root;
        this.storage = storage;
        this.painter = painter;
        // 各种事件标识的私有变量
        // this._hasfound = false;              //是否找到hover图形元素
        // this._lastHover = null;              //最后一个hover图形元素
        // this._mouseDownTarget = null;
        // this._draggingTarget = null;         //当前被拖拽的图形元素
        // this._isMouseDown = false;
        // this._isDragging = false;
        // this._lastMouseDownMoment;
        // this._lastTouchMoment;
        // this._lastDownButton;
        this._lastX = this._lastY = this._mouseX = this._mouseY = 0;
        this._findHover = bind3Arg(findHover, this);
        this._domHover = painter.getDomHover();
        initDomHandler(this);
        // 初始化，事件绑定，支持的所有事件都由如下原生事件计算得来
        if (window.addEventListener) {
            window.addEventListener("resize", this._resizeHandler);
            if (env.os.tablet || env.os.phone) {
                // mobile支持
                root.addEventListener("touchstart", this._touchstartHandler);
                root.addEventListener("touchmove", this._touchmoveHandler);
                root.addEventListener("touchend", this._touchendHandler);
            } else {
                // mobile的click/move/up/down自己模拟
                root.addEventListener("click", this._clickHandler);
                root.addEventListener("dblclick", this._dblclickHandler);
                root.addEventListener("mousewheel", this._mousewheelHandler);
                root.addEventListener("mousemove", this._mousemoveHandler);
                root.addEventListener("mousedown", this._mousedownHandler);
                root.addEventListener("mouseup", this._mouseupHandler);
            }
            root.addEventListener("DOMMouseScroll", this._mousewheelHandler);
            root.addEventListener("mouseout", this._mouseoutHandler);
        } else {
            window.attachEvent("onresize", this._resizeHandler);
            root.attachEvent("onclick", this._clickHandler);
            //root.attachEvent('ondblclick ', this._dblclickHandler);
            root.ondblclick = this._dblclickHandler;
            root.attachEvent("onmousewheel", this._mousewheelHandler);
            root.attachEvent("onmousemove", this._mousemoveHandler);
            root.attachEvent("onmouseout", this._mouseoutHandler);
            root.attachEvent("onmousedown", this._mousedownHandler);
            root.attachEvent("onmouseup", this._mouseupHandler);
        }
    };
    /**
         * 自定义事件绑定
         * @param {string} eventName 事件名称，resize，hover，drag，etc~
         * @param {Function} handler 响应函数
         */
    Handler.prototype.on = function(eventName, handler) {
        this.bind(eventName, handler);
        return this;
    };
    /**
         * 自定义事件解绑
         * @param {string} eventName 事件名称，resize，hover，drag，etc~
         * @param {Function} handler 响应函数
         */
    Handler.prototype.un = function(eventName, handler) {
        this.unbind(eventName, handler);
        return this;
    };
    /**
         * 事件触发
         * @param {string} eventName 事件名称，resize，hover，drag，etc~
         * @param {event=} eventArgs event dom事件对象
         */
    Handler.prototype.trigger = function(eventName, eventArgs) {
        switch (eventName) {
          case EVENT.RESIZE:
          case EVENT.CLICK:
          case EVENT.DBLCLICK:
          case EVENT.MOUSEWHEEL:
          case EVENT.MOUSEMOVE:
          case EVENT.MOUSEDOWN:
          case EVENT.MOUSEUP:
          case EVENT.MOUSEOUT:
            this["_" + eventName + "Handler"](eventArgs);
            break;
        }
    };
    /**
         * 释放，解绑所有事件
         */
    Handler.prototype.dispose = function() {
        var root = this.root;
        if (window.removeEventListener) {
            window.removeEventListener("resize", this._resizeHandler);
            if (env.os.tablet || env.os.phone) {
                // mobile支持
                root.removeEventListener("touchstart", this._touchstartHandler);
                root.removeEventListener("touchmove", this._touchmoveHandler);
                root.removeEventListener("touchend", this._touchendHandler);
            } else {
                // mobile的click自己模拟
                root.removeEventListener("click", this._clickHandler);
                root.removeEventListener("dblclick", this._dblclickHandler);
                root.removeEventListener("mousewheel", this._mousewheelHandler);
                root.removeEventListener("mousemove", this._mousemoveHandler);
                root.removeEventListener("mousedown", this._mousedownHandler);
                root.removeEventListener("mouseup", this._mouseupHandler);
            }
            root.removeEventListener("DOMMouseScroll", this._mousewheelHandler);
            root.removeEventListener("mouseout", this._mouseoutHandler);
        } else {
            window.detachEvent("onresize", this._resizeHandler);
            root.detachEvent("onclick", this._clickHandler);
            root.detachEvent("dblclick", this._dblclickHandler);
            root.detachEvent("onmousewheel", this._mousewheelHandler);
            root.detachEvent("onmousemove", this._mousemoveHandler);
            root.detachEvent("onmouseout", this._mouseoutHandler);
            root.detachEvent("onmousedown", this._mousedownHandler);
            root.detachEvent("onmouseup", this._mouseupHandler);
        }
        this.root = this._domHover = this.storage = this.painter = null;
        this.un();
    };
    /**
         * 拖拽开始
         * 
         * @private
         * @param {Object} event 事件对象
         */
    Handler.prototype._processDragStart = function(event) {
        var _lastHover = this._lastHover;
        if (this._isMouseDown && _lastHover && _lastHover.draggable && !this._draggingTarget && this._mouseDownTarget == _lastHover) {
            // 拖拽点击生效时长阀门，某些场景需要降低拖拽敏感度
            if (_lastHover.dragEnableTime && new Date() - this._lastMouseDownMoment < _lastHover.dragEnableTime) {
                return;
            }
            var _draggingTarget = _lastHover;
            this._draggingTarget = _draggingTarget;
            this._isDragging = 1;
            _draggingTarget.invisible = true;
            this.storage.mod(_draggingTarget.id);
            // 分发config.EVENT.DRAGSTART事件
            this._dispatchAgency(_draggingTarget, EVENT.DRAGSTART, event);
            this.painter.refresh();
        }
    };
    /**
         * 拖拽进入目标元素
         * 
         * @private
         * @param {Object} event 事件对象
         */
    Handler.prototype._processDragEnter = function(event) {
        if (this._draggingTarget) {
            // 分发config.EVENT.DRAGENTER事件
            this._dispatchAgency(this._lastHover, EVENT.DRAGENTER, event, this._draggingTarget);
        }
    };
    /**
         * 拖拽在目标元素上移动
         * 
         * @private
         * @param {Object} event 事件对象
         */
    Handler.prototype._processDragOver = function(event) {
        if (this._draggingTarget) {
            // 分发config.EVENT.DRAGOVER事件
            this._dispatchAgency(this._lastHover, EVENT.DRAGOVER, event, this._draggingTarget);
        }
    };
    /**
         * 拖拽离开目标元素
         * 
         * @private
         * @param {Object} event 事件对象
         */
    Handler.prototype._processDragLeave = function(event) {
        if (this._draggingTarget) {
            // 分发config.EVENT.DRAGLEAVE事件
            this._dispatchAgency(this._lastHover, EVENT.DRAGLEAVE, event, this._draggingTarget);
        }
    };
    /**
         * 拖拽在目标元素上完成
         * 
         * @private
         * @param {Object} event 事件对象
         */
    Handler.prototype._processDrop = function(event) {
        if (this._draggingTarget) {
            this._draggingTarget.invisible = false;
            this.storage.mod(this._draggingTarget.id);
            this.painter.refresh();
            // 分发config.EVENT.DROP事件
            this._dispatchAgency(this._lastHover, EVENT.DROP, event, this._draggingTarget);
        }
    };
    /**
         * 拖拽结束
         * 
         * @private
         * @param {Object} event 事件对象
         */
    Handler.prototype._processDragEnd = function(event) {
        if (this._draggingTarget) {
            // 分发config.EVENT.DRAGEND事件
            this._dispatchAgency(this._draggingTarget, EVENT.DRAGEND, event);
            this._lastHover = null;
        }
        this._isDragging = 0;
        this._draggingTarget = null;
    };
    /**
         * 鼠标在某个图形元素上移动
         * 
         * @private
         * @param {Object} event 事件对象
         */
    Handler.prototype._processOverShape = function(event) {
        // 分发config.EVENT.MOUSEOVER事件
        this._dispatchAgency(this._lastHover, EVENT.MOUSEOVER, event);
    };
    /**
         * 鼠标离开某个图形元素
         * 
         * @private
         * @param {Object} event 事件对象
         */
    Handler.prototype._processOutShape = function(event) {
        // 分发config.EVENT.MOUSEOUT事件
        this._dispatchAgency(this._lastHover, EVENT.MOUSEOUT, event);
    };
    /**
         * 事件分发代理
         * 
         * @private
         * @param {Object} targetShape 目标图形元素
         * @param {string} eventName 事件名称
         * @param {Object} event 事件对象
         * @param {Object=} draggedShape 拖拽事件特有，当前被拖拽图形元素
         */
    Handler.prototype._dispatchAgency = function(targetShape, eventName, event, draggedShape) {
        var eventHandler = "on" + eventName;
        var eventPacket = {
            type: eventName,
            event: event,
            target: targetShape,
            cancelBubble: false
        };
        var el = targetShape;
        if (draggedShape) {
            eventPacket.dragged = draggedShape;
        }
        while (el) {
            el[eventHandler] && (eventPacket.cancelBubble = el[eventHandler](eventPacket));
            el.dispatch(eventName, eventPacket);
            el = el.parent;
            if (eventPacket.cancelBubble) {
                break;
            }
        }
        if (targetShape) {
            // 冒泡到顶级 zrender 对象
            if (!eventPacket.cancelBubble) {
                this.dispatch(eventName, eventPacket);
            }
        } else if (!draggedShape) {
            // 无hover目标，无拖拽对象，原生事件分发
            this.dispatch(eventName, {
                type: eventName,
                event: event
            });
        }
    };
    /**
         * 迭代寻找hover shape
         * @private
         * @method
         */
    Handler.prototype._iterateAndFindHover = function() {
        var invTransform = mat2d.create();
        return function() {
            var list = this.storage.getShapeList();
            var currentZLevel;
            var currentLayer;
            var tmp = [ 0, 0 ];
            for (var i = list.length - 1; i >= 0; i--) {
                var shape = list[i];
                if (currentZLevel !== shape.zlevel) {
                    currentLayer = this.painter.getLayer(shape.zlevel, currentLayer);
                    tmp[0] = this._mouseX;
                    tmp[1] = this._mouseY;
                    if (currentLayer.needTransform) {
                        mat2d.invert(invTransform, currentLayer.transform);
                        vec2.applyTransform(tmp, tmp, invTransform);
                    }
                }
                if (this._findHover(shape, tmp[0], tmp[1])) {
                    break;
                }
            }
        };
    }();
    // touch指尖错觉的尝试偏移量配置
    var MOBILE_TOUCH_OFFSETS = [ {
        x: 10
    }, {
        x: -20
    }, {
        x: 10,
        y: 10
    }, {
        y: -20
    } ];
    // touch有指尖错觉，四向尝试，让touch上的点击更好触发事件
    Handler.prototype._mobildFindFixed = function(event) {
        this._lastHover = null;
        this._mouseX = event.zrenderX;
        this._mouseY = event.zrenderY;
        this._event = event;
        this._iterateAndFindHover();
        for (var i = 0; !this._lastHover && i < MOBILE_TOUCH_OFFSETS.length; i++) {
            var offset = MOBILE_TOUCH_OFFSETS[i];
            offset.x && (this._mouseX += offset.x);
            offset.y && (this._mouseX += offset.y);
            this._iterateAndFindHover();
        }
        if (this._lastHover) {
            event.zrenderX = this._mouseX;
            event.zrenderY = this._mouseY;
        }
    };
    /**
         * 迭代函数，查找hover到的图形元素并即时做些事件分发
         * 
         * @inner
         * @param {Object} shape 图形元素
         * @param {number} x
         * @param {number} y
         */
    function findHover(shape, x, y) {
        if (this._draggingTarget && this._draggingTarget.id == shape.id || shape.isSilent()) {
            return false;
        }
        var event = this._event;
        if (shape.isCover(x, y)) {
            if (shape.hoverable) {
                this.storage.addHover(shape);
            }
            // 查找是否在 clipShape 中
            var p = shape.parent;
            while (p) {
                if (p.clipShape && !p.clipShape.isCover(this._mouseX, this._mouseY)) {
                    // 已经被祖先 clip 掉了
                    return false;
                }
                p = p.parent;
            }
            if (this._lastHover != shape) {
                this._processOutShape(event);
                // 可能出现config.EVENT.DRAGLEAVE事件
                this._processDragLeave(event);
                this._lastHover = shape;
                // 可能出现config.EVENT.DRAGENTER事件
                this._processDragEnter(event);
            }
            this._processOverShape(event);
            // 可能出现config.EVENT.DRAGOVER
            this._processDragOver(event);
            this._hasfound = 1;
            return true;
        }
        return false;
    }
    /**
         * 如果存在第三方嵌入的一些dom触发的事件，或touch事件，需要转换一下事件坐标
         * 
         * @private
         */
    Handler.prototype._zrenderEventFixed = function(event, isTouch) {
        if (event.zrenderFixed) {
            return event;
        }
        if (!isTouch) {
            event = event || window.event;
            // 进入对象优先~
            var target = event.toElement || event.relatedTarget || event.srcElement || event.target;
            if (target && target != this._domHover) {
                event.zrenderX = (typeof event.offsetX != "undefined" ? event.offsetX : event.layerX) + target.offsetLeft;
                event.zrenderY = (typeof event.offsetY != "undefined" ? event.offsetY : event.layerY) + target.offsetTop;
            }
        } else {
            var touch = event.type != "touchend" ? event.targetTouches[0] : event.changedTouches[0];
            if (touch) {
                var rBounding = this.root.getBoundingClientRect();
                // touch事件坐标是全屏的~
                event.zrenderX = touch.clientX - rBounding.left;
                event.zrenderY = touch.clientY - rBounding.top;
            }
        }
        event.zrenderFixed = 1;
        return event;
    };
    util.merge(Handler.prototype, Eventful.prototype, true);
    module.exports = Handler;
});

define("app/pc/canvaslib/tool/env", [], function(require, exports, module) {
    /**
 * echarts设备环境识别
 *
 * @desc echarts基于Canvas，纯Javascript图表库，提供直观，生动，可交互，可个性化定制的数据统计图表。
 * @author firede[firede@firede.us]
 * @desc thanks zepto.
 */
    // Zepto.js
    // (c) 2010-2013 Thomas Fuchs
    // Zepto.js may be freely distributed under the MIT license.
    function detect(ua) {
        var os = this.os = {};
        var browser = this.browser = {};
        var webkit = ua.match(/Web[kK]it[\/]{0,1}([\d.]+)/);
        var android = ua.match(/(Android);?[\s\/]+([\d.]+)?/);
        var ipad = ua.match(/(iPad).*OS\s([\d_]+)/);
        var ipod = ua.match(/(iPod)(.*OS\s([\d_]+))?/);
        var iphone = !ipad && ua.match(/(iPhone\sOS)\s([\d_]+)/);
        var webos = ua.match(/(webOS|hpwOS)[\s\/]([\d.]+)/);
        var touchpad = webos && ua.match(/TouchPad/);
        var kindle = ua.match(/Kindle\/([\d.]+)/);
        var silk = ua.match(/Silk\/([\d._]+)/);
        var blackberry = ua.match(/(BlackBerry).*Version\/([\d.]+)/);
        var bb10 = ua.match(/(BB10).*Version\/([\d.]+)/);
        var rimtabletos = ua.match(/(RIM\sTablet\sOS)\s([\d.]+)/);
        var playbook = ua.match(/PlayBook/);
        var chrome = ua.match(/Chrome\/([\d.]+)/) || ua.match(/CriOS\/([\d.]+)/);
        var firefox = ua.match(/Firefox\/([\d.]+)/);
        var ie = ua.match(/MSIE ([\d.]+)/);
        var safari = webkit && ua.match(/Mobile\//) && !chrome;
        var webview = ua.match(/(iPhone|iPod|iPad).*AppleWebKit(?!.*Safari)/) && !chrome;
        var ie = ua.match(/MSIE\s([\d.]+)/);
        // Todo: clean this up with a better OS/browser seperation:
        // - discern (more) between multiple browsers on android
        // - decide if kindle fire in silk mode is android or not
        // - Firefox on Android doesn't specify the Android version
        // - possibly devide in os, device and browser hashes
        if (browser.webkit = !!webkit) browser.version = webkit[1];
        if (android) os.android = true, os.version = android[2];
        if (iphone && !ipod) os.ios = os.iphone = true, os.version = iphone[2].replace(/_/g, ".");
        if (ipad) os.ios = os.ipad = true, os.version = ipad[2].replace(/_/g, ".");
        if (ipod) os.ios = os.ipod = true, os.version = ipod[3] ? ipod[3].replace(/_/g, ".") : null;
        if (webos) os.webos = true, os.version = webos[2];
        if (touchpad) os.touchpad = true;
        if (blackberry) os.blackberry = true, os.version = blackberry[2];
        if (bb10) os.bb10 = true, os.version = bb10[2];
        if (rimtabletos) os.rimtabletos = true, os.version = rimtabletos[2];
        if (playbook) browser.playbook = true;
        if (kindle) os.kindle = true, os.version = kindle[1];
        if (silk) browser.silk = true, browser.version = silk[1];
        if (!silk && os.android && ua.match(/Kindle Fire/)) browser.silk = true;
        if (chrome) browser.chrome = true, browser.version = chrome[1];
        if (firefox) browser.firefox = true, browser.version = firefox[1];
        if (ie) browser.ie = true, browser.version = ie[1];
        if (safari && (ua.match(/Safari/) || !!os.ios)) browser.safari = true;
        if (webview) browser.webview = true;
        if (ie) browser.ie = true, browser.version = ie[1];
        os.tablet = !!(ipad || playbook || android && !ua.match(/Mobile/) || firefox && ua.match(/Tablet/) || ie && !ua.match(/Phone/) && ua.match(/Touch/));
        os.phone = !!(!os.tablet && !os.ipod && (android || iphone || webos || blackberry || bb10 || chrome && ua.match(/Android/) || chrome && ua.match(/CriOS\/([\d.]+)/) || firefox && ua.match(/Mobile/) || ie && ua.match(/Touch/)));
        return {
            browser: browser,
            os: os,
            // 原生canvas支持，改极端点了
            // canvasSupported : !(browser.ie && parseFloat(browser.version) < 9)
            canvasSupported: document.createElement("canvas").getContext ? true : false
        };
    }
    module.exports = detect(navigator.userAgent);
});

define("app/pc/canvaslib/tool/event", [ "app/pc/canvaslib/mixin/Eventful" ], function(require, exports, module) {
    /**
 * 事件辅助类
 * @module zrender/tool/event
 * @author Kener (@Kener-林峰, kener.linfeng@gmail.com)
 */
    "use strict";
    var Eventful = require("app/pc/canvaslib/mixin/Eventful");
    /**
        * 提取鼠标（手指）x坐标
        * @memberOf module:zrender/tool/event
        * @param  {Event} e 事件.
        * @return {number} 鼠标（手指）x坐标.
        */
    function getX(e) {
        return typeof e.zrenderX != "undefined" && e.zrenderX || typeof e.offsetX != "undefined" && e.offsetX || typeof e.layerX != "undefined" && e.layerX || typeof e.clientX != "undefined" && e.clientX;
    }
    /**
        * 提取鼠标y坐标
        * @memberOf module:zrender/tool/event
        * @param  {Event} e 事件.
        * @return {number} 鼠标（手指）y坐标.
        */
    function getY(e) {
        return typeof e.zrenderY != "undefined" && e.zrenderY || typeof e.offsetY != "undefined" && e.offsetY || typeof e.layerY != "undefined" && e.layerY || typeof e.clientY != "undefined" && e.clientY;
    }
    /**
        * 提取鼠标滚轮变化
        * @memberOf module:zrender/tool/event
        * @param  {Event} e 事件.
        * @return {number} 滚轮变化，正值说明滚轮是向上滚动，如果是负值说明滚轮是向下滚动
        */
    function getDelta(e) {
        return typeof e.zrenderDelta != "undefined" && e.zrenderDelta || typeof e.wheelDelta != "undefined" && e.wheelDelta || typeof e.detail != "undefined" && -e.detail;
    }
    /**
         * 停止冒泡和阻止默认行为
         * @memberOf module:zrender/tool/event
         * @method
         * @param {Event} e : event对象
         */
    var stop = typeof window.addEventListener === "function" ? function(e) {
        e.preventDefault();
        e.stopPropagation();
        e.cancelBubble = true;
    } : function(e) {
        e.returnValue = false;
        e.cancelBubble = true;
    };
    module.exports = {
        getX: getX,
        getY: getY,
        getDelta: getDelta,
        stop: stop,
        // 做向上兼容
        Dispatcher: Eventful
    };
});

define("app/pc/canvaslib/mixin/Eventful", [], function(require, exports, module) {
    /**
 * 事件扩展
 * @module zrender/mixin/Eventful
 * @author Kener (@Kener-林峰, kener.linfeng@gmail.com)
 *         pissang (https://www.github.com/pissang)
 */
    /**
     * 事件分发器
     * @alias module:zrender/mixin/Eventful
     * @constructor
     */
    var Eventful = function() {
        this._handlers = {};
    };
    /**
     * 单次触发绑定，dispatch后销毁
     * 
     * @param {string} event 事件名
     * @param {Function} handler 响应函数
     * @param {Object} context
     */
    Eventful.prototype.one = function(event, handler, context) {
        var _h = this._handlers;
        if (!handler || !event) {
            return this;
        }
        if (!_h[event]) {
            _h[event] = [];
        }
        _h[event].push({
            h: handler,
            one: true,
            ctx: context || this
        });
        return this;
    };
    /**
     * 绑定事件
     * @param {string} event 事件名
     * @param {Function} handler 事件处理函数
     * @param {Object} context
     */
    Eventful.prototype.bind = function(event, handler, context) {
        var _h = this._handlers;
        if (!handler || !event) {
            return this;
        }
        if (!_h[event]) {
            _h[event] = [];
        }
        _h[event].push({
            h: handler,
            one: false,
            ctx: context || this
        });
        return this;
    };
    /**
     * 解绑事件
     * @param {string} event 事件名
     * @param {Function} [handler] 事件处理函数
     */
    Eventful.prototype.unbind = function(event, handler) {
        var _h = this._handlers;
        if (!event) {
            this._handlers = {};
            return this;
        }
        if (handler) {
            if (_h[event]) {
                var newList = [];
                for (var i = 0, l = _h[event].length; i < l; i++) {
                    if (_h[event][i]["h"] != handler) {
                        newList.push(_h[event][i]);
                    }
                }
                _h[event] = newList;
            }
            if (_h[event] && _h[event].length === 0) {
                delete _h[event];
            }
        } else {
            delete _h[event];
        }
        return this;
    };
    /**
     * 事件分发
     * 
     * @param {string} type 事件类型
     */
    Eventful.prototype.dispatch = function(type) {
        if (this._handlers[type]) {
            var args = arguments;
            var argLen = args.length;
            if (argLen > 3) {
                args = Array.prototype.slice.call(args, 1);
            }
            var _h = this._handlers[type];
            var len = _h.length;
            for (var i = 0; i < len; ) {
                // Optimize advise from backbone
                switch (argLen) {
                  case 1:
                    _h[i]["h"].call(_h[i]["ctx"]);
                    break;

                  case 2:
                    _h[i]["h"].call(_h[i]["ctx"], args[1]);
                    break;

                  case 3:
                    _h[i]["h"].call(_h[i]["ctx"], args[1], args[2]);
                    break;

                  default:
                    // have more than 2 given arguments
                    _h[i]["h"].apply(_h[i]["ctx"], args);
                    break;
                }
                if (_h[i]["one"]) {
                    _h.splice(i, 1);
                    len--;
                } else {
                    i++;
                }
            }
        }
        return this;
    };
    /**
     * 带有context的事件分发, 最后一个参数是事件回调的context
     * @param {string} type 事件类型
     */
    Eventful.prototype.dispatchWithContext = function(type) {
        if (this._handlers[type]) {
            var args = arguments;
            var argLen = args.length;
            if (argLen > 4) {
                args = Array.prototype.slice.call(args, 1, args.length - 1);
            }
            var ctx = args[args.length - 1];
            var _h = this._handlers[type];
            var len = _h.length;
            for (var i = 0; i < len; ) {
                // Optimize advise from backbone
                switch (argLen) {
                  case 1:
                    _h[i]["h"].call(ctx);
                    break;

                  case 2:
                    _h[i]["h"].call(ctx, args[1]);
                    break;

                  case 3:
                    _h[i]["h"].call(ctx, args[1], args[2]);
                    break;

                  default:
                    // have more than 2 given arguments
                    _h[i]["h"].apply(ctx, args);
                    break;
                }
                if (_h[i]["one"]) {
                    _h.splice(i, 1);
                    len--;
                } else {
                    i++;
                }
            }
        }
        return this;
    };
    module.exports = Eventful;
});

define("app/pc/canvaslib/tool/vector", [], function(require, exports, module) {
    var ArrayCtor = typeof Float32Array === "undefined" ? Array : Float32Array;
    /**
         * @typedef {Float32Array|Array.<number>} Vector2
         */
    /**
         * 二维向量类
         * @exports zrender/tool/vector
         */
    var vector = {
        /**
             * 创建一个向量
             * @param {number} [x=0]
             * @param {number} [y=0]
             * @return {Vector2}
             */
        create: function(x, y) {
            var out = new ArrayCtor(2);
            out[0] = x || 0;
            out[1] = y || 0;
            return out;
        },
        /**
             * 复制一个向量
             * @return {Vector2} out
             * @return {Vector2} v
             */
        copy: function(out, v) {
            out[0] = v[0];
            out[1] = v[1];
            return out;
        },
        /**
             * 设置向量的两个项
             * @param {Vector2} out
             * @param {number} a
             * @param {number} b
             * @return {Vector2} 结果
             */
        set: function(out, a, b) {
            out[0] = a;
            out[1] = b;
            return out;
        },
        /**
             * 向量相加
             * @param {Vector2} out
             * @param {Vector2} v1
             * @param {Vector2} v2
             */
        add: function(out, v1, v2) {
            out[0] = v1[0] + v2[0];
            out[1] = v1[1] + v2[1];
            return out;
        },
        /**
             * 向量缩放后相加
             * @param {Vector2} out
             * @param {Vector2} v1
             * @param {Vector2} v2
             * @param {number} a
             */
        scaleAndAdd: function(out, v1, v2, a) {
            out[0] = v1[0] + v2[0] * a;
            out[1] = v1[1] + v2[1] * a;
            return out;
        },
        /**
             * 向量相减
             * @param {Vector2} out
             * @param {Vector2} v1
             * @param {Vector2} v2
             */
        sub: function(out, v1, v2) {
            out[0] = v1[0] - v2[0];
            out[1] = v1[1] - v2[1];
            return out;
        },
        /**
             * 向量长度
             * @param {Vector2} v
             * @return {number}
             */
        len: function(v) {
            return Math.sqrt(this.lenSquare(v));
        },
        /**
             * 向量长度平方
             * @param {Vector2} v
             * @return {number}
             */
        lenSquare: function(v) {
            return v[0] * v[0] + v[1] * v[1];
        },
        /**
             * 向量乘法
             * @param {Vector2} out
             * @param {Vector2} v1
             * @param {Vector2} v2
             */
        mul: function(out, v1, v2) {
            out[0] = v1[0] * v2[0];
            out[1] = v1[1] * v2[1];
            return out;
        },
        /**
             * 向量除法
             * @param {Vector2} out
             * @param {Vector2} v1
             * @param {Vector2} v2
             */
        div: function(out, v1, v2) {
            out[0] = v1[0] / v2[0];
            out[1] = v1[1] / v2[1];
            return out;
        },
        /**
             * 向量点乘
             * @param {Vector2} v1
             * @param {Vector2} v2
             * @return {number}
             */
        dot: function(v1, v2) {
            return v1[0] * v2[0] + v1[1] * v2[1];
        },
        /**
             * 向量缩放
             * @param {Vector2} out
             * @param {Vector2} v
             * @param {number} s
             */
        scale: function(out, v, s) {
            out[0] = v[0] * s;
            out[1] = v[1] * s;
            return out;
        },
        /**
             * 向量归一化
             * @param {Vector2} out
             * @param {Vector2} v
             */
        normalize: function(out, v) {
            var d = vector.len(v);
            if (d === 0) {
                out[0] = 0;
                out[1] = 0;
            } else {
                out[0] = v[0] / d;
                out[1] = v[1] / d;
            }
            return out;
        },
        /**
             * 计算向量间距离
             * @param {Vector2} v1
             * @param {Vector2} v2
             * @return {number}
             */
        distance: function(v1, v2) {
            return Math.sqrt((v1[0] - v2[0]) * (v1[0] - v2[0]) + (v1[1] - v2[1]) * (v1[1] - v2[1]));
        },
        /**
             * 向量距离平方
             * @param {Vector2} v1
             * @param {Vector2} v2
             * @return {number}
             */
        distanceSquare: function(v1, v2) {
            return (v1[0] - v2[0]) * (v1[0] - v2[0]) + (v1[1] - v2[1]) * (v1[1] - v2[1]);
        },
        /**
             * 求负向量
             * @param {Vector2} out
             * @param {Vector2} v
             */
        negate: function(out, v) {
            out[0] = -v[0];
            out[1] = -v[1];
            return out;
        },
        /**
             * 插值两个点
             * @param {Vector2} out
             * @param {Vector2} v1
             * @param {Vector2} v2
             * @param {number} t
             */
        lerp: function(out, v1, v2, t) {
            // var ax = v1[0];
            // var ay = v1[1];
            out[0] = v1[0] + t * (v2[0] - v1[0]);
            out[1] = v1[1] + t * (v2[1] - v1[1]);
            return out;
        },
        /**
             * 矩阵左乘向量
             * @param {Vector2} out
             * @param {Vector2} v
             * @param {Vector2} m
             */
        applyTransform: function(out, v, m) {
            var x = v[0];
            var y = v[1];
            out[0] = m[0] * x + m[2] * y + m[4];
            out[1] = m[1] * x + m[3] * y + m[5];
            return out;
        },
        /**
             * 求两个向量最小值
             * @param  {Vector2} out
             * @param  {Vector2} v1
             * @param  {Vector2} v2
             */
        min: function(out, v1, v2) {
            out[0] = Math.min(v1[0], v2[0]);
            out[1] = Math.min(v1[1], v2[1]);
            return out;
        },
        /**
             * 求两个向量最大值
             * @param  {Vector2} out
             * @param  {Vector2} v1
             * @param  {Vector2} v2
             */
        max: function(out, v1, v2) {
            out[0] = Math.max(v1[0], v2[0]);
            out[1] = Math.max(v1[1], v2[1]);
            return out;
        }
    };
    vector.length = vector.len;
    vector.lengthSquare = vector.lenSquare;
    vector.dist = vector.distance;
    vector.distSquare = vector.distanceSquare;
    module.exports = vector;
});

define("app/pc/canvaslib/tool/matrix", [], function(require, exports, module) {
    var ArrayCtor = typeof Float32Array === "undefined" ? Array : Float32Array;
    /**
         * 3x2矩阵操作类
         * @exports zrender/tool/matrix
         */
    var matrix = {
        /**
             * 创建一个单位矩阵
             * @return {Float32Array|Array.<number>}
             */
        create: function() {
            var out = new ArrayCtor(6);
            matrix.identity(out);
            return out;
        },
        /**
             * 设置矩阵为单位矩阵
             * @param {Float32Array|Array.<number>} out
             */
        identity: function(out) {
            out[0] = 1;
            out[1] = 0;
            out[2] = 0;
            out[3] = 1;
            out[4] = 0;
            out[5] = 0;
            return out;
        },
        /**
             * 复制矩阵
             * @param {Float32Array|Array.<number>} out
             * @param {Float32Array|Array.<number>} m
             */
        copy: function(out, m) {
            out[0] = m[0];
            out[1] = m[1];
            out[2] = m[2];
            out[3] = m[3];
            out[4] = m[4];
            out[5] = m[5];
            return out;
        },
        /**
             * 矩阵相乘
             * @param {Float32Array|Array.<number>} out
             * @param {Float32Array|Array.<number>} m1
             * @param {Float32Array|Array.<number>} m2
             */
        mul: function(out, m1, m2) {
            out[0] = m1[0] * m2[0] + m1[2] * m2[1];
            out[1] = m1[1] * m2[0] + m1[3] * m2[1];
            out[2] = m1[0] * m2[2] + m1[2] * m2[3];
            out[3] = m1[1] * m2[2] + m1[3] * m2[3];
            out[4] = m1[0] * m2[4] + m1[2] * m2[5] + m1[4];
            out[5] = m1[1] * m2[4] + m1[3] * m2[5] + m1[5];
            return out;
        },
        /**
             * 平移变换
             * @param {Float32Array|Array.<number>} out
             * @param {Float32Array|Array.<number>} a
             * @param {Float32Array|Array.<number>} v
             */
        translate: function(out, a, v) {
            out[0] = a[0];
            out[1] = a[1];
            out[2] = a[2];
            out[3] = a[3];
            out[4] = a[4] + v[0];
            out[5] = a[5] + v[1];
            return out;
        },
        /**
             * 旋转变换
             * @param {Float32Array|Array.<number>} out
             * @param {Float32Array|Array.<number>} a
             * @param {number} rad
             */
        rotate: function(out, a, rad) {
            var aa = a[0];
            var ac = a[2];
            var atx = a[4];
            var ab = a[1];
            var ad = a[3];
            var aty = a[5];
            var st = Math.sin(rad);
            var ct = Math.cos(rad);
            out[0] = aa * ct + ab * st;
            out[1] = -aa * st + ab * ct;
            out[2] = ac * ct + ad * st;
            out[3] = -ac * st + ct * ad;
            out[4] = ct * atx + st * aty;
            out[5] = ct * aty - st * atx;
            return out;
        },
        /**
             * 缩放变换
             * @param {Float32Array|Array.<number>} out
             * @param {Float32Array|Array.<number>} a
             * @param {Float32Array|Array.<number>} v
             */
        scale: function(out, a, v) {
            var vx = v[0];
            var vy = v[1];
            out[0] = a[0] * vx;
            out[1] = a[1] * vy;
            out[2] = a[2] * vx;
            out[3] = a[3] * vy;
            out[4] = a[4] * vx;
            out[5] = a[5] * vy;
            return out;
        },
        /**
             * 求逆矩阵
             * @param {Float32Array|Array.<number>} out
             * @param {Float32Array|Array.<number>} a
             */
        invert: function(out, a) {
            var aa = a[0];
            var ac = a[2];
            var atx = a[4];
            var ab = a[1];
            var ad = a[3];
            var aty = a[5];
            var det = aa * ad - ab * ac;
            if (!det) {
                return null;
            }
            det = 1 / det;
            out[0] = ad * det;
            out[1] = -ab * det;
            out[2] = -ac * det;
            out[3] = aa * det;
            out[4] = (ac * aty - ad * atx) * det;
            out[5] = (ab * atx - aa * aty) * det;
            return out;
        },
        /**
             * 矩阵左乘向量
             * @param {Float32Array|Array.<number>} out
             * @param {Float32Array|Array.<number>} a
             * @param {Float32Array|Array.<number>} v
             */
        mulVector: function(out, a, v) {
            var aa = a[0];
            var ac = a[2];
            var atx = a[4];
            var ab = a[1];
            var ad = a[3];
            var aty = a[5];
            out[0] = v[0] * aa + v[1] * ac + atx;
            out[1] = v[0] * ab + v[1] * ad + aty;
            return out;
        }
    };
    module.exports = matrix;
});

define("app/pc/canvaslib/Painter", [ "app/pc/canvaslib/config", "app/pc/canvaslib/tool/util", "app/pc/canvaslib/dep/excanvas", "app/pc/canvaslib/tool/log", "app/pc/canvaslib/tool/matrix", "app/pc/canvaslib/loadingEffect/Base", "app/pc/canvaslib/shape/Text", "app/pc/canvaslib/tool/area", "app/pc/canvaslib/tool/curve", "app/pc/canvaslib/tool/vector", "app/pc/canvaslib/shape/Base", "app/pc/canvaslib/tool/guid", "app/pc/canvaslib/mixin/Transformable", "app/pc/canvaslib/mixin/Eventful", "app/pc/canvaslib/tool/color", "app/pc/canvaslib/shape/Rectangle", "app/pc/canvaslib/shape/Image" ], function(require, exports, module) {
    /**
 * Painter绘图模块
 * @module zrender/Painter
 * @author Kener (@Kener-林峰, kener.linfeng@gmail.com)
 *         errorrik (errorrik@gmail.com)
 *         pissang (https://www.github.com/pissang)
 */
    "use strict";
    var config = require("app/pc/canvaslib/config");
    var util = require("app/pc/canvaslib/tool/util");
    // var vec2 = require('./tool/vector');
    var log = require("app/pc/canvaslib/tool/log");
    var matrix = require("app/pc/canvaslib/tool/matrix");
    var BaseLoadingEffect = require("app/pc/canvaslib/loadingEffect/Base");
    var Transformable = require("app/pc/canvaslib/mixin/Transformable");
    // retina 屏幕优化
    var devicePixelRatio = window.devicePixelRatio || 1;
    devicePixelRatio = Math.max(devicePixelRatio, 1);
    var vmlCanvasManager = window["G_vmlCanvasManager"];
    // 返回false的方法，用于避免页面被选中
    function returnFalse() {
        return false;
    }
    // 什么都不干的空方法
    function doNothing() {}
    /**
         * @alias module:zrender/Painter
         * @constructor
         * @param {HTMLElement} root 绘图容器
         * @param {module:zrender/Storage} storage
         */
    var Painter = function(root, storage) {
        /**
             * 绘图容器
             * @type {HTMLElement}
             */
        this.root = root;
        /**
             * @type {module:zrender/Storage}
             */
        this.storage = storage;
        root.innerHTML = "";
        this._width = this._getWidth();
        // 宽，缓存记录
        this._height = this._getHeight();
        // 高，缓存记录
        var domRoot = document.createElement("div");
        this._domRoot = domRoot;
        // domRoot.onselectstart = returnFalse; // 避免页面选中的尴尬
        domRoot.style.position = "relative";
        domRoot.style.overflow = "hidden";
        domRoot.style.width = this._width + "px";
        domRoot.style.height = this._height + "px";
        root.appendChild(domRoot);
        this._layers = {};
        this._zlevelList = [];
        this._layerConfig = {};
        this._loadingEffect = new BaseLoadingEffect({});
        this.shapeToImage = this._createShapeToImageProcessor();
        // 创建各层canvas
        // 背景
        this._bgDom = createDom("bg", "div", this);
        domRoot.appendChild(this._bgDom);
        this._bgDom.onselectstart = returnFalse;
        this._bgDom.style["-webkit-user-select"] = "none";
        this._bgDom.style["user-select"] = "none";
        this._bgDom.style["-webkit-touch-callout"] = "none";
        // 高亮
        var hoverLayer = new Layer("_zrender_hover_", this);
        this._layers["hover"] = hoverLayer;
        domRoot.appendChild(hoverLayer.dom);
        hoverLayer.initContext();
        hoverLayer.dom.onselectstart = returnFalse;
        hoverLayer.dom.style["-webkit-user-select"] = "none";
        hoverLayer.dom.style["user-select"] = "none";
        hoverLayer.dom.style["-webkit-touch-callout"] = "none";
        // Will be injected by zrender instance
        this.refreshNextFrame = null;
    };
    /**
         * 首次绘图，创建各种dom和context
         * 
         * @param {Function} callback 绘画结束后的回调函数
         */
    Painter.prototype.render = function(callback) {
        if (this.isLoading()) {
            this.hideLoading();
        }
        // TODO
        this.refresh(callback, true);
        return this;
    };
    /**
         * 刷新
         * @param {Function} callback 刷新结束后的回调函数
         * @param {boolean} paintAll 强制绘制所有shape
         */
    Painter.prototype.refresh = function(callback, paintAll) {
        var list = this.storage.getShapeList(true);
        this._paintList(list, paintAll);
        if (typeof callback == "function") {
            callback();
        }
        return this;
    };
    Painter.prototype._paintList = function(list, paintAll) {
        if (typeof paintAll == "undefined") {
            paintAll = false;
        }
        this._updateLayerStatus(list);
        var currentLayer;
        var currentZLevel;
        var ctx;
        for (var id in this._layers) {
            if (id !== "hover") {
                this._layers[id].unusedCount++;
                this._layers[id].updateTransform();
            }
        }
        var invTransform = [];
        for (var i = 0, l = list.length; i < l; i++) {
            var shape = list[i];
            if (currentZLevel !== shape.zlevel) {
                if (currentLayer) {
                    if (currentLayer.needTransform) {
                        ctx.restore();
                    }
                    ctx.flush && ctx.flush();
                }
                currentLayer = this.getLayer(shape.zlevel);
                ctx = currentLayer.ctx;
                currentZLevel = shape.zlevel;
                // Reset the count
                currentLayer.unusedCount = 0;
                if (currentLayer.dirty || paintAll) {
                    currentLayer.clear();
                }
                if (currentLayer.needTransform) {
                    ctx.save();
                    currentLayer.setTransform(ctx);
                }
            }
            // Start group clipping
            if (shape.__startClip && !vmlCanvasManager) {
                var clipShape = shape.__startClip;
                ctx.save();
                // Set transform
                if (clipShape.needTransform) {
                    var m = clipShape.transform;
                    matrix.invert(invTransform, m);
                    ctx.transform(m[0], m[1], m[2], m[3], m[4], m[5]);
                }
                ctx.beginPath();
                clipShape.buildPath(ctx, clipShape.style);
                ctx.clip();
                // Transform back
                if (clipShape.needTransform) {
                    var m = invTransform;
                    ctx.transform(m[0], m[1], m[2], m[3], m[4], m[5]);
                }
            }
            if ((currentLayer.dirty || paintAll) && !shape.invisible) {
                if (!shape.onbrush || shape.onbrush && !shape.onbrush(ctx, false)) {
                    if (config.catchBrushException) {
                        try {
                            shape.brush(ctx, false, this.refreshNextFrame);
                        } catch (error) {
                            log(error, "brush error of " + shape.type, shape);
                        }
                    } else {
                        shape.brush(ctx, false, this.refreshNextFrame);
                    }
                }
            }
            // Stop group clipping
            if (shape.__stopClip && !vmlCanvasManager) {
                ctx.restore();
            }
            shape.__dirty = false;
        }
        if (currentLayer) {
            if (currentLayer.needTransform) {
                ctx.restore();
            }
            ctx.flush && ctx.flush();
        }
        for (var id in this._layers) {
            if (id !== "hover") {
                var layer = this._layers[id];
                layer.dirty = false;
                // 删除过期的层
                // PENDING
                // if (layer.unusedCount >= 500) {
                //     this.delLayer(id);
                // }
                if (layer.unusedCount == 1) {
                    layer.clear();
                }
            }
        }
    };
    /**
         * 获取 zlevel 所在层，如果不存在则会创建一个新的层
         * @param {number} zlevel
         */
    Painter.prototype.getLayer = function(zlevel) {
        // Change draw layer
        var currentLayer = this._layers[zlevel];
        if (!currentLayer) {
            var len = this._zlevelList.length;
            var prevLayer = null;
            var i = -1;
            if (len > 0 && zlevel > this._zlevelList[0]) {
                for (i = 0; i < len - 1; i++) {
                    if (this._zlevelList[i] < zlevel && this._zlevelList[i + 1] > zlevel) {
                        break;
                    }
                }
                prevLayer = this._layers[this._zlevelList[i]];
            }
            this._zlevelList.splice(i + 1, 0, zlevel);
            // Create a new layer
            currentLayer = new Layer(zlevel, this);
            var prevDom = prevLayer ? prevLayer.dom : this._bgDom;
            if (prevDom.nextSibling) {
                prevDom.parentNode.insertBefore(currentLayer.dom, prevDom.nextSibling);
            } else {
                prevDom.parentNode.appendChild(currentLayer.dom);
            }
            currentLayer.initContext();
            this._layers[zlevel] = currentLayer;
            if (this._layerConfig[zlevel]) {
                util.merge(currentLayer, this._layerConfig[zlevel], true);
            }
            currentLayer.updateTransform();
        }
        return currentLayer;
    };
    /**
         * 获取所有已创建的层
         * @param {Array.<module:zrender/Painter~Layer>} [prevLayer]
         */
    Painter.prototype.getLayers = function() {
        return this._layers;
    };
    Painter.prototype._updateLayerStatus = function(list) {
        var layers = this._layers;
        var elCounts = {};
        for (var z in layers) {
            if (z !== "hover") {
                elCounts[z] = layers[z].elCount;
                layers[z].elCount = 0;
            }
        }
        for (var i = 0, l = list.length; i < l; i++) {
            var shape = list[i];
            var zlevel = shape.zlevel;
            var layer = layers[zlevel];
            if (layer) {
                layer.elCount++;
                // 已经被标记为需要刷新
                if (layer.dirty) {
                    continue;
                }
                layer.dirty = shape.__dirty;
            }
        }
        // 层中的元素数量有发生变化
        for (var z in layers) {
            if (z !== "hover") {
                if (elCounts[z] !== layers[z].elCount) {
                    layers[z].dirty = true;
                }
            }
        }
    };
    /**
         * 指定的图形列表
         * @param {Array.<module:zrender/shape/Base>} shapeList 需要更新的图形元素列表
         * @param {Function} [callback] 视图更新后回调函数
         */
    Painter.prototype.refreshShapes = function(shapeList, callback) {
        for (var i = 0, l = shapeList.length; i < l; i++) {
            var shape = shapeList[i];
            shape.modSelf();
        }
        this.refresh(callback);
        return this;
    };
    /**
         * 设置loading特效
         * 
         * @param {Object} loadingEffect loading特效
         * @return {Painter}
         */
    Painter.prototype.setLoadingEffect = function(loadingEffect) {
        this._loadingEffect = loadingEffect;
        return this;
    };
    /**
         * 清除hover层外所有内容
         */
    Painter.prototype.clear = function() {
        for (var k in this._layers) {
            if (k == "hover") {
                continue;
            }
            this._layers[k].clear();
        }
        return this;
    };
    /**
         * 修改指定zlevel的绘制参数
         * 
         * @param {string} zlevel
         * @param {Object} config 配置对象
         * @param {string} [config.clearColor=0] 每次清空画布的颜色
         * @param {string} [config.motionBlur=false] 是否开启动态模糊
         * @param {number} [config.lastFrameAlpha=0.7]
         *                 在开启动态模糊的时候使用，与上一帧混合的alpha值，值越大尾迹越明显
         * @param {Array.<number>} [position] 层的平移
         * @param {Array.<number>} [rotation] 层的旋转
         * @param {Array.<number>} [scale] 层的缩放
         * @param {boolean} [zoomable=false] 层是否支持鼠标缩放操作
         * @param {boolean} [panable=false] 层是否支持鼠标平移操作
         */
    Painter.prototype.modLayer = function(zlevel, config) {
        if (config) {
            if (!this._layerConfig[zlevel]) {
                this._layerConfig[zlevel] = config;
            } else {
                util.merge(this._layerConfig[zlevel], config, true);
            }
            var layer = this._layers[zlevel];
            if (layer) {
                util.merge(layer, this._layerConfig[zlevel], true);
            }
        }
    };
    /**
         * 删除指定层
         * @param {number} zlevel 层所在的zlevel
         */
    Painter.prototype.delLayer = function(zlevel) {
        var layer = this._layers[zlevel];
        if (!layer) {
            return;
        }
        // Save config
        this.modLayer(zlevel, {
            position: layer.position,
            rotation: layer.rotation,
            scale: layer.scale
        });
        layer.dom.parentNode.removeChild(layer.dom);
        delete this._layers[zlevel];
        this._zlevelList.splice(util.indexOf(this._zlevelList, zlevel), 1);
    };
    /**
         * 刷新hover层
         */
    Painter.prototype.refreshHover = function() {
        this.clearHover();
        var list = this.storage.getHoverShapes(true);
        for (var i = 0, l = list.length; i < l; i++) {
            this._brushHover(list[i]);
        }
        var ctx = this._layers.hover.ctx;
        ctx.flush && ctx.flush();
        this.storage.delHover();
        return this;
    };
    /**
         * 清除hover层所有内容
         */
    Painter.prototype.clearHover = function() {
        var hover = this._layers.hover;
        hover && hover.clear();
        return this;
    };
    /**
         * 显示loading
         * 
         * @param {Object=} loadingEffect loading效果对象
         */
    Painter.prototype.showLoading = function(loadingEffect) {
        this._loadingEffect && this._loadingEffect.stop();
        loadingEffect && this.setLoadingEffect(loadingEffect);
        this._loadingEffect.start(this);
        this.loading = true;
        return this;
    };
    /**
         * loading结束
         */
    Painter.prototype.hideLoading = function() {
        this._loadingEffect.stop();
        this.clearHover();
        this.loading = false;
        return this;
    };
    /**
         * loading结束判断
         */
    Painter.prototype.isLoading = function() {
        return this.loading;
    };
    /**
         * 区域大小变化后重绘
         */
    Painter.prototype.resize = function() {
        var domRoot = this._domRoot;
        domRoot.style.display = "none";
        var width = this._getWidth();
        var height = this._getHeight();
        domRoot.style.display = "";
        // 优化没有实际改变的resize
        if (this._width != width || height != this._height) {
            this._width = width;
            this._height = height;
            domRoot.style.width = width + "px";
            domRoot.style.height = height + "px";
            for (var id in this._layers) {
                this._layers[id].resize(width, height);
            }
            this.refresh(null, true);
        }
        return this;
    };
    /**
         * 清除单独的一个层
         * @param {number} zLevel
         */
    Painter.prototype.clearLayer = function(zLevel) {
        var layer = this._layers[zLevel];
        if (layer) {
            layer.clear();
        }
    };
    /**
         * 释放
         */
    Painter.prototype.dispose = function() {
        if (this.isLoading()) {
            this.hideLoading();
        }
        this.root.innerHTML = "";
        this.root = this.storage = this._domRoot = this._layers = null;
    };
    Painter.prototype.getDomHover = function() {
        return this._layers.hover.dom;
    };
    /**
         * 图像导出
         * @param {string} type
         * @param {string} [backgroundColor='#fff'] 背景色
         * @return {string} 图片的Base64 url
         */
    Painter.prototype.toDataURL = function(type, backgroundColor, args) {
        if (vmlCanvasManager) {
            return null;
        }
        var imageDom = createDom("image", "canvas", this);
        this._bgDom.appendChild(imageDom);
        var ctx = imageDom.getContext("2d");
        devicePixelRatio != 1 && ctx.scale(devicePixelRatio, devicePixelRatio);
        ctx.fillStyle = backgroundColor || "#fff";
        ctx.rect(0, 0, this._width * devicePixelRatio, this._height * devicePixelRatio);
        ctx.fill();
        var self = this;
        // 升序遍历，shape上的zlevel指定绘画图层的z轴层叠
        this.storage.iterShape(function(shape) {
            if (!shape.invisible) {
                if (!shape.onbrush || shape.onbrush && !shape.onbrush(ctx, false)) {
                    if (config.catchBrushException) {
                        try {
                            shape.brush(ctx, false, self.refreshNextFrame);
                        } catch (error) {
                            log(error, "brush error of " + shape.type, shape);
                        }
                    } else {
                        shape.brush(ctx, false, self.refreshNextFrame);
                    }
                }
            }
        }, {
            normal: "up",
            update: true
        });
        var image = imageDom.toDataURL(type, args);
        ctx = null;
        this._bgDom.removeChild(imageDom);
        return image;
    };
    /**
         * 获取绘图区域宽度
         */
    Painter.prototype.getWidth = function() {
        return this._width;
    };
    /**
         * 获取绘图区域高度
         */
    Painter.prototype.getHeight = function() {
        return this._height;
    };
    Painter.prototype._getWidth = function() {
        var root = this.root;
        var stl = root.currentStyle || document.defaultView.getComputedStyle(root);
        return ((root.clientWidth || parseInt(stl.width, 10)) - parseInt(stl.paddingLeft, 10) - parseInt(stl.paddingRight, 10)).toFixed(0) - 0;
    };
    Painter.prototype._getHeight = function() {
        var root = this.root;
        var stl = root.currentStyle || document.defaultView.getComputedStyle(root);
        return ((root.clientHeight || parseInt(stl.height, 10)) - parseInt(stl.paddingTop, 10) - parseInt(stl.paddingBottom, 10)).toFixed(0) - 0;
    };
    Painter.prototype._brushHover = function(shape) {
        var ctx = this._layers.hover.ctx;
        if (!shape.onbrush || shape.onbrush && !shape.onbrush(ctx, true)) {
            var layer = this.getLayer(shape.zlevel);
            if (layer.needTransform) {
                ctx.save();
                layer.setTransform(ctx);
            }
            // Retina 优化
            if (config.catchBrushException) {
                try {
                    shape.brush(ctx, true, this.refreshNextFrame);
                } catch (error) {
                    log(error, "hoverBrush error of " + shape.type, shape);
                }
            } else {
                shape.brush(ctx, true, this.refreshNextFrame);
            }
            if (layer.needTransform) {
                ctx.restore();
            }
        }
    };
    Painter.prototype._shapeToImage = function(id, shape, width, height, devicePixelRatio) {
        var canvas = document.createElement("canvas");
        var ctx = canvas.getContext("2d");
        var devicePixelRatio = window.devicePixelRatio || 1;
        canvas.style.width = width + "px";
        canvas.style.height = height + "px";
        canvas.setAttribute("width", width * devicePixelRatio);
        canvas.setAttribute("height", height * devicePixelRatio);
        ctx.clearRect(0, 0, width * devicePixelRatio, height * devicePixelRatio);
        var shapeTransform = {
            position: shape.position,
            rotation: shape.rotation,
            scale: shape.scale
        };
        shape.position = [ 0, 0, 0 ];
        shape.rotation = 0;
        shape.scale = [ 1, 1 ];
        if (shape) {
            shape.brush(ctx, false);
        }
        var ImageShape = require("app/pc/canvaslib/shape/Image");
        var imgShape = new ImageShape({
            id: id,
            style: {
                x: 0,
                y: 0,
                image: canvas
            }
        });
        if (shapeTransform.position != null) {
            imgShape.position = shape.position = shapeTransform.position;
        }
        if (shapeTransform.rotation != null) {
            imgShape.rotation = shape.rotation = shapeTransform.rotation;
        }
        if (shapeTransform.scale != null) {
            imgShape.scale = shape.scale = shapeTransform.scale;
        }
        return imgShape;
    };
    Painter.prototype._createShapeToImageProcessor = function() {
        if (vmlCanvasManager) {
            return doNothing;
        }
        var me = this;
        return function(id, e, width, height) {
            return me._shapeToImage(id, e, width, height, devicePixelRatio);
        };
    };
    /**
         * 创建dom
         * 
         * @inner
         * @param {string} id dom id 待用
         * @param {string} type dom type，such as canvas, div etc.
         * @param {Painter} painter painter instance
         */
    function createDom(id, type, painter) {
        var newDom = document.createElement(type);
        var width = painter._width;
        var height = painter._height;
        // 没append呢，请原谅我这样写，清晰~
        newDom.style.position = "absolute";
        newDom.style.left = 0;
        newDom.style.top = 0;
        newDom.style.width = width + "px";
        newDom.style.height = height + "px";
        newDom.setAttribute("width", width * devicePixelRatio);
        newDom.setAttribute("height", height * devicePixelRatio);
        // id不作为索引用，避免可能造成的重名，定义为私有属性
        newDom.setAttribute("data-zr-dom-id", id);
        return newDom;
    }
    /**
         * @alias module:zrender/Painter~Layer
         * @constructor
         * @extends module:zrender/mixin/Transformable
         * @param {string} id
         * @param {module:zrender/Painter} painter
         */
    var Layer = function(id, painter) {
        this.dom = createDom(id, "canvas", painter);
        this.dom.onselectstart = returnFalse;
        // 避免页面选中的尴尬
        this.dom.style["-webkit-user-select"] = "none";
        this.dom.style["user-select"] = "none";
        this.dom.style["-webkit-touch-callout"] = "none";
        vmlCanvasManager && vmlCanvasManager.initElement(this.dom);
        this.domBack = null;
        this.ctxBack = null;
        this.painter = painter;
        this.unusedCount = 0;
        this.config = null;
        this.dirty = true;
        this.elCount = 0;
        // Configs
        /**
             * 每次清空画布的颜色
             * @type {string}
             * @default 0
             */
        this.clearColor = 0;
        /**
             * 是否开启动态模糊
             * @type {boolean}
             * @default false
             */
        this.motionBlur = false;
        /**
             * 在开启动态模糊的时候使用，与上一帧混合的alpha值，值越大尾迹越明显
             * @type {number}
             * @default 0.7
             */
        this.lastFrameAlpha = .7;
        /**
             * 层是否支持鼠标平移操作
             * @type {boolean}
             * @default false
             */
        this.zoomable = false;
        /**
             * 层是否支持鼠标缩放操作
             * @type {boolean}
             * @default false
             */
        this.panable = false;
        this.maxZoom = Infinity;
        this.minZoom = 0;
        Transformable.call(this);
    };
    Layer.prototype.initContext = function() {
        this.ctx = this.dom.getContext("2d");
        if (devicePixelRatio != 1) {
            this.ctx.scale(devicePixelRatio, devicePixelRatio);
        }
    };
    Layer.prototype.createBackBuffer = function() {
        if (vmlCanvasManager) {
            // IE 8- should not support back buffer
            return;
        }
        this.domBack = createDom("back-" + this.id, "canvas", this.painter);
        this.ctxBack = this.domBack.getContext("2d");
        if (devicePixelRatio != 1) {
            this.ctxBack.scale(devicePixelRatio, devicePixelRatio);
        }
    };
    /**
         * @param  {number} width
         * @param  {number} height
         */
    Layer.prototype.resize = function(width, height) {
        this.dom.style.width = width + "px";
        this.dom.style.height = height + "px";
        this.dom.setAttribute("width", width * devicePixelRatio);
        this.dom.setAttribute("height", height * devicePixelRatio);
        if (devicePixelRatio != 1) {
            this.ctx.scale(devicePixelRatio, devicePixelRatio);
        }
        if (this.domBack) {
            this.domBack.setAttribute("width", width * devicePixelRatio);
            this.domBack.setAttribute("height", height * devicePixelRatio);
            if (devicePixelRatio != 1) {
                this.ctxBack.scale(devicePixelRatio, devicePixelRatio);
            }
        }
    };
    /**
         * 清空该层画布
         */
    Layer.prototype.clear = function() {
        var dom = this.dom;
        var ctx = this.ctx;
        var width = dom.width;
        var height = dom.height;
        var haveClearColor = this.clearColor && !vmlCanvasManager;
        var haveMotionBLur = this.motionBlur && !vmlCanvasManager;
        var lastFrameAlpha = this.lastFrameAlpha;
        if (haveMotionBLur) {
            if (!this.domBack) {
                this.createBackBuffer();
            }
            this.ctxBack.globalCompositeOperation = "copy";
            this.ctxBack.drawImage(dom, 0, 0, width / devicePixelRatio, height / devicePixelRatio);
        }
        if (haveClearColor) {
            ctx.save();
            ctx.fillStyle = this.config.clearColor;
            ctx.fillRect(0, 0, width / devicePixelRatio, height / devicePixelRatio);
            ctx.restore();
        } else {
            ctx.clearRect(0, 0, width / devicePixelRatio, height / devicePixelRatio);
        }
        if (haveMotionBLur) {
            var domBack = this.domBack;
            ctx.save();
            ctx.globalAlpha = lastFrameAlpha;
            ctx.drawImage(domBack, 0, 0, width / devicePixelRatio, height / devicePixelRatio);
            ctx.restore();
        }
    };
    util.merge(Layer.prototype, Transformable.prototype);
    module.exports = Painter;
});

define("app/pc/canvaslib/loadingEffect/Base", [ "app/pc/canvaslib/tool/util", "app/pc/canvaslib/dep/excanvas", "app/pc/canvaslib/shape/Text", "app/pc/canvaslib/tool/area", "app/pc/canvaslib/tool/curve", "app/pc/canvaslib/tool/vector", "app/pc/canvaslib/shape/Base", "app/pc/canvaslib/tool/matrix", "app/pc/canvaslib/tool/guid", "app/pc/canvaslib/tool/log", "app/pc/canvaslib/config", "app/pc/canvaslib/mixin/Transformable", "app/pc/canvaslib/mixin/Eventful", "app/pc/canvaslib/tool/color", "app/pc/canvaslib/shape/Rectangle" ], function(require, exports, module) {
    /**
 * zrender: loading特效类
 *
 * @author Kener (@Kener-林峰, kener.linfeng@gmail.com)
 *         errorrik (errorrik@gmail.com)
 */
    var util = require("app/pc/canvaslib/tool/util");
    var TextShape = require("app/pc/canvaslib/shape/Text");
    var RectangleShape = require("app/pc/canvaslib/shape/Rectangle");
    var DEFAULT_TEXT = "Loading...";
    var DEFAULT_TEXT_FONT = "normal 16px Arial";
    /**
         * @constructor
         * 
         * @param {Object} options 选项
         * @param {color} options.backgroundColor 背景颜色
         * @param {Object} options.textStyle 文字样式，同shape/text.style
         * @param {number=} options.progress 进度参数，部分特效有用
         * @param {Object=} options.effect 特效参数，部分特效有用
         * 
         * {
         *     effect,
         *     //loading话术
         *     text:'',
         *     // 水平安放位置，默认为 'center'，可指定x坐标
         *     x:'center' || 'left' || 'right' || {number},
         *     // 垂直安放位置，默认为'top'，可指定y坐标
         *     y:'top' || 'bottom' || {number},
         *
         *     textStyle:{
         *         textFont: 'normal 20px Arial' || {textFont}, //文本字体
         *         color: {color}
         *     }
         * }
         */
    function Base(options) {
        this.setOptions(options);
    }
    /**
         * 创建loading文字图形
         * 
         * @param {Object} textStyle 文字style，同shape/text.style
         */
    Base.prototype.createTextShape = function(textStyle) {
        return new TextShape({
            highlightStyle: util.merge({
                x: this.canvasWidth / 2,
                y: this.canvasHeight / 2,
                text: DEFAULT_TEXT,
                textAlign: "center",
                textBaseline: "middle",
                textFont: DEFAULT_TEXT_FONT,
                color: "#333",
                brushType: "fill"
            }, textStyle, true)
        });
    };
    /**
         * 获取loading背景图形
         * 
         * @param {color} color 背景颜色
         */
    Base.prototype.createBackgroundShape = function(color) {
        return new RectangleShape({
            highlightStyle: {
                x: 0,
                y: 0,
                width: this.canvasWidth,
                height: this.canvasHeight,
                brushType: "fill",
                color: color
            }
        });
    };
    Base.prototype.start = function(painter) {
        this.canvasWidth = painter._width;
        this.canvasHeight = painter._height;
        function addShapeHandle(param) {
            painter.storage.addHover(param);
        }
        function refreshHandle() {
            painter.refreshHover();
        }
        this.loadingTimer = this._start(addShapeHandle, refreshHandle);
    };
    Base.prototype._start = function() {
        return setInterval(function() {}, 1e4);
    };
    Base.prototype.stop = function() {
        clearInterval(this.loadingTimer);
    };
    Base.prototype.setOptions = function(options) {
        this.options = options || {};
    };
    Base.prototype.adjust = function(value, region) {
        if (value <= region[0]) {
            value = region[0];
        } else if (value >= region[1]) {
            value = region[1];
        }
        return value;
    };
    Base.prototype.getLocation = function(loc, totalWidth, totalHeight) {
        var x = loc.x != null ? loc.x : "center";
        switch (x) {
          case "center":
            x = Math.floor((this.canvasWidth - totalWidth) / 2);
            break;

          case "left":
            x = 0;
            break;

          case "right":
            x = this.canvasWidth - totalWidth;
            break;
        }
        var y = loc.y != null ? loc.y : "center";
        switch (y) {
          case "center":
            y = Math.floor((this.canvasHeight - totalHeight) / 2);
            break;

          case "top":
            y = 0;
            break;

          case "bottom":
            y = this.canvasHeight - totalHeight;
            break;
        }
        return {
            x: x,
            y: y,
            width: totalWidth,
            height: totalHeight
        };
    };
    module.exports = Base;
});

define("app/pc/canvaslib/shape/Text", [ "app/pc/canvaslib/tool/area", "app/pc/canvaslib/tool/util", "app/pc/canvaslib/dep/excanvas", "app/pc/canvaslib/tool/curve", "app/pc/canvaslib/tool/vector", "app/pc/canvaslib/shape/Base", "app/pc/canvaslib/tool/matrix", "app/pc/canvaslib/tool/guid", "app/pc/canvaslib/tool/log", "app/pc/canvaslib/config", "app/pc/canvaslib/mixin/Transformable", "app/pc/canvaslib/mixin/Eventful", "app/pc/canvaslib/tool/color" ], function(require, exports, module) {
    /**
 * @module zrender/shape/Text
 * @author Kener (@Kener-林峰, kener.linfeng@gmail.com)
 * @example
 *     var Text = require('zrender/shape/Text');
 *     var shape = new Text({
 *         style: {
 *             text: 'Label',
 *             x: 100,
 *             y: 100,
 *             textFont: '14px Arial'
 *         }
 *     });
 *     zr.addShape(shape);
 */
    /**
 * @typedef {Object} ITextStyle
 * @property {number} x 横坐标
 * @property {number} y 纵坐标
 * @property {string} text 文本内容
 * @property {number} [maxWidth=null] 最大宽度限制
 * @property {string} [textFont] 附加文本样式，eg:'bold 18px verdana'
 * @property {string} [textAlign] 默认根据textPosition自动设置，附加文本水平对齐。
 *                                可以是start, end, left, right, center
 * @property {string} [textBaseline] 默认根据textPosition自动设置，附加文本垂直对齐。
 *                                可以是top, bottom, middle, alphabetic, hanging, ideographic
 * @property {string} [brushType='fill']
 * @property {string} [color='#000000'] 填充颜色
 * @property {string} [strokeColor='#000000'] 描边颜色
 * @property {number} [lineWidth=1] 描边宽度
 * @property {number} [opacity=1] 绘制透明度
 * @property {number} [shadowBlur=0] 阴影模糊度，大于0有效
 * @property {string} [shadowColor='#000000'] 阴影颜色
 * @property {number} [shadowOffsetX=0] 阴影横向偏移
 * @property {number} [shadowOffsetY=0] 阴影纵向偏移
 */
    var area = require("app/pc/canvaslib/tool/area");
    var Base = require("app/pc/canvaslib/shape/Base");
    /**
         * @alias module:zrender/shape/Text
         * @constructor
         * @extends module:zrender/shape/Base
         * @param {Object} options
         */
    var Text = function(options) {
        Base.call(this, options);
    };
    Text.prototype = {
        type: "text",
        brush: function(ctx, isHighlight) {
            var style = this.style;
            if (isHighlight) {
                // 根据style扩展默认高亮样式
                style = this.getHighlightStyle(style, this.highlightStyle || {});
            }
            if (typeof style.text == "undefined" || style.text === false) {
                return;
            }
            ctx.save();
            this.doClip(ctx);
            this.setContext(ctx, style);
            // 设置transform
            this.setTransform(ctx);
            if (style.textFont) {
                ctx.font = style.textFont;
            }
            ctx.textAlign = style.textAlign || "start";
            ctx.textBaseline = style.textBaseline || "middle";
            var text = (style.text + "").split("\n");
            var lineHeight = area.getTextHeight("国", style.textFont);
            var rect = this.getRect(style);
            var x = style.x;
            var y;
            if (style.textBaseline == "top") {
                y = rect.y;
            } else if (style.textBaseline == "bottom") {
                y = rect.y + lineHeight;
            } else {
                y = rect.y + lineHeight / 2;
            }
            for (var i = 0, l = text.length; i < l; i++) {
                if (style.maxWidth) {
                    switch (style.brushType) {
                      case "fill":
                        ctx.fillText(text[i], x, y, style.maxWidth);
                        break;

                      case "stroke":
                        ctx.strokeText(text[i], x, y, style.maxWidth);
                        break;

                      case "both":
                        ctx.fillText(text[i], x, y, style.maxWidth);
                        ctx.strokeText(text[i], x, y, style.maxWidth);
                        break;

                      default:
                        ctx.fillText(text[i], x, y, style.maxWidth);
                    }
                } else {
                    switch (style.brushType) {
                      case "fill":
                        ctx.fillText(text[i], x, y);
                        break;

                      case "stroke":
                        ctx.strokeText(text[i], x, y);
                        break;

                      case "both":
                        ctx.fillText(text[i], x, y);
                        ctx.strokeText(text[i], x, y);
                        break;

                      default:
                        ctx.fillText(text[i], x, y);
                    }
                }
                y += lineHeight;
            }
            ctx.restore();
            return;
        },
        /**
             * 返回文字包围盒矩形
             * @param {module:zrender/shape/Text~ITextStyle} style
             * @return {module:zrender/shape/Base~IBoundingRect}
             */
        getRect: function(style) {
            if (style.__rect) {
                return style.__rect;
            }
            var width = area.getTextWidth(style.text, style.textFont);
            var height = area.getTextHeight(style.text, style.textFont);
            var textX = style.x;
            // 默认start == left
            if (style.textAlign == "end" || style.textAlign == "right") {
                textX -= width;
            } else if (style.textAlign == "center") {
                textX -= width / 2;
            }
            var textY;
            if (style.textBaseline == "top") {
                textY = style.y;
            } else if (style.textBaseline == "bottom") {
                textY = style.y - height;
            } else {
                // middle
                textY = style.y - height / 2;
            }
            style.__rect = {
                x: textX,
                y: textY,
                width: width,
                height: height
            };
            return style.__rect;
        }
    };
    require("app/pc/canvaslib/tool/util").inherits(Text, Base);
    module.exports = Text;
});

define("app/pc/canvaslib/tool/area", [ "app/pc/canvaslib/tool/util", "app/pc/canvaslib/dep/excanvas", "app/pc/canvaslib/tool/curve", "app/pc/canvaslib/tool/vector" ], function(require, exports, module) {
    /**
 * zrender: 图形空间辅助类
 *
 * @author Kener (@Kener-林峰, kener.linfeng@gmail.com)
 *         pissang (https://www.github.com/pissang)
 *
 * isInside：是否在区域内部
 * isOutside：是否在区域外部
 * getTextWidth：测算单行文本宽度
 */
    "use strict";
    var util = require("app/pc/canvaslib/tool/util");
    var curve = require("app/pc/canvaslib/tool/curve");
    var _ctx;
    var _textWidthCache = {};
    var _textHeightCache = {};
    var _textWidthCacheCounter = 0;
    var _textHeightCacheCounter = 0;
    var TEXT_CACHE_MAX = 5e3;
    var PI2 = Math.PI * 2;
    function normalizeRadian(angle) {
        angle %= PI2;
        if (angle < 0) {
            angle += PI2;
        }
        return angle;
    }
    /**
         * 包含判断
         *
         * @param {Object} shape : 图形
         * @param {Object} area ： 目标区域
         * @param {number} x ： 横坐标
         * @param {number} y ： 纵坐标
         */
    function isInside(shape, area, x, y) {
        if (!area || !shape) {
            // 无参数或不支持类型
            return false;
        }
        var zoneType = shape.type;
        _ctx = _ctx || util.getContext();
        // 未实现或不可用时(excanvas不支持)则数学运算，主要是line，brokenLine，ring
        var _mathReturn = _mathMethod(shape, area, x, y);
        if (typeof _mathReturn != "undefined") {
            return _mathReturn;
        }
        if (shape.buildPath && _ctx.isPointInPath) {
            return _buildPathMethod(shape, _ctx, area, x, y);
        }
        // 上面的方法都行不通时
        switch (zoneType) {
          case "ellipse":
            // Todo，不精确
            return true;

          // 旋轮曲线  不准确
            case "trochoid":
            var _r = area.location == "out" ? area.r1 + area.r2 + area.d : area.r1 - area.r2 + area.d;
            return isInsideCircle(area, x, y, _r);

          // 玫瑰线 不准确
            case "rose":
            return isInsideCircle(area, x, y, area.maxr);

          // 路径，椭圆，曲线等-----------------13
            default:
            return false;
        }
    }
    /**
         * 用数学方法判断，三个方法中最快，但是支持的shape少
         *
         * @param {Object} shape : 图形
         * @param {Object} area ：目标区域
         * @param {number} x ： 横坐标
         * @param {number} y ： 纵坐标
         * @return {boolean=} true表示坐标处在图形中
         */
    function _mathMethod(shape, area, x, y) {
        var zoneType = shape.type;
        // 在矩形内则部分图形需要进一步判断
        switch (zoneType) {
          // 贝塞尔曲线
            case "bezier-curve":
            if (typeof area.cpX2 === "undefined") {
                return isInsideQuadraticStroke(area.xStart, area.yStart, area.cpX1, area.cpY1, area.xEnd, area.yEnd, area.lineWidth, x, y);
            }
            return isInsideCubicStroke(area.xStart, area.yStart, area.cpX1, area.cpY1, area.cpX2, area.cpY2, area.xEnd, area.yEnd, area.lineWidth, x, y);

          // 线
            case "line":
            return isInsideLine(area.xStart, area.yStart, area.xEnd, area.yEnd, area.lineWidth, x, y);

          // 折线
            case "broken-line":
            return isInsideBrokenLine(area.pointList, area.lineWidth, x, y);

          // 圆环
            case "ring":
            return isInsideRing(area.x, area.y, area.r0, area.r, x, y);

          // 圆形
            case "circle":
            return isInsideCircle(area.x, area.y, area.r, x, y);

          // 扇形
            case "sector":
            var startAngle = area.startAngle * Math.PI / 180;
            var endAngle = area.endAngle * Math.PI / 180;
            if (!area.clockWise) {
                startAngle = -startAngle;
                endAngle = -endAngle;
            }
            return isInsideSector(area.x, area.y, area.r0, area.r, startAngle, endAngle, !area.clockWise, x, y);

          // 多边形
            case "path":
            return isInsidePath(area.pathArray, Math.max(area.lineWidth, 5), area.brushType, x, y);

          case "polygon":
          case "star":
          case "isogon":
            return isInsidePolygon(area.pointList, x, y);

          // 文本
            case "text":
            var rect = area.__rect || shape.getRect(area);
            return isInsideRect(rect.x, rect.y, rect.width, rect.height, x, y);

          // 矩形
            case "rectangle":
          // 图片
            case "image":
            return isInsideRect(area.x, area.y, area.width, area.height, x, y);
        }
    }
    /**
         * 通过buildPath方法来判断，三个方法中较快，但是不支持线条类型的shape，
         * 而且excanvas不支持isPointInPath方法
         *
         * @param {Object} shape ： shape
         * @param {Object} context : 上下文
         * @param {Object} area ：目标区域
         * @param {number} x ： 横坐标
         * @param {number} y ： 纵坐标
         * @return {boolean} true表示坐标处在图形中
         */
    function _buildPathMethod(shape, context, area, x, y) {
        // 图形类实现路径创建了则用类的path
        context.beginPath();
        shape.buildPath(context, area);
        context.closePath();
        return context.isPointInPath(x, y);
    }
    /**
         * !isInside
         */
    function isOutside(shape, area, x, y) {
        return !isInside(shape, area, x, y);
    }
    /**
         * 线段包含判断
         * @param  {number}  x0
         * @param  {number}  y0
         * @param  {number}  x1
         * @param  {number}  y1
         * @param  {number}  lineWidth
         * @param  {number}  x
         * @param  {number}  y
         * @return {boolean}
         */
    function isInsideLine(x0, y0, x1, y1, lineWidth, x, y) {
        if (lineWidth === 0) {
            return false;
        }
        var _l = Math.max(lineWidth, 5);
        var _a = 0;
        var _b = x0;
        // Quick reject
        if (y > y0 + _l && y > y1 + _l || y < y0 - _l && y < y1 - _l || x > x0 + _l && x > x1 + _l || x < x0 - _l && x < x1 - _l) {
            return false;
        }
        if (x0 !== x1) {
            _a = (y0 - y1) / (x0 - x1);
            _b = (x0 * y1 - x1 * y0) / (x0 - x1);
        } else {
            return Math.abs(x - x0) <= _l / 2;
        }
        var tmp = _a * x - y + _b;
        var _s = tmp * tmp / (_a * _a + 1);
        return _s <= _l / 2 * _l / 2;
    }
    /**
         * 三次贝塞尔曲线描边包含判断
         * @param  {number}  x0
         * @param  {number}  y0
         * @param  {number}  x1
         * @param  {number}  y1
         * @param  {number}  x2
         * @param  {number}  y2
         * @param  {number}  x3
         * @param  {number}  y3
         * @param  {number}  lineWidth
         * @param  {number}  x
         * @param  {number}  y
         * @return {boolean}
         */
    function isInsideCubicStroke(x0, y0, x1, y1, x2, y2, x3, y3, lineWidth, x, y) {
        if (lineWidth === 0) {
            return false;
        }
        var _l = Math.max(lineWidth, 5);
        // Quick reject
        if (y > y0 + _l && y > y1 + _l && y > y2 + _l && y > y3 + _l || y < y0 - _l && y < y1 - _l && y < y2 - _l && y < y3 - _l || x > x0 + _l && x > x1 + _l && x > x2 + _l && x > x3 + _l || x < x0 - _l && x < x1 - _l && x < x2 - _l && x < x3 - _l) {
            return false;
        }
        var d = curve.cubicProjectPoint(x0, y0, x1, y1, x2, y2, x3, y3, x, y, null);
        return d <= _l / 2;
    }
    /**
         * 二次贝塞尔曲线描边包含判断
         * @param  {number}  x0
         * @param  {number}  y0
         * @param  {number}  x1
         * @param  {number}  y1
         * @param  {number}  x2
         * @param  {number}  y2
         * @param  {number}  lineWidth
         * @param  {number}  x
         * @param  {number}  y
         * @return {boolean}
         */
    function isInsideQuadraticStroke(x0, y0, x1, y1, x2, y2, lineWidth, x, y) {
        if (lineWidth === 0) {
            return false;
        }
        var _l = Math.max(lineWidth, 5);
        // Quick reject
        if (y > y0 + _l && y > y1 + _l && y > y2 + _l || y < y0 - _l && y < y1 - _l && y < y2 - _l || x > x0 + _l && x > x1 + _l && x > x2 + _l || x < x0 - _l && x < x1 - _l && x < x2 - _l) {
            return false;
        }
        var d = curve.quadraticProjectPoint(x0, y0, x1, y1, x2, y2, x, y, null);
        return d <= _l / 2;
    }
    /**
         * 圆弧描边包含判断
         * @param  {number}  cx
         * @param  {number}  cy
         * @param  {number}  r
         * @param  {number}  startAngle
         * @param  {number}  endAngle
         * @param  {boolean}  anticlockwise
         * @param  {number} lineWidth
         * @param  {number}  x
         * @param  {number}  y
         * @return {Boolean}
         */
    function isInsideArcStroke(cx, cy, r, startAngle, endAngle, anticlockwise, lineWidth, x, y) {
        if (lineWidth === 0) {
            return false;
        }
        var _l = Math.max(lineWidth, 5);
        x -= cx;
        y -= cy;
        var d = Math.sqrt(x * x + y * y);
        if (d - _l > r || d + _l < r) {
            return false;
        }
        if (Math.abs(startAngle - endAngle) >= PI2) {
            // Is a circle
            return true;
        }
        if (anticlockwise) {
            var tmp = startAngle;
            startAngle = normalizeRadian(endAngle);
            endAngle = normalizeRadian(tmp);
        } else {
            startAngle = normalizeRadian(startAngle);
            endAngle = normalizeRadian(endAngle);
        }
        if (startAngle > endAngle) {
            endAngle += PI2;
        }
        var angle = Math.atan2(y, x);
        if (angle < 0) {
            angle += PI2;
        }
        return angle >= startAngle && angle <= endAngle || angle + PI2 >= startAngle && angle + PI2 <= endAngle;
    }
    function isInsideBrokenLine(points, lineWidth, x, y) {
        var lineWidth = Math.max(lineWidth, 10);
        for (var i = 0, l = points.length - 1; i < l; i++) {
            var x0 = points[i][0];
            var y0 = points[i][1];
            var x1 = points[i + 1][0];
            var y1 = points[i + 1][1];
            if (isInsideLine(x0, y0, x1, y1, lineWidth, x, y)) {
                return true;
            }
        }
        return false;
    }
    function isInsideRing(cx, cy, r0, r, x, y) {
        var d = (x - cx) * (x - cx) + (y - cy) * (y - cy);
        return d < r * r && d > r0 * r0;
    }
    /**
         * 矩形包含判断
         */
    function isInsideRect(x0, y0, width, height, x, y) {
        return x >= x0 && x <= x0 + width && y >= y0 && y <= y0 + height;
    }
    /**
         * 圆形包含判断
         */
    function isInsideCircle(x0, y0, r, x, y) {
        return (x - x0) * (x - x0) + (y - y0) * (y - y0) < r * r;
    }
    /**
         * 扇形包含判断
         */
    function isInsideSector(cx, cy, r0, r, startAngle, endAngle, anticlockwise, x, y) {
        return isInsideArcStroke(cx, cy, (r0 + r) / 2, startAngle, endAngle, anticlockwise, r - r0, x, y);
    }
    /**
         * 多边形包含判断
         * 与 canvas 一样采用 non-zero winding rule
         */
    function isInsidePolygon(points, x, y) {
        var N = points.length;
        var w = 0;
        for (var i = 0, j = N - 1; i < N; i++) {
            var x0 = points[j][0];
            var y0 = points[j][1];
            var x1 = points[i][0];
            var y1 = points[i][1];
            w += windingLine(x0, y0, x1, y1, x, y);
            j = i;
        }
        return w !== 0;
    }
    function windingLine(x0, y0, x1, y1, x, y) {
        if (y > y0 && y > y1 || y < y0 && y < y1) {
            return 0;
        }
        if (y1 == y0) {
            return 0;
        }
        var dir = y1 < y0 ? 1 : -1;
        var t = (y - y0) / (y1 - y0);
        var x_ = t * (x1 - x0) + x0;
        return x_ > x ? dir : 0;
    }
    // 临时数组
    var roots = [ -1, -1, -1 ];
    var extrema = [ -1, -1 ];
    function swapExtrema() {
        var tmp = extrema[0];
        extrema[0] = extrema[1];
        extrema[1] = tmp;
    }
    function windingCubic(x0, y0, x1, y1, x2, y2, x3, y3, x, y) {
        // Quick reject
        if (y > y0 && y > y1 && y > y2 && y > y3 || y < y0 && y < y1 && y < y2 && y < y3) {
            return 0;
        }
        var nRoots = curve.cubicRootAt(y0, y1, y2, y3, y, roots);
        if (nRoots === 0) {
            return 0;
        } else {
            var w = 0;
            var nExtrema = -1;
            var y0_, y1_;
            for (var i = 0; i < nRoots; i++) {
                var t = roots[i];
                var x_ = curve.cubicAt(x0, x1, x2, x3, t);
                if (x_ < x) {
                    // Quick reject
                    continue;
                }
                if (nExtrema < 0) {
                    nExtrema = curve.cubicExtrema(y0, y1, y2, y3, extrema);
                    if (extrema[1] < extrema[0] && nExtrema > 1) {
                        swapExtrema();
                    }
                    y0_ = curve.cubicAt(y0, y1, y2, y3, extrema[0]);
                    if (nExtrema > 1) {
                        y1_ = curve.cubicAt(y0, y1, y2, y3, extrema[1]);
                    }
                }
                if (nExtrema == 2) {
                    // 分成三段单调函数
                    if (t < extrema[0]) {
                        w += y0_ < y0 ? 1 : -1;
                    } else if (t < extrema[1]) {
                        w += y1_ < y0_ ? 1 : -1;
                    } else {
                        w += y3 < y1_ ? 1 : -1;
                    }
                } else {
                    // 分成两段单调函数
                    if (t < extrema[0]) {
                        w += y0_ < y0 ? 1 : -1;
                    } else {
                        w += y3 < y0_ ? 1 : -1;
                    }
                }
            }
            return w;
        }
    }
    function windingQuadratic(x0, y0, x1, y1, x2, y2, x, y) {
        // Quick reject
        if (y > y0 && y > y1 && y > y2 || y < y0 && y < y1 && y < y2) {
            return 0;
        }
        var nRoots = curve.quadraticRootAt(y0, y1, y2, y, roots);
        if (nRoots === 0) {
            return 0;
        } else {
            var t = curve.quadraticExtremum(y0, y1, y2);
            if (t >= 0 && t <= 1) {
                var w = 0;
                var y_ = curve.quadraticAt(y0, y1, y2, t);
                for (var i = 0; i < nRoots; i++) {
                    var x_ = curve.quadraticAt(x0, x1, x2, roots[i]);
                    if (x_ > x) {
                        continue;
                    }
                    if (roots[i] < t) {
                        w += y_ < y0 ? 1 : -1;
                    } else {
                        w += y2 < y_ ? 1 : -1;
                    }
                }
                return w;
            } else {
                var x_ = curve.quadraticAt(x0, x1, x2, roots[0]);
                if (x_ > x) {
                    return 0;
                }
                return y2 < y0 ? 1 : -1;
            }
        }
    }
    // TODO
    // Arc 旋转
    function windingArc(cx, cy, r, startAngle, endAngle, anticlockwise, x, y) {
        y -= cy;
        if (y > r || y < -r) {
            return 0;
        }
        var tmp = Math.sqrt(r * r - y * y);
        roots[0] = -tmp;
        roots[1] = tmp;
        if (Math.abs(startAngle - endAngle) >= PI2) {
            // Is a circle
            startAngle = 0;
            endAngle = PI2;
            var dir = anticlockwise ? 1 : -1;
            if (x >= roots[0] + cx && x <= roots[1] + cx) {
                return dir;
            } else {
                return 0;
            }
        }
        if (anticlockwise) {
            var tmp = startAngle;
            startAngle = normalizeRadian(endAngle);
            endAngle = normalizeRadian(tmp);
        } else {
            startAngle = normalizeRadian(startAngle);
            endAngle = normalizeRadian(endAngle);
        }
        if (startAngle > endAngle) {
            endAngle += PI2;
        }
        var w = 0;
        for (var i = 0; i < 2; i++) {
            var x_ = roots[i];
            if (x_ + cx > x) {
                var angle = Math.atan2(y, x_);
                var dir = anticlockwise ? 1 : -1;
                if (angle < 0) {
                    angle = PI2 + angle;
                }
                if (angle >= startAngle && angle <= endAngle || angle + PI2 >= startAngle && angle + PI2 <= endAngle) {
                    if (angle > Math.PI / 2 && angle < Math.PI * 1.5) {
                        dir = -dir;
                    }
                    w += dir;
                }
            }
        }
        return w;
    }
    /**
         * 路径包含判断
         * 与 canvas 一样采用 non-zero winding rule
         */
    function isInsidePath(pathArray, lineWidth, brushType, x, y) {
        var w = 0;
        var xi = 0;
        var yi = 0;
        var x0 = 0;
        var y0 = 0;
        var beginSubpath = true;
        var firstCmd = true;
        brushType = brushType || "fill";
        var hasStroke = brushType === "stroke" || brushType === "both";
        var hasFill = brushType === "fill" || brushType === "both";
        // var roots = [-1, -1, -1];
        for (var i = 0; i < pathArray.length; i++) {
            var seg = pathArray[i];
            var p = seg.points;
            // Begin a new subpath
            if (beginSubpath || seg.command === "M") {
                if (i > 0) {
                    // Close previous subpath
                    if (hasFill) {
                        w += windingLine(xi, yi, x0, y0, x, y);
                    }
                    if (w !== 0) {
                        return true;
                    }
                }
                x0 = p[p.length - 2];
                y0 = p[p.length - 1];
                beginSubpath = false;
                if (firstCmd && seg.command !== "A") {
                    // 如果第一个命令不是M, 是lineTo, bezierCurveTo
                    // 等绘制命令的话，是会从该绘制的起点开始算的
                    // Arc 会在之后做单独处理所以这里忽略
                    firstCmd = false;
                    xi = x0;
                    yi = y0;
                }
            }
            switch (seg.command) {
              case "M":
                xi = p[0];
                yi = p[1];
                break;

              case "L":
                if (hasStroke) {
                    if (isInsideLine(xi, yi, p[0], p[1], lineWidth, x, y)) {
                        return true;
                    }
                }
                if (hasFill) {
                    w += windingLine(xi, yi, p[0], p[1], x, y);
                }
                xi = p[0];
                yi = p[1];
                break;

              case "C":
                if (hasStroke) {
                    if (isInsideCubicStroke(xi, yi, p[0], p[1], p[2], p[3], p[4], p[5], lineWidth, x, y)) {
                        return true;
                    }
                }
                if (hasFill) {
                    w += windingCubic(xi, yi, p[0], p[1], p[2], p[3], p[4], p[5], x, y);
                }
                xi = p[4];
                yi = p[5];
                break;

              case "Q":
                if (hasStroke) {
                    if (isInsideQuadraticStroke(xi, yi, p[0], p[1], p[2], p[3], lineWidth, x, y)) {
                        return true;
                    }
                }
                if (hasFill) {
                    w += windingQuadratic(xi, yi, p[0], p[1], p[2], p[3], x, y);
                }
                xi = p[2];
                yi = p[3];
                break;

              case "A":
                // TODO Arc 旋转
                // TODO Arc 判断的开销比较大
                var cx = p[0];
                var cy = p[1];
                var rx = p[2];
                var ry = p[3];
                var theta = p[4];
                var dTheta = p[5];
                var x1 = Math.cos(theta) * rx + cx;
                var y1 = Math.sin(theta) * ry + cy;
                // 不是直接使用 arc 命令
                if (!firstCmd) {
                    w += windingLine(xi, yi, x1, y1);
                } else {
                    firstCmd = false;
                    // 第一个命令起点还未定义
                    x0 = x1;
                    y0 = y1;
                }
                // zr 使用scale来模拟椭圆, 这里也对x做一定的缩放
                var _x = (x - cx) * ry / rx + cx;
                if (hasStroke) {
                    if (isInsideArcStroke(cx, cy, ry, theta, theta + dTheta, 1 - p[7], lineWidth, _x, y)) {
                        return true;
                    }
                }
                if (hasFill) {
                    w += windingArc(cx, cy, ry, theta, theta + dTheta, 1 - p[7], _x, y);
                }
                xi = Math.cos(theta + dTheta) * rx + cx;
                yi = Math.sin(theta + dTheta) * ry + cy;
                break;

              case "z":
                if (hasStroke) {
                    if (isInsideLine(xi, yi, x0, y0, lineWidth, x, y)) {
                        return true;
                    }
                }
                beginSubpath = true;
                break;
            }
        }
        if (hasFill) {
            w += windingLine(xi, yi, x0, y0, x, y);
        }
        return w !== 0;
    }
    /**
         * 测算多行文本宽度
         * @param {Object} text
         * @param {Object} textFont
         */
    function getTextWidth(text, textFont) {
        var key = text + ":" + textFont;
        if (_textWidthCache[key]) {
            return _textWidthCache[key];
        }
        _ctx = _ctx || util.getContext();
        _ctx.save();
        if (textFont) {
            _ctx.font = textFont;
        }
        text = (text + "").split("\n");
        var width = 0;
        for (var i = 0, l = text.length; i < l; i++) {
            width = Math.max(_ctx.measureText(text[i]).width, width);
        }
        _ctx.restore();
        _textWidthCache[key] = width;
        if (++_textWidthCacheCounter > TEXT_CACHE_MAX) {
            // 内存释放
            _textWidthCacheCounter = 0;
            _textWidthCache = {};
        }
        return width;
    }
    /**
         * 测算多行文本高度
         * @param {Object} text
         * @param {Object} textFont
         */
    function getTextHeight(text, textFont) {
        var key = text + ":" + textFont;
        if (_textHeightCache[key]) {
            return _textHeightCache[key];
        }
        _ctx = _ctx || util.getContext();
        _ctx.save();
        if (textFont) {
            _ctx.font = textFont;
        }
        text = (text + "").split("\n");
        // 比较粗暴
        var height = (_ctx.measureText("国").width + 2) * text.length;
        _ctx.restore();
        _textHeightCache[key] = height;
        if (++_textHeightCacheCounter > TEXT_CACHE_MAX) {
            // 内存释放
            _textHeightCacheCounter = 0;
            _textHeightCache = {};
        }
        return height;
    }
    module.exports = {
        isInside: isInside,
        isOutside: isOutside,
        getTextWidth: getTextWidth,
        getTextHeight: getTextHeight,
        isInsidePath: isInsidePath,
        isInsidePolygon: isInsidePolygon,
        isInsideSector: isInsideSector,
        isInsideCircle: isInsideCircle,
        isInsideLine: isInsideLine,
        isInsideRect: isInsideRect,
        isInsideBrokenLine: isInsideBrokenLine,
        isInsideCubicStroke: isInsideCubicStroke,
        isInsideQuadraticStroke: isInsideQuadraticStroke
    };
});

define("app/pc/canvaslib/tool/curve", [ "app/pc/canvaslib/tool/vector" ], function(require, exports, module) {
    /**
 * 曲线辅助模块
 * @module zrender/tool/curve
 * @author pissang(https://www.github.com/pissang)
 */
    var vector = require("app/pc/canvaslib/tool/vector");
    "use strict";
    var EPSILON = 1e-4;
    var THREE_SQRT = Math.sqrt(3);
    var ONE_THIRD = 1 / 3;
    // 临时变量
    var _v0 = vector.create();
    var _v1 = vector.create();
    var _v2 = vector.create();
    // var _v3 = vector.create();
    function isAroundZero(val) {
        return val > -EPSILON && val < EPSILON;
    }
    function isNotAroundZero(val) {
        return val > EPSILON || val < -EPSILON;
    }
    /*
    function evalCubicCoeff(a, b, c, d, t) {
        return ((a * t + b) * t + c) * t + d;
    }
    */
    /** 
     * 计算三次贝塞尔值
     * @memberOf module:zrender/tool/curve
     * @param  {number} p0
     * @param  {number} p1
     * @param  {number} p2
     * @param  {number} p3
     * @param  {number} t
     * @return {number}
     */
    function cubicAt(p0, p1, p2, p3, t) {
        var onet = 1 - t;
        return onet * onet * (onet * p0 + 3 * t * p1) + t * t * (t * p3 + 3 * onet * p2);
    }
    /** 
     * 计算三次贝塞尔导数值
     * @memberOf module:zrender/tool/curve
     * @param  {number} p0
     * @param  {number} p1
     * @param  {number} p2
     * @param  {number} p3
     * @param  {number} t
     * @return {number}
     */
    function cubicDerivativeAt(p0, p1, p2, p3, t) {
        var onet = 1 - t;
        return 3 * (((p1 - p0) * onet + 2 * (p2 - p1) * t) * onet + (p3 - p2) * t * t);
    }
    /**
     * 计算三次贝塞尔方程根，使用盛金公式
     * @memberOf module:zrender/tool/curve
     * @param  {number} p0
     * @param  {number} p1
     * @param  {number} p2
     * @param  {number} p3
     * @param  {number} val
     * @param  {Array.<number>} roots
     * @return {number} 有效根数目
     */
    function cubicRootAt(p0, p1, p2, p3, val, roots) {
        // Evaluate roots of cubic functions
        var a = p3 + 3 * (p1 - p2) - p0;
        var b = 3 * (p2 - p1 * 2 + p0);
        var c = 3 * (p1 - p0);
        var d = p0 - val;
        var A = b * b - 3 * a * c;
        var B = b * c - 9 * a * d;
        var C = c * c - 3 * b * d;
        var n = 0;
        if (isAroundZero(A) && isAroundZero(B)) {
            if (isAroundZero(b)) {
                roots[0] = 0;
            } else {
                var t1 = -c / b;
                //t1, t2, t3, b is not zero
                if (t1 >= 0 && t1 <= 1) {
                    roots[n++] = t1;
                }
            }
        } else {
            var disc = B * B - 4 * A * C;
            if (isAroundZero(disc)) {
                var K = B / A;
                var t1 = -b / a + K;
                // t1, a is not zero
                var t2 = -K / 2;
                // t2, t3
                if (t1 >= 0 && t1 <= 1) {
                    roots[n++] = t1;
                }
                if (t2 >= 0 && t2 <= 1) {
                    roots[n++] = t2;
                }
            } else if (disc > 0) {
                var discSqrt = Math.sqrt(disc);
                var Y1 = A * b + 1.5 * a * (-B + discSqrt);
                var Y2 = A * b + 1.5 * a * (-B - discSqrt);
                if (Y1 < 0) {
                    Y1 = -Math.pow(-Y1, ONE_THIRD);
                } else {
                    Y1 = Math.pow(Y1, ONE_THIRD);
                }
                if (Y2 < 0) {
                    Y2 = -Math.pow(-Y2, ONE_THIRD);
                } else {
                    Y2 = Math.pow(Y2, ONE_THIRD);
                }
                var t1 = (-b - (Y1 + Y2)) / (3 * a);
                if (t1 >= 0 && t1 <= 1) {
                    roots[n++] = t1;
                }
            } else {
                var T = (2 * A * b - 3 * a * B) / (2 * Math.sqrt(A * A * A));
                var theta = Math.acos(T) / 3;
                var ASqrt = Math.sqrt(A);
                var tmp = Math.cos(theta);
                var t1 = (-b - 2 * ASqrt * tmp) / (3 * a);
                var t2 = (-b + ASqrt * (tmp + THREE_SQRT * Math.sin(theta))) / (3 * a);
                var t3 = (-b + ASqrt * (tmp - THREE_SQRT * Math.sin(theta))) / (3 * a);
                if (t1 >= 0 && t1 <= 1) {
                    roots[n++] = t1;
                }
                if (t2 >= 0 && t2 <= 1) {
                    roots[n++] = t2;
                }
                if (t3 >= 0 && t3 <= 1) {
                    roots[n++] = t3;
                }
            }
        }
        return n;
    }
    /**
     * 计算三次贝塞尔方程极限值的位置
     * @memberOf module:zrender/tool/curve
     * @param  {number} p0
     * @param  {number} p1
     * @param  {number} p2
     * @param  {number} p3
     * @param  {Array.<number>} extrema
     * @return {number} 有效数目
     */
    function cubicExtrema(p0, p1, p2, p3, extrema) {
        var b = 6 * p2 - 12 * p1 + 6 * p0;
        var a = 9 * p1 + 3 * p3 - 3 * p0 - 9 * p2;
        var c = 3 * p1 - 3 * p0;
        var n = 0;
        if (isAroundZero(a)) {
            if (isNotAroundZero(b)) {
                var t1 = -c / b;
                if (t1 >= 0 && t1 <= 1) {
                    extrema[n++] = t1;
                }
            }
        } else {
            var disc = b * b - 4 * a * c;
            if (isAroundZero(disc)) {
                extrema[0] = -b / (2 * a);
            } else if (disc > 0) {
                var discSqrt = Math.sqrt(disc);
                var t1 = (-b + discSqrt) / (2 * a);
                var t2 = (-b - discSqrt) / (2 * a);
                if (t1 >= 0 && t1 <= 1) {
                    extrema[n++] = t1;
                }
                if (t2 >= 0 && t2 <= 1) {
                    extrema[n++] = t2;
                }
            }
        }
        return n;
    }
    /**
     * 细分三次贝塞尔曲线
     * @memberOf module:zrender/tool/curve
     * @param  {number} p0
     * @param  {number} p1
     * @param  {number} p2
     * @param  {number} p3
     * @param  {number} t
     * @param  {Array.<number>} out
     */
    function cubicSubdivide(p0, p1, p2, p3, t, out) {
        var p01 = (p1 - p0) * t + p0;
        var p12 = (p2 - p1) * t + p1;
        var p23 = (p3 - p2) * t + p2;
        var p012 = (p12 - p01) * t + p01;
        var p123 = (p23 - p12) * t + p12;
        var p0123 = (p123 - p012) * t + p012;
        // Seg0
        out[0] = p0;
        out[1] = p01;
        out[2] = p012;
        out[3] = p0123;
        // Seg1
        out[4] = p0123;
        out[5] = p123;
        out[6] = p23;
        out[7] = p3;
    }
    /**
     * 投射点到三次贝塞尔曲线上，返回投射距离。
     * 投射点有可能会有一个或者多个，这里只返回其中距离最短的一个。
     * @param {number} x0
     * @param {number} y0
     * @param {number} x1
     * @param {number} y1
     * @param {number} x2
     * @param {number} y2
     * @param {number} x3
     * @param {number} y3
     * @param {number} x
     * @param {number} y
     * @param {Array.<number>} [out] 投射点
     * @return {number}
     */
    function cubicProjectPoint(x0, y0, x1, y1, x2, y2, x3, y3, x, y, out) {
        // http://pomax.github.io/bezierinfo/#projections
        var t;
        var interval = .005;
        var d = Infinity;
        _v0[0] = x;
        _v0[1] = y;
        // 先粗略估计一下可能的最小距离的 t 值
        // PENDING
        for (var _t = 0; _t < 1; _t += .05) {
            _v1[0] = cubicAt(x0, x1, x2, x3, _t);
            _v1[1] = cubicAt(y0, y1, y2, y3, _t);
            var d1 = vector.distSquare(_v0, _v1);
            if (d1 < d) {
                t = _t;
                d = d1;
            }
        }
        d = Infinity;
        // At most 32 iteration
        for (var i = 0; i < 32; i++) {
            if (interval < EPSILON) {
                break;
            }
            var prev = t - interval;
            var next = t + interval;
            // t - interval
            _v1[0] = cubicAt(x0, x1, x2, x3, prev);
            _v1[1] = cubicAt(y0, y1, y2, y3, prev);
            var d1 = vector.distSquare(_v1, _v0);
            if (prev >= 0 && d1 < d) {
                t = prev;
                d = d1;
            } else {
                // t + interval
                _v2[0] = cubicAt(x0, x1, x2, x3, next);
                _v2[1] = cubicAt(y0, y1, y2, y3, next);
                var d2 = vector.distSquare(_v2, _v0);
                if (next <= 1 && d2 < d) {
                    t = next;
                    d = d2;
                } else {
                    interval *= .5;
                }
            }
        }
        // t
        if (out) {
            out[0] = cubicAt(x0, x1, x2, x3, t);
            out[1] = cubicAt(y0, y1, y2, y3, t);
        }
        // console.log(interval, i);
        return Math.sqrt(d);
    }
    /**
     * 计算二次方贝塞尔值
     * @param  {number} p0
     * @param  {number} p1
     * @param  {number} p2
     * @param  {number} t
     * @return {number}
     */
    function quadraticAt(p0, p1, p2, t) {
        var onet = 1 - t;
        return onet * (onet * p0 + 2 * t * p1) + t * t * p2;
    }
    /**
     * 计算二次方贝塞尔导数值
     * @param  {number} p0
     * @param  {number} p1
     * @param  {number} p2
     * @param  {number} t
     * @return {number}
     */
    function quadraticDerivativeAt(p0, p1, p2, t) {
        return 2 * ((1 - t) * (p1 - p0) + t * (p2 - p1));
    }
    /**
     * 计算二次方贝塞尔方程根
     * @param  {number} p0
     * @param  {number} p1
     * @param  {number} p2
     * @param  {number} t
     * @param  {Array.<number>} roots
     * @return {number} 有效根数目
     */
    function quadraticRootAt(p0, p1, p2, val, roots) {
        var a = p0 - 2 * p1 + p2;
        var b = 2 * (p1 - p0);
        var c = p0 - val;
        var n = 0;
        if (isAroundZero(a)) {
            if (isNotAroundZero(b)) {
                var t1 = -c / b;
                if (t1 >= 0 && t1 <= 1) {
                    roots[n++] = t1;
                }
            }
        } else {
            var disc = b * b - 4 * a * c;
            if (isAroundZero(disc)) {
                var t1 = -b / (2 * a);
                if (t1 >= 0 && t1 <= 1) {
                    roots[n++] = t1;
                }
            } else if (disc > 0) {
                var discSqrt = Math.sqrt(disc);
                var t1 = (-b + discSqrt) / (2 * a);
                var t2 = (-b - discSqrt) / (2 * a);
                if (t1 >= 0 && t1 <= 1) {
                    roots[n++] = t1;
                }
                if (t2 >= 0 && t2 <= 1) {
                    roots[n++] = t2;
                }
            }
        }
        return n;
    }
    /**
     * 计算二次贝塞尔方程极限值
     * @memberOf module:zrender/tool/curve
     * @param  {number} p0
     * @param  {number} p1
     * @param  {number} p2
     * @return {number}
     */
    function quadraticExtremum(p0, p1, p2) {
        var divider = p0 + p2 - 2 * p1;
        if (divider === 0) {
            // p1 is center of p0 and p2 
            return .5;
        } else {
            return (p0 - p1) / divider;
        }
    }
    /**
     * 投射点到二次贝塞尔曲线上，返回投射距离。
     * 投射点有可能会有一个或者多个，这里只返回其中距离最短的一个。
     * @param {number} x0
     * @param {number} y0
     * @param {number} x1
     * @param {number} y1
     * @param {number} x2
     * @param {number} y2
     * @param {number} x
     * @param {number} y
     * @param {Array.<number>} out 投射点
     * @return {number}
     */
    function quadraticProjectPoint(x0, y0, x1, y1, x2, y2, x, y, out) {
        // http://pomax.github.io/bezierinfo/#projections
        var t;
        var interval = .005;
        var d = Infinity;
        _v0[0] = x;
        _v0[1] = y;
        // 先粗略估计一下可能的最小距离的 t 值
        // PENDING
        for (var _t = 0; _t < 1; _t += .05) {
            _v1[0] = quadraticAt(x0, x1, x2, _t);
            _v1[1] = quadraticAt(y0, y1, y2, _t);
            var d1 = vector.distSquare(_v0, _v1);
            if (d1 < d) {
                t = _t;
                d = d1;
            }
        }
        d = Infinity;
        // At most 32 iteration
        for (var i = 0; i < 32; i++) {
            if (interval < EPSILON) {
                break;
            }
            var prev = t - interval;
            var next = t + interval;
            // t - interval
            _v1[0] = quadraticAt(x0, x1, x2, prev);
            _v1[1] = quadraticAt(y0, y1, y2, prev);
            var d1 = vector.distSquare(_v1, _v0);
            if (prev >= 0 && d1 < d) {
                t = prev;
                d = d1;
            } else {
                // t + interval
                _v2[0] = quadraticAt(x0, x1, x2, next);
                _v2[1] = quadraticAt(y0, y1, y2, next);
                var d2 = vector.distSquare(_v2, _v0);
                if (next <= 1 && d2 < d) {
                    t = next;
                    d = d2;
                } else {
                    interval *= .5;
                }
            }
        }
        // t
        if (out) {
            out[0] = quadraticAt(x0, x1, x2, t);
            out[1] = quadraticAt(y0, y1, y2, t);
        }
        // console.log(interval, i);
        return Math.sqrt(d);
    }
    module.exports = {
        cubicAt: cubicAt,
        cubicDerivativeAt: cubicDerivativeAt,
        cubicRootAt: cubicRootAt,
        cubicExtrema: cubicExtrema,
        cubicSubdivide: cubicSubdivide,
        cubicProjectPoint: cubicProjectPoint,
        quadraticAt: quadraticAt,
        quadraticDerivativeAt: quadraticDerivativeAt,
        quadraticRootAt: quadraticRootAt,
        quadraticExtremum: quadraticExtremum,
        quadraticProjectPoint: quadraticProjectPoint
    };
});

define("app/pc/canvaslib/shape/Base", [ "app/pc/canvaslib/tool/matrix", "app/pc/canvaslib/tool/guid", "app/pc/canvaslib/tool/util", "app/pc/canvaslib/dep/excanvas", "app/pc/canvaslib/tool/log", "app/pc/canvaslib/config", "app/pc/canvaslib/mixin/Transformable", "app/pc/canvaslib/tool/vector", "app/pc/canvaslib/mixin/Eventful", "app/pc/canvaslib/tool/area", "app/pc/canvaslib/tool/curve", "app/pc/canvaslib/tool/color" ], function(require, exports, module) {
    /**
 * shape基类
 * @module zrender/shape/Base
 * @author  Kener (@Kener-林峰, kener.linfeng@gmail.com)
 *          errorrik (errorrik@gmail.com)
 */
    /**
 * @typedef {Object} IBaseShapeStyle
 * @property {string} [brushType='fill']
 * @property {string} [color='#000000'] 填充颜色
 * @property {string} [strokeColor='#000000'] 描边颜色
 * @property {string} [lineCape='butt'] 线帽样式，可以是 butt, round, square
 * @property {number} [lineWidth=1] 描边宽度
 * @property {number} [opacity=1] 绘制透明度
 * @property {number} [shadowBlur=0] 阴影模糊度，大于0有效
 * @property {string} [shadowColor='#000000'] 阴影颜色
 * @property {number} [shadowOffsetX=0] 阴影横向偏移
 * @property {number} [shadowOffsetY=0] 阴影纵向偏移
 * @property {string} [text] 图形中的附加文本
 * @property {string} [textColor='#000000'] 文本颜色
 * @property {string} [textFont] 附加文本样式，eg:'bold 18px verdana'
 * @property {string} [textPosition='end'] 附加文本位置, 可以是 inside, left, right, top, bottom
 * @property {string} [textAlign] 默认根据textPosition自动设置，附加文本水平对齐。
 *                                可以是start, end, left, right, center
 * @property {string} [textBaseline] 默认根据textPosition自动设置，附加文本垂直对齐。
 *                                可以是top, bottom, middle, alphabetic, hanging, ideographic
 */
    /**
 * @typedef {Object} module:zrender/shape/Base~IBoundingRect
 * @property {number} x 左上角顶点x轴坐标 
 * @property {number} y 左上角顶点y轴坐标
 * @property {number} width 包围盒矩形宽度
 * @property {number} height 包围盒矩形高度
 */
    var vmlCanvasManager = window["G_vmlCanvasManager"];
    var matrix = require("app/pc/canvaslib/tool/matrix");
    var guid = require("app/pc/canvaslib/tool/guid");
    var util = require("app/pc/canvaslib/tool/util");
    var log = require("app/pc/canvaslib/tool/log");
    var Transformable = require("app/pc/canvaslib/mixin/Transformable");
    var Eventful = require("app/pc/canvaslib/mixin/Eventful");
    function _fillText(ctx, text, x, y, textFont, textAlign, textBaseline) {
        if (textFont) {
            ctx.font = textFont;
        }
        ctx.textAlign = textAlign;
        ctx.textBaseline = textBaseline;
        var rect = _getTextRect(text, x, y, textFont, textAlign, textBaseline);
        text = (text + "").split("\n");
        var lineHeight = require("app/pc/canvaslib/tool/area").getTextHeight("国", textFont);
        switch (textBaseline) {
          case "top":
            y = rect.y;
            break;

          case "bottom":
            y = rect.y + lineHeight;
            break;

          default:
            y = rect.y + lineHeight / 2;
        }
        for (var i = 0, l = text.length; i < l; i++) {
            ctx.fillText(text[i], x, y);
            y += lineHeight;
        }
    }
    /**
         * 返回矩形区域，用于局部刷新和文字定位
         * @inner
         * @param {string} text
         * @param {number} x
         * @param {number} y
         * @param {string} textFont
         * @param {string} textAlign
         * @param {string} textBaseline
         */
    function _getTextRect(text, x, y, textFont, textAlign, textBaseline) {
        var area = require("app/pc/canvaslib/tool/area");
        var width = area.getTextWidth(text, textFont);
        var lineHeight = area.getTextHeight("国", textFont);
        text = (text + "").split("\n");
        switch (textAlign) {
          case "end":
          case "right":
            x -= width;
            break;

          case "center":
            x -= width / 2;
            break;
        }
        switch (textBaseline) {
          case "top":
            break;

          case "bottom":
            y -= lineHeight * text.length;
            break;

          default:
            y -= lineHeight * text.length / 2;
        }
        return {
            x: x,
            y: y,
            width: width,
            height: lineHeight * text.length
        };
    }
    /**
         * @alias module:zrender/shape/Base
         * @constructor
         * @extends module:zrender/mixin/Transformable
         * @extends module:zrender/mixin/Eventful
         * @param {Object} options 关于shape的配置项，可以是shape的自有属性，也可以是自定义的属性。
         */
    var Base = function(options) {
        options = options || {};
        /**
             * Shape id, 全局唯一
             * @type {string}
             */
        this.id = options.id || guid();
        for (var key in options) {
            this[key] = options[key];
        }
        /**
             * 基础绘制样式
             * @type {module:zrender/shape/Base~IBaseShapeStyle}
             */
        this.style = this.style || {};
        /**
             * 高亮样式
             * @type {module:zrender/shape/Base~IBaseShapeStyle}
             */
        this.highlightStyle = this.highlightStyle || null;
        /**
             * 父节点
             * @readonly
             * @type {module:zrender/Group}
             * @default null
             */
        this.parent = null;
        this.__dirty = true;
        this.__clipShapes = [];
        Transformable.call(this);
        Eventful.call(this);
    };
    /**
         * 图形是否可见，为true时不绘制图形，但是仍能触发鼠标事件
         * @name module:zrender/shape/Base#invisible
         * @type {boolean}
         * @default false
         */
    Base.prototype.invisible = false;
    /**
         * 图形是否忽略，为true时忽略图形的绘制以及事件触发
         * @name module:zrender/shape/Base#ignore
         * @type {boolean}
         * @default false
         */
    Base.prototype.ignore = false;
    /**
         * z层level，决定绘画在哪层canvas中
         * @name module:zrender/shape/Base#zlevel
         * @type {number}
         * @default 0
         */
    Base.prototype.zlevel = 0;
    /**
         * 是否可拖拽
         * @name module:zrender/shape/Base#draggable
         * @type {boolean}
         * @default false
         */
    Base.prototype.draggable = false;
    /**
         * 是否可点击
         * @name module:zrender/shape/Base#clickable
         * @type {boolean}
         * @default false
         */
    Base.prototype.clickable = false;
    /**
         * 是否可以hover
         * @name module:zrender/shape/Base#hoverable
         * @type {boolean}
         * @default true
         */
    Base.prototype.hoverable = true;
    /**
         * z值，跟zlevel一样影响shape绘制的前后顺序，z值大的shape会覆盖在z值小的上面，
         * 但是并不会创建新的canvas，所以优先级低于zlevel，而且频繁改动的开销比zlevel小很多。
         * 
         * @name module:zrender/shape/Base#z
         * @type {number}
         * @default 0
         */
    Base.prototype.z = 0;
    /**
         * 绘制图形
         * 
         * @param {CanvasRenderingContext2D} ctx
         * @param {boolean} [isHighlight=false] 是否使用高亮属性
         * @param {Function} [updateCallback]
         *        需要异步加载资源的shape可以通过这个callback(e), 
         *        让painter更新视图，base.brush没用，需要的话重载brush
         */
    Base.prototype.brush = function(ctx, isHighlight) {
        var style = this.beforeBrush(ctx, isHighlight);
        ctx.beginPath();
        this.buildPath(ctx, style);
        switch (style.brushType) {
          /* jshint ignore:start */
            case "both":
            ctx.fill();

          case "stroke":
            style.lineWidth > 0 && ctx.stroke();
            break;

          /* jshint ignore:end */
            default:
            ctx.fill();
        }
        this.drawText(ctx, style, this.style);
        this.afterBrush(ctx);
    };
    /**
         * 具体绘制操作前的一些公共操作
         * @param {CanvasRenderingContext2D} ctx
         * @param {boolean} [isHighlight=false] 是否使用高亮属性
         * @return {Object} 处理后的样式
         */
    Base.prototype.beforeBrush = function(ctx, isHighlight) {
        var style = this.style;
        if (this.brushTypeOnly) {
            style.brushType = this.brushTypeOnly;
        }
        if (isHighlight) {
            // 根据style扩展默认高亮样式
            style = this.getHighlightStyle(style, this.highlightStyle || {}, this.brushTypeOnly);
        }
        if (this.brushTypeOnly == "stroke") {
            style.strokeColor = style.strokeColor || style.color;
        }
        ctx.save();
        this.doClip(ctx);
        this.setContext(ctx, style);
        // 设置transform
        this.setTransform(ctx);
        return style;
    };
    /**
         * 绘制后的处理
         * @param {CanvasRenderingContext2D} ctx
         */
    Base.prototype.afterBrush = function(ctx) {
        ctx.restore();
    };
    var STYLE_CTX_MAP = [ [ "color", "fillStyle" ], [ "strokeColor", "strokeStyle" ], [ "opacity", "globalAlpha" ], [ "lineCap", "lineCap" ], [ "lineJoin", "lineJoin" ], [ "miterLimit", "miterLimit" ], [ "lineWidth", "lineWidth" ], [ "shadowBlur", "shadowBlur" ], [ "shadowColor", "shadowColor" ], [ "shadowOffsetX", "shadowOffsetX" ], [ "shadowOffsetY", "shadowOffsetY" ] ];
    /**
         * 设置 fillStyle, strokeStyle, shadow 等通用绘制样式
         * @param {CanvasRenderingContext2D} ctx
         * @param {module:zrender/shape/Base~IBaseShapeStyle} style
         */
    Base.prototype.setContext = function(ctx, style) {
        for (var i = 0, len = STYLE_CTX_MAP.length; i < len; i++) {
            var styleProp = STYLE_CTX_MAP[i][0];
            var styleValue = style[styleProp];
            var ctxProp = STYLE_CTX_MAP[i][1];
            if (typeof styleValue != "undefined") {
                ctx[ctxProp] = styleValue;
            }
        }
    };
    var clipShapeInvTransform = matrix.create();
    Base.prototype.doClip = function(ctx) {
        if (this.__clipShapes && !vmlCanvasManager) {
            for (var i = 0; i < this.__clipShapes.length; i++) {
                var clipShape = this.__clipShapes[i];
                if (clipShape.needTransform) {
                    var m = clipShape.transform;
                    matrix.invert(clipShapeInvTransform, m);
                    ctx.transform(m[0], m[1], m[2], m[3], m[4], m[5]);
                }
                ctx.beginPath();
                clipShape.buildPath(ctx, clipShape.style);
                ctx.clip();
                // Transform back
                if (clipShape.needTransform) {
                    var m = clipShapeInvTransform;
                    ctx.transform(m[0], m[1], m[2], m[3], m[4], m[5]);
                }
            }
        }
    };
    /**
         * 根据默认样式扩展高亮样式
         * 
         * @param {module:zrender/shape/Base~IBaseShapeStyle} style 默认样式
         * @param {module:zrender/shape/Base~IBaseShapeStyle} highlightStyle 高亮样式
         * @param {string} brushTypeOnly
         */
    Base.prototype.getHighlightStyle = function(style, highlightStyle, brushTypeOnly) {
        var newStyle = {};
        for (var k in style) {
            newStyle[k] = style[k];
        }
        var color = require("app/pc/canvaslib/tool/color");
        var highlightColor = color.getHighlightColor();
        // 根据highlightStyle扩展
        if (style.brushType != "stroke") {
            // 带填充则用高亮色加粗边线
            newStyle.strokeColor = highlightColor;
            newStyle.lineWidth = (style.lineWidth || 1) + this.getHighlightZoom();
            newStyle.brushType = "both";
        } else {
            if (brushTypeOnly != "stroke") {
                // 描边型的则用原色加工高亮
                newStyle.strokeColor = highlightColor;
                newStyle.lineWidth = (style.lineWidth || 1) + this.getHighlightZoom();
            } else {
                // 线型的则用原色加工高亮
                newStyle.strokeColor = highlightStyle.strokeColor || color.mix(style.strokeColor, color.toRGB(highlightColor));
            }
        }
        // 可自定义覆盖默认值
        for (var k in highlightStyle) {
            if (typeof highlightStyle[k] != "undefined") {
                newStyle[k] = highlightStyle[k];
            }
        }
        return newStyle;
    };
    // 高亮放大效果参数
    // 当前统一设置为6，如有需要差异设置，通过this.type判断实例类型
    Base.prototype.getHighlightZoom = function() {
        return this.type != "text" ? 6 : 2;
    };
    /**
         * 移动位置
         * @param {number} dx 横坐标变化
         * @param {number} dy 纵坐标变化
         */
    Base.prototype.drift = function(dx, dy) {
        this.position[0] += dx;
        this.position[1] += dy;
    };
    /**
         * 变换鼠标位置到 shape 的局部坐标空间
         * @method
         * @param {number} x
         * @param {number} y
         * @return {Array.<number>}
         */
    Base.prototype.getTansform = function() {
        var invTransform = [];
        return function(x, y) {
            var originPos = [ x, y ];
            // 对鼠标的坐标也做相同的变换
            if (this.needTransform && this.transform) {
                matrix.invert(invTransform, this.transform);
                matrix.mulVector(originPos, invTransform, [ x, y, 1 ]);
                if (x == originPos[0] && y == originPos[1]) {
                    // 避免外部修改导致的needTransform不准确
                    this.updateNeedTransform();
                }
            }
            return originPos;
        };
    }();
    /**
         * 构建绘制的Path
         * @param {CanvasRenderingContext2D} ctx
         * @param {module:zrender/shape/Base~IBaseShapeStyle} style
         */
    Base.prototype.buildPath = function(ctx, style) {
        log("buildPath not implemented in " + this.type);
    };
    /**
         * 计算返回包围盒矩形
         * @param {module:zrender/shape/Base~IBaseShapeStyle} style
         * @return {module:zrender/shape/Base~IBoundingRect}
         */
    Base.prototype.getRect = function(style) {
        log("getRect not implemented in " + this.type);
    };
    /**
         * 判断鼠标位置是否在图形内
         * @param {number} x
         * @param {number} y
         * @return {boolean}
         */
    Base.prototype.isCover = function(x, y) {
        var originPos = this.getTansform(x, y);
        x = originPos[0];
        y = originPos[1];
        // 快速预判并保留判断矩形
        var rect = this.style.__rect;
        if (!rect) {
            rect = this.style.__rect = this.getRect(this.style);
        }
        if (x >= rect.x && x <= rect.x + rect.width && y >= rect.y && y <= rect.y + rect.height) {
            // 矩形内
            return require("app/pc/canvaslib/tool/area").isInside(this, this.style, x, y);
        }
        return false;
    };
    /**
         * 绘制附加文本
         * @param {CanvasRenderingContext2D} ctx
         * @param {module:zrender/shape/Base~IBaseShapeStyle} style 样式
         * @param {module:zrender/shape/Base~IBaseShapeStyle} normalStyle 默认样式，用于定位文字显示
         */
    Base.prototype.drawText = function(ctx, style, normalStyle) {
        if (typeof style.text == "undefined" || style.text === false) {
            return;
        }
        // 字体颜色策略
        var textColor = style.textColor || style.color || style.strokeColor;
        ctx.fillStyle = textColor;
        // 文本与图形间空白间隙
        var dd = 10;
        var al;
        // 文本水平对齐
        var bl;
        // 文本垂直对齐
        var tx;
        // 文本横坐标
        var ty;
        // 文本纵坐标
        var textPosition = style.textPosition || this.textPosition || "top";
        // 全局默认
        switch (textPosition) {
          case "inside":
          case "top":
          case "bottom":
          case "left":
          case "right":
            if (this.getRect) {
                var rect = (normalStyle || style).__rect || this.getRect(normalStyle || style);
                switch (textPosition) {
                  case "inside":
                    tx = rect.x + rect.width / 2;
                    ty = rect.y + rect.height / 2;
                    al = "center";
                    bl = "middle";
                    if (style.brushType != "stroke" && textColor == style.color) {
                        ctx.fillStyle = "#fff";
                    }
                    break;

                  case "left":
                    tx = rect.x - dd;
                    ty = rect.y + rect.height / 2;
                    al = "end";
                    bl = "middle";
                    break;

                  case "right":
                    tx = rect.x + rect.width + dd;
                    ty = rect.y + rect.height / 2;
                    al = "start";
                    bl = "middle";
                    break;

                  case "top":
                    tx = rect.x + rect.width / 2;
                    ty = rect.y - dd;
                    al = "center";
                    bl = "bottom";
                    break;

                  case "bottom":
                    tx = rect.x + rect.width / 2;
                    ty = rect.y + rect.height + dd;
                    al = "center";
                    bl = "top";
                    break;
                }
            }
            break;

          case "start":
          case "end":
            var xStart;
            var xEnd;
            var yStart;
            var yEnd;
            if (typeof style.pointList != "undefined") {
                var pointList = style.pointList;
                if (pointList.length < 2) {
                    // 少于2个点就不画了~
                    return;
                }
                var length = pointList.length;
                switch (textPosition) {
                  case "start":
                    xStart = pointList[0][0];
                    xEnd = pointList[1][0];
                    yStart = pointList[0][1];
                    yEnd = pointList[1][1];
                    break;

                  case "end":
                    xStart = pointList[length - 2][0];
                    xEnd = pointList[length - 1][0];
                    yStart = pointList[length - 2][1];
                    yEnd = pointList[length - 1][1];
                    break;
                }
            } else {
                xStart = style.xStart || 0;
                xEnd = style.xEnd || 0;
                yStart = style.yStart || 0;
                yEnd = style.yEnd || 0;
            }
            switch (textPosition) {
              case "start":
                al = xStart < xEnd ? "end" : "start";
                bl = yStart < yEnd ? "bottom" : "top";
                tx = xStart;
                ty = yStart;
                break;

              case "end":
                al = xStart < xEnd ? "start" : "end";
                bl = yStart < yEnd ? "top" : "bottom";
                tx = xEnd;
                ty = yEnd;
                break;
            }
            dd -= 4;
            if (xStart != xEnd) {
                tx -= al == "end" ? dd : -dd;
            } else {
                al = "center";
            }
            if (yStart != yEnd) {
                ty -= bl == "bottom" ? dd : -dd;
            } else {
                bl = "middle";
            }
            break;

          case "specific":
            tx = style.textX || 0;
            ty = style.textY || 0;
            al = "start";
            bl = "middle";
            break;
        }
        if (tx != null && ty != null) {
            _fillText(ctx, style.text, tx, ty, style.textFont, style.textAlign || al, style.textBaseline || bl);
        }
    };
    Base.prototype.modSelf = function() {
        this.__dirty = true;
        if (this.style) {
            this.style.__rect = null;
        }
        if (this.highlightStyle) {
            this.highlightStyle.__rect = null;
        }
    };
    /**
         * 图形是否会触发事件
         * @return {boolean}
         */
    // TODO, 通过 bind 绑定的事件
    Base.prototype.isSilent = function() {
        return !(this.hoverable || this.draggable || this.clickable || this.onmousemove || this.onmouseover || this.onmouseout || this.onmousedown || this.onmouseup || this.onclick || this.ondragenter || this.ondragover || this.ondragleave || this.ondrop);
    };
    util.merge(Base.prototype, Transformable.prototype, true);
    util.merge(Base.prototype, Eventful.prototype, true);
    module.exports = Base;
});

define("app/pc/canvaslib/mixin/Transformable", [ "app/pc/canvaslib/tool/matrix", "app/pc/canvaslib/tool/vector" ], function(require, exports, module) {
    /**
 * 提供变换扩展
 * @module zrender/mixin/Transformable
 * @author pissang (https://www.github.com/pissang)
 */
    "use strict";
    var matrix = require("app/pc/canvaslib/tool/matrix");
    var vector = require("app/pc/canvaslib/tool/vector");
    var origin = [ 0, 0 ];
    var EPSILON = 5e-5;
    function isAroundZero(val) {
        return val > -EPSILON && val < EPSILON;
    }
    function isNotAroundZero(val) {
        return val > EPSILON || val < -EPSILON;
    }
    /**
     * @alias module:zrender/mixin/Transformable
     * @constructor
     */
    var Transformable = function() {
        if (!this.position) {
            /**
             * 平移
             * @type {Array.<number>}
             * @default [0, 0]
             */
            this.position = [ 0, 0 ];
        }
        if (typeof this.rotation == "undefined") {
            /**
             * 旋转，可以通过数组二三项指定旋转的原点
             * @type {Array.<number>}
             * @default [0, 0, 0]
             */
            this.rotation = [ 0, 0, 0 ];
        }
        if (!this.scale) {
            /**
             * 缩放，可以通过数组三四项指定缩放的原点
             * @type {Array.<number>}
             * @default [1, 1, 0, 0]
             */
            this.scale = [ 1, 1, 0, 0 ];
        }
        this.needLocalTransform = false;
        /**
         * 是否有坐标变换
         * @type {boolean}
         * @readOnly
         */
        this.needTransform = false;
    };
    Transformable.prototype = {
        constructor: Transformable,
        updateNeedTransform: function() {
            this.needLocalTransform = isNotAroundZero(this.rotation[0]) || isNotAroundZero(this.position[0]) || isNotAroundZero(this.position[1]) || isNotAroundZero(this.scale[0] - 1) || isNotAroundZero(this.scale[1] - 1);
        },
        /**
         * 判断是否需要有坐标变换，更新needTransform属性。
         * 如果有坐标变换, 则从position, rotation, scale以及父节点的transform计算出自身的transform矩阵
         */
        updateTransform: function() {
            this.updateNeedTransform();
            if (this.parent) {
                this.needTransform = this.needLocalTransform || this.parent.needTransform;
            } else {
                this.needTransform = this.needLocalTransform;
            }
            if (!this.needTransform) {
                return;
            }
            var m = this.transform || matrix.create();
            matrix.identity(m);
            if (this.needLocalTransform) {
                if (isNotAroundZero(this.scale[0]) || isNotAroundZero(this.scale[1])) {
                    origin[0] = -this.scale[2] || 0;
                    origin[1] = -this.scale[3] || 0;
                    var haveOrigin = isNotAroundZero(origin[0]) || isNotAroundZero(origin[1]);
                    if (haveOrigin) {
                        matrix.translate(m, m, origin);
                    }
                    matrix.scale(m, m, this.scale);
                    if (haveOrigin) {
                        origin[0] = -origin[0];
                        origin[1] = -origin[1];
                        matrix.translate(m, m, origin);
                    }
                }
                if (this.rotation instanceof Array) {
                    if (this.rotation[0] !== 0) {
                        origin[0] = -this.rotation[1] || 0;
                        origin[1] = -this.rotation[2] || 0;
                        var haveOrigin = isNotAroundZero(origin[0]) || isNotAroundZero(origin[1]);
                        if (haveOrigin) {
                            matrix.translate(m, m, origin);
                        }
                        matrix.rotate(m, m, this.rotation[0]);
                        if (haveOrigin) {
                            origin[0] = -origin[0];
                            origin[1] = -origin[1];
                            matrix.translate(m, m, origin);
                        }
                    }
                } else {
                    if (this.rotation !== 0) {
                        matrix.rotate(m, m, this.rotation);
                    }
                }
                if (isNotAroundZero(this.position[0]) || isNotAroundZero(this.position[1])) {
                    matrix.translate(m, m, this.position);
                }
            }
            // 保存这个变换矩阵
            this.transform = m;
            // 应用父节点变换
            if (this.parent && this.parent.needTransform) {
                if (this.needLocalTransform) {
                    matrix.mul(this.transform, this.parent.transform, this.transform);
                } else {
                    matrix.copy(this.transform, this.parent.transform);
                }
            }
        },
        /**
         * 将自己的transform应用到context上
         * @param {Context2D} ctx
         */
        setTransform: function(ctx) {
            if (this.needTransform) {
                var m = this.transform;
                ctx.transform(m[0], m[1], m[2], m[3], m[4], m[5]);
            }
        },
        /**
         * 设置图形的朝向
         * @param  {Array.<number>|Float32Array} target
         * @method
         */
        lookAt: function() {
            var v = vector.create();
            return function(target) {
                if (!this.transform) {
                    this.transform = matrix.create();
                }
                var m = this.transform;
                vector.sub(v, target, this.position);
                if (isAroundZero(v[0]) && isAroundZero(v[1])) {
                    return;
                }
                vector.normalize(v, v);
                // Y Axis
                // TODO Scale origin ?
                m[2] = v[0] * this.scale[1];
                m[3] = v[1] * this.scale[1];
                // X Axis
                m[0] = v[1] * this.scale[0];
                m[1] = -v[0] * this.scale[0];
                // Position
                m[4] = this.position[0];
                m[5] = this.position[1];
                this.decomposeTransform();
            };
        }(),
        /**
         * 分解`transform`矩阵到`position`, `rotation`, `scale`
         */
        decomposeTransform: function() {
            if (!this.transform) {
                return;
            }
            var m = this.transform;
            var sx = m[0] * m[0] + m[1] * m[1];
            var position = this.position;
            var scale = this.scale;
            var rotation = this.rotation;
            if (isNotAroundZero(sx - 1)) {
                sx = Math.sqrt(sx);
            }
            var sy = m[2] * m[2] + m[3] * m[3];
            if (isNotAroundZero(sy - 1)) {
                sy = Math.sqrt(sy);
            }
            position[0] = m[4];
            position[1] = m[5];
            scale[0] = sx;
            scale[1] = sy;
            scale[2] = scale[3] = 0;
            rotation[0] = Math.atan2(-m[1] / sy, m[0] / sx);
            rotation[1] = rotation[2] = 0;
        }
    };
    module.exports = Transformable;
});

define("app/pc/canvaslib/tool/color", [ "app/pc/canvaslib/tool/util", "app/pc/canvaslib/dep/excanvas" ], function(require, exports, module) {
    /**
 * 颜色辅助模块
 * @module zrender/tool/color
 */
    var util = require("app/pc/canvaslib/tool/util");
    var _ctx;
    // Color palette is an array containing the default colors for the chart's
    // series.
    // When all colors are used, new colors are selected from the start again.
    // Defaults to:
    // 默认色板
    var palette = [ "#ff9277", " #dddd00", " #ffc877", " #bbe3ff", " #d5ffbb", "#bbbbff", " #ddb000", " #b0dd00", " #e2bbff", " #ffbbe3", "#ff7777", " #ff9900", " #83dd00", " #77e3ff", " #778fff", "#c877ff", " #ff77ab", " #ff6600", " #aa8800", " #77c7ff", "#ad77ff", " #ff77ff", " #dd0083", " #777700", " #00aa00", "#0088aa", " #8400dd", " #aa0088", " #dd0000", " #772e00" ];
    var _palette = palette;
    var highlightColor = "rgba(255,255,0,0.5)";
    var _highlightColor = highlightColor;
    // 颜色格式
    /*jshint maxlen: 330 */
    var colorRegExp = /^\s*((#[a-f\d]{6})|(#[a-f\d]{3})|rgba?\(\s*([\d\.]+%?\s*,\s*[\d\.]+%?\s*,\s*[\d\.]+%?(?:\s*,\s*[\d\.]+%?)?)\s*\)|hsba?\(\s*([\d\.]+(?:deg|\xb0|%)?\s*,\s*[\d\.]+%?\s*,\s*[\d\.]+%?(?:\s*,\s*[\d\.]+)?)%?\s*\)|hsla?\(\s*([\d\.]+(?:deg|\xb0|%)?\s*,\s*[\d\.]+%?\s*,\s*[\d\.]+%?(?:\s*,\s*[\d\.]+)?)%?\s*\))\s*$/i;
    var _nameColors = {
        aliceblue: "#f0f8ff",
        antiquewhite: "#faebd7",
        aqua: "#0ff",
        aquamarine: "#7fffd4",
        azure: "#f0ffff",
        beige: "#f5f5dc",
        bisque: "#ffe4c4",
        black: "#000",
        blanchedalmond: "#ffebcd",
        blue: "#00f",
        blueviolet: "#8a2be2",
        brown: "#a52a2a",
        burlywood: "#deb887",
        cadetblue: "#5f9ea0",
        chartreuse: "#7fff00",
        chocolate: "#d2691e",
        coral: "#ff7f50",
        cornflowerblue: "#6495ed",
        cornsilk: "#fff8dc",
        crimson: "#dc143c",
        cyan: "#0ff",
        darkblue: "#00008b",
        darkcyan: "#008b8b",
        darkgoldenrod: "#b8860b",
        darkgray: "#a9a9a9",
        darkgrey: "#a9a9a9",
        darkgreen: "#006400",
        darkkhaki: "#bdb76b",
        darkmagenta: "#8b008b",
        darkolivegreen: "#556b2f",
        darkorange: "#ff8c00",
        darkorchid: "#9932cc",
        darkred: "#8b0000",
        darksalmon: "#e9967a",
        darkseagreen: "#8fbc8f",
        darkslateblue: "#483d8b",
        darkslategray: "#2f4f4f",
        darkslategrey: "#2f4f4f",
        darkturquoise: "#00ced1",
        darkviolet: "#9400d3",
        deeppink: "#ff1493",
        deepskyblue: "#00bfff",
        dimgray: "#696969",
        dimgrey: "#696969",
        dodgerblue: "#1e90ff",
        firebrick: "#b22222",
        floralwhite: "#fffaf0",
        forestgreen: "#228b22",
        fuchsia: "#f0f",
        gainsboro: "#dcdcdc",
        ghostwhite: "#f8f8ff",
        gold: "#ffd700",
        goldenrod: "#daa520",
        gray: "#808080",
        grey: "#808080",
        green: "#008000",
        greenyellow: "#adff2f",
        honeydew: "#f0fff0",
        hotpink: "#ff69b4",
        indianred: "#cd5c5c",
        indigo: "#4b0082",
        ivory: "#fffff0",
        khaki: "#f0e68c",
        lavender: "#e6e6fa",
        lavenderblush: "#fff0f5",
        lawngreen: "#7cfc00",
        lemonchiffon: "#fffacd",
        lightblue: "#add8e6",
        lightcoral: "#f08080",
        lightcyan: "#e0ffff",
        lightgoldenrodyellow: "#fafad2",
        lightgray: "#d3d3d3",
        lightgrey: "#d3d3d3",
        lightgreen: "#90ee90",
        lightpink: "#ffb6c1",
        lightsalmon: "#ffa07a",
        lightseagreen: "#20b2aa",
        lightskyblue: "#87cefa",
        lightslategray: "#789",
        lightslategrey: "#789",
        lightsteelblue: "#b0c4de",
        lightyellow: "#ffffe0",
        lime: "#0f0",
        limegreen: "#32cd32",
        linen: "#faf0e6",
        magenta: "#f0f",
        maroon: "#800000",
        mediumaquamarine: "#66cdaa",
        mediumblue: "#0000cd",
        mediumorchid: "#ba55d3",
        mediumpurple: "#9370d8",
        mediumseagreen: "#3cb371",
        mediumslateblue: "#7b68ee",
        mediumspringgreen: "#00fa9a",
        mediumturquoise: "#48d1cc",
        mediumvioletred: "#c71585",
        midnightblue: "#191970",
        mintcream: "#f5fffa",
        mistyrose: "#ffe4e1",
        moccasin: "#ffe4b5",
        navajowhite: "#ffdead",
        navy: "#000080",
        oldlace: "#fdf5e6",
        olive: "#808000",
        olivedrab: "#6b8e23",
        orange: "#ffa500",
        orangered: "#ff4500",
        orchid: "#da70d6",
        palegoldenrod: "#eee8aa",
        palegreen: "#98fb98",
        paleturquoise: "#afeeee",
        palevioletred: "#d87093",
        papayawhip: "#ffefd5",
        peachpuff: "#ffdab9",
        peru: "#cd853f",
        pink: "#ffc0cb",
        plum: "#dda0dd",
        powderblue: "#b0e0e6",
        purple: "#800080",
        red: "#f00",
        rosybrown: "#bc8f8f",
        royalblue: "#4169e1",
        saddlebrown: "#8b4513",
        salmon: "#fa8072",
        sandybrown: "#f4a460",
        seagreen: "#2e8b57",
        seashell: "#fff5ee",
        sienna: "#a0522d",
        silver: "#c0c0c0",
        skyblue: "#87ceeb",
        slateblue: "#6a5acd",
        slategray: "#708090",
        slategrey: "#708090",
        snow: "#fffafa",
        springgreen: "#00ff7f",
        steelblue: "#4682b4",
        tan: "#d2b48c",
        teal: "#008080",
        thistle: "#d8bfd8",
        tomato: "#ff6347",
        turquoise: "#40e0d0",
        violet: "#ee82ee",
        wheat: "#f5deb3",
        white: "#fff",
        whitesmoke: "#f5f5f5",
        yellow: "#ff0",
        yellowgreen: "#9acd32"
    };
    /**
     * 自定义调色板
     */
    function customPalette(userPalete) {
        palette = userPalete;
    }
    /**
     * 复位默认色板
     */
    function resetPalette() {
        palette = _palette;
    }
    /**
     * 获取色板颜色
     * @memberOf module:zrender/tool/color
     * @param {number} idx 色板位置
     * @param {Array.<string>} [userPalete] 自定义色板
     * @return {string} 颜色
     */
    function getColor(idx, userPalete) {
        idx = idx | 0;
        userPalete = userPalete || palette;
        return userPalete[idx % userPalete.length];
    }
    /**
     * 自定义默认高亮颜色
     */
    function customHighlight(userHighlightColor) {
        highlightColor = userHighlightColor;
    }
    /**
     * 重置默认高亮颜色
     */
    function resetHighlight() {
        _highlightColor = highlightColor;
    }
    /**
     * 获取默认高亮颜色
     */
    function getHighlightColor() {
        return highlightColor;
    }
    /**
     * 径向渐变
     * @memberOf module:zrender/tool/color
     * @param {number} x0 渐变起点
     * @param {number} y0
     * @param {number} r0
     * @param {number} x1 渐变终点
     * @param {number} y1
     * @param {number} r1
     * @param {Array} colorList 颜色列表
     * @return {CanvasGradient}
     */
    function getRadialGradient(x0, y0, r0, x1, y1, r1, colorList) {
        if (!_ctx) {
            _ctx = util.getContext();
        }
        var gradient = _ctx.createRadialGradient(x0, y0, r0, x1, y1, r1);
        for (var i = 0, l = colorList.length; i < l; i++) {
            gradient.addColorStop(colorList[i][0], colorList[i][1]);
        }
        gradient.__nonRecursion = true;
        return gradient;
    }
    /**
     * 线性渐变
     * @param {Object} x0 渐变起点
     * @param {Object} y0
     * @param {Object} x1 渐变终点
     * @param {Object} y1
     * @param {Array} colorList 颜色列表
     */
    function getLinearGradient(x0, y0, x1, y1, colorList) {
        if (!_ctx) {
            _ctx = util.getContext();
        }
        var gradient = _ctx.createLinearGradient(x0, y0, x1, y1);
        for (var i = 0, l = colorList.length; i < l; i++) {
            gradient.addColorStop(colorList[i][0], colorList[i][1]);
        }
        gradient.__nonRecursion = true;
        return gradient;
    }
    /**
     * 获取两种颜色之间渐变颜色数组
     * @param {color} start 起始颜色
     * @param {color} end 结束颜色
     * @param {number} step 渐变级数
     * @return {Array}  颜色数组
     */
    function getStepColors(start, end, step) {
        start = toRGBA(start);
        end = toRGBA(end);
        start = getData(start);
        end = getData(end);
        var colors = [];
        var stepR = (end[0] - start[0]) / step;
        var stepG = (end[1] - start[1]) / step;
        var stepB = (end[2] - start[2]) / step;
        var stepA = (end[3] - start[3]) / step;
        // 生成颜色集合
        // fix by linfeng 颜色堆积
        for (var i = 0, r = start[0], g = start[1], b = start[2], a = start[3]; i < step; i++) {
            colors[i] = toColor([ adjust(Math.floor(r), [ 0, 255 ]), adjust(Math.floor(g), [ 0, 255 ]), adjust(Math.floor(b), [ 0, 255 ]), a.toFixed(4) - 0 ], "rgba");
            r += stepR;
            g += stepG;
            b += stepB;
            a += stepA;
        }
        r = end[0];
        g = end[1];
        b = end[2];
        a = end[3];
        colors[i] = toColor([ r, g, b, a ], "rgba");
        return colors;
    }
    /**
     * 获取指定级数的渐变颜色数组
     * @memberOf module:zrender/tool/color
     * @param {Array.<string>} colors 颜色组
     * @param {number} [step=20] 渐变级数
     * @return {Array.<string>}  颜色数组
     */
    function getGradientColors(colors, step) {
        var ret = [];
        var len = colors.length;
        if (step === undefined) {
            step = 20;
        }
        if (len === 1) {
            ret = getStepColors(colors[0], colors[0], step);
        } else if (len > 1) {
            for (var i = 0, n = len - 1; i < n; i++) {
                var steps = getStepColors(colors[i], colors[i + 1], step);
                if (i < n - 1) {
                    steps.pop();
                }
                ret = ret.concat(steps);
            }
        }
        return ret;
    }
    /**
     * 颜色值数组转为指定格式颜色,例如:<br/>
     * data = [60,20,20,0.1] format = 'rgba'
     * 返回：rgba(60,20,20,0.1)
     * @param {Array} data 颜色值数组
     * @param {string} format 格式,默认rgb
     * @return {string} 颜色
     */
    function toColor(data, format) {
        format = format || "rgb";
        if (data && (data.length === 3 || data.length === 4)) {
            data = map(data, function(c) {
                return c > 1 ? Math.ceil(c) : c;
            });
            if (format.indexOf("hex") > -1) {
                return "#" + ((1 << 24) + (data[0] << 16) + (data[1] << 8) + +data[2]).toString(16).slice(1);
            } else if (format.indexOf("hs") > -1) {
                var sx = map(data.slice(1, 3), function(c) {
                    return c + "%";
                });
                data[1] = sx[0];
                data[2] = sx[1];
            }
            if (format.indexOf("a") > -1) {
                if (data.length === 3) {
                    data.push(1);
                }
                data[3] = adjust(data[3], [ 0, 1 ]);
                return format + "(" + data.slice(0, 4).join(",") + ")";
            }
            return format + "(" + data.slice(0, 3).join(",") + ")";
        }
    }
    /**
     * 颜色字符串转换为rgba数组
     * @memberOf module:zrender/tool/color
     * @param {string} color 颜色
     * @return {Array.<number>} 颜色值数组
     */
    function toArray(color) {
        color = trim(color);
        if (color.indexOf("rgba") < 0) {
            color = toRGBA(color);
        }
        var data = [];
        var i = 0;
        color.replace(/[\d.]+/g, function(n) {
            if (i < 3) {
                n = n | 0;
            } else {
                // Alpha
                n = +n;
            }
            data[i++] = n;
        });
        return data;
    }
    /**
     * 颜色格式转化
     *
     * @param {string} color 颜色值数组
     * @param {string} format 格式,默认rgb
     * @return {string} 颜色
     */
    function convert(color, format) {
        if (!isCalculableColor(color)) {
            return color;
        }
        var data = getData(color);
        var alpha = data[3];
        if (typeof alpha === "undefined") {
            alpha = 1;
        }
        if (color.indexOf("hsb") > -1) {
            data = _HSV_2_RGB(data);
        } else if (color.indexOf("hsl") > -1) {
            data = _HSL_2_RGB(data);
        }
        if (format.indexOf("hsb") > -1 || format.indexOf("hsv") > -1) {
            data = _RGB_2_HSB(data);
        } else if (format.indexOf("hsl") > -1) {
            data = _RGB_2_HSL(data);
        }
        data[3] = alpha;
        return toColor(data, format);
    }
    /**
     * 转换为rgba格式的颜色
     * @memberOf module:zrender/tool/color
     * @param {string} color 颜色
     * @return {string} rgba颜色，rgba(r,g,b,a)
     */
    function toRGBA(color) {
        return convert(color, "rgba");
    }
    /**
     * 转换为rgb数字格式的颜色
     * @memberOf module:zrender/tool/color
     * @param {string} color 颜色
     * @return {string} rgb颜色，rgb(0,0,0)格式
     */
    function toRGB(color) {
        return convert(color, "rgb");
    }
    /**
     * 转换为16进制颜色
     * @memberOf module:zrender/tool/color
     * @param {string} color 颜色
     * @return {string} 16进制颜色，#rrggbb格式
     */
    function toHex(color) {
        return convert(color, "hex");
    }
    /**
     * 转换为HSV颜色
     * @memberOf module:zrender/tool/color
     * @param {string} color 颜色
     * @return {string} HSVA颜色，hsva(h,s,v,a)
     */
    function toHSVA(color) {
        return convert(color, "hsva");
    }
    /**
     * 转换为HSV颜色
     * @memberOf module:zrender/tool/color
     * @param {string} color 颜色
     * @return {string} HSV颜色，hsv(h,s,v)
     */
    function toHSV(color) {
        return convert(color, "hsv");
    }
    /**
     * 转换为HSBA颜色
     * @memberOf module:zrender/tool/color
     * @param {string} color 颜色
     * @return {string} HSBA颜色，hsba(h,s,b,a)
     */
    function toHSBA(color) {
        return convert(color, "hsba");
    }
    /**
     * 转换为HSB颜色
     * @memberOf module:zrender/tool/color
     * @param {string} color 颜色
     * @return {string} HSB颜色，hsb(h,s,b)
     */
    function toHSB(color) {
        return convert(color, "hsb");
    }
    /**
     * 转换为HSLA颜色
     * @memberOf module:zrender/tool/color
     * @param {string} color 颜色
     * @return {string} HSLA颜色，hsla(h,s,l,a)
     */
    function toHSLA(color) {
        return convert(color, "hsla");
    }
    /**
     * 转换为HSL颜色
     * @memberOf module:zrender/tool/color
     * @param {string} color 颜色
     * @return {string} HSL颜色，hsl(h,s,l)
     */
    function toHSL(color) {
        return convert(color, "hsl");
    }
    /**
     * 转换颜色名
     * 
     * @param {string} color 颜色
     * @return {string} 颜色名
     */
    function toName(color) {
        for (var key in _nameColors) {
            if (toHex(_nameColors[key]) === toHex(color)) {
                return key;
            }
        }
        return null;
    }
    /**
     * 移除颜色中多余空格
     * 
     * @param {string} color 颜色
     * @return {string} 无空格颜色
     */
    function trim(color) {
        return String(color).replace(/\s+/g, "");
    }
    /**
     * 颜色规范化
     * @memberOf module:zrender/tool/color
     * @param {string} color 颜色
     * @return {string} 规范化后的颜色
     */
    function normalize(color) {
        // 颜色名
        if (_nameColors[color]) {
            color = _nameColors[color];
        }
        // 去掉空格
        color = trim(color);
        // hsv与hsb等价
        color = color.replace(/hsv/i, "hsb");
        // rgb转为rrggbb
        if (/^#[\da-f]{3}$/i.test(color)) {
            color = parseInt(color.slice(1), 16);
            var r = (color & 3840) << 8;
            var g = (color & 240) << 4;
            var b = color & 15;
            color = "#" + ((1 << 24) + (r << 4) + r + (g << 4) + g + (b << 4) + b).toString(16).slice(1);
        }
        // 或者使用以下正则替换，不过 chrome 下性能相对差点
        // color = color.replace(/^#([\da-f])([\da-f])([\da-f])$/i, '#$1$1$2$2$3$3');
        return color;
    }
    /**
     * 颜色加深或减淡，当level>0加深，当level<0减淡
     * @memberOf module:zrender/tool/color
     * @param {string} color 颜色
     * @param {number} level 升降程度,取值区间[-1,1]
     * @return {string} 加深或减淡后颜色值
     */
    function lift(color, level) {
        if (!isCalculableColor(color)) {
            return color;
        }
        var direct = level > 0 ? 1 : -1;
        if (typeof level === "undefined") {
            level = 0;
        }
        level = Math.abs(level) > 1 ? 1 : Math.abs(level);
        color = toRGB(color);
        var data = getData(color);
        for (var i = 0; i < 3; i++) {
            if (direct === 1) {
                data[i] = data[i] * (1 - level) | 0;
            } else {
                data[i] = (255 - data[i]) * level + data[i] | 0;
            }
        }
        return "rgb(" + data.join(",") + ")";
    }
    /**
     * 颜色翻转,[255-r,255-g,255-b,1-a]
     * @memberOf module:zrender/tool/color
     * @param {string} color 颜色
     * @return {string} 翻转颜色
     */
    function reverse(color) {
        if (!isCalculableColor(color)) {
            return color;
        }
        var data = getData(toRGBA(color));
        data = map(data, function(c) {
            return 255 - c;
        });
        return toColor(data, "rgb");
    }
    /**
     * 简单两种颜色混合
     * @memberOf module:zrender/tool/color
     * @param {string} color1 第一种颜色
     * @param {string} color2 第二种颜色
     * @param {number} weight 混合权重[0-1]
     * @return {string} 结果色,rgb(r,g,b)或rgba(r,g,b,a)
     */
    function mix(color1, color2, weight) {
        if (!isCalculableColor(color1) || !isCalculableColor(color2)) {
            return color1;
        }
        if (typeof weight === "undefined") {
            weight = .5;
        }
        weight = 1 - adjust(weight, [ 0, 1 ]);
        var w = weight * 2 - 1;
        var data1 = getData(toRGBA(color1));
        var data2 = getData(toRGBA(color2));
        var d = data1[3] - data2[3];
        var weight1 = ((w * d === -1 ? w : (w + d) / (1 + w * d)) + 1) / 2;
        var weight2 = 1 - weight1;
        var data = [];
        for (var i = 0; i < 3; i++) {
            data[i] = data1[i] * weight1 + data2[i] * weight2;
        }
        var alpha = data1[3] * weight + data2[3] * (1 - weight);
        alpha = Math.max(0, Math.min(1, alpha));
        if (data1[3] === 1 && data2[3] === 1) {
            // 不考虑透明度
            return toColor(data, "rgb");
        }
        data[3] = alpha;
        return toColor(data, "rgba");
    }
    /**
     * 随机颜色
     * 
     * @return {string} 颜色值，#rrggbb格式
     */
    function random() {
        return "#" + (Math.random().toString(16) + "0000").slice(2, 8);
    }
    /**
     * 获取颜色值数组,返回值范围： <br/>
     * RGB 范围[0-255] <br/>
     * HSL/HSV/HSB 范围[0-1]<br/>
     * A透明度范围[0-1]
     * 支持格式：
     * #rgb
     * #rrggbb
     * rgb(r,g,b)
     * rgb(r%,g%,b%)
     * rgba(r,g,b,a)
     * hsb(h,s,b) // hsv与hsb等价
     * hsb(h%,s%,b%)
     * hsba(h,s,b,a)
     * hsl(h,s,l)
     * hsl(h%,s%,l%)
     * hsla(h,s,l,a)
     *
     * @param {string} color 颜色
     * @return {Array.<number>} 颜色值数组或null
     */
    function getData(color) {
        color = normalize(color);
        var r = color.match(colorRegExp);
        if (r === null) {
            throw new Error("The color format error");
        }
        var d;
        var a;
        var data = [];
        var rgb;
        if (r[2]) {
            // #rrggbb
            d = r[2].replace("#", "").split("");
            rgb = [ d[0] + d[1], d[2] + d[3], d[4] + d[5] ];
            data = map(rgb, function(c) {
                return adjust(parseInt(c, 16), [ 0, 255 ]);
            });
        } else if (r[4]) {
            // rgb rgba
            var rgba = r[4].split(",");
            a = rgba[3];
            rgb = rgba.slice(0, 3);
            data = map(rgb, function(c) {
                c = Math.floor(c.indexOf("%") > 0 ? parseInt(c, 0) * 2.55 : c);
                return adjust(c, [ 0, 255 ]);
            });
            if (typeof a !== "undefined") {
                data.push(adjust(parseFloat(a), [ 0, 1 ]));
            }
        } else if (r[5] || r[6]) {
            // hsb hsba hsl hsla
            var hsxa = (r[5] || r[6]).split(",");
            var h = parseInt(hsxa[0], 0) / 360;
            var s = hsxa[1];
            var x = hsxa[2];
            a = hsxa[3];
            data = map([ s, x ], function(c) {
                return adjust(parseFloat(c) / 100, [ 0, 1 ]);
            });
            data.unshift(h);
            if (typeof a !== "undefined") {
                data.push(adjust(parseFloat(a), [ 0, 1 ]));
            }
        }
        return data;
    }
    /**
     * 设置颜色透明度
     * @memberOf module:zrender/tool/color
     * @param {string} color 颜色
     * @param {number} a 透明度,区间[0,1]
     * @return {string} rgba颜色值
     */
    function alpha(color, a) {
        if (!isCalculableColor(color)) {
            return color;
        }
        if (a === null) {
            a = 1;
        }
        var data = getData(toRGBA(color));
        data[3] = adjust(Number(a).toFixed(4), [ 0, 1 ]);
        return toColor(data, "rgba");
    }
    // 数组映射
    function map(array, fun) {
        if (typeof fun !== "function") {
            throw new TypeError();
        }
        var len = array ? array.length : 0;
        for (var i = 0; i < len; i++) {
            array[i] = fun(array[i]);
        }
        return array;
    }
    // 调整值区间
    function adjust(value, region) {
        // < to <= & > to >=
        // modify by linzhifeng 2014-05-25 because -0 == 0
        if (value <= region[0]) {
            value = region[0];
        } else if (value >= region[1]) {
            value = region[1];
        }
        return value;
    }
    function isCalculableColor(color) {
        return color instanceof Array || typeof color === "string";
    }
    // 参见 http:// www.easyrgb.com/index.php?X=MATH
    function _HSV_2_RGB(data) {
        var H = data[0];
        var S = data[1];
        var V = data[2];
        // HSV from 0 to 1
        var R;
        var G;
        var B;
        if (S === 0) {
            R = V * 255;
            G = V * 255;
            B = V * 255;
        } else {
            var h = H * 6;
            if (h === 6) {
                h = 0;
            }
            var i = h | 0;
            var v1 = V * (1 - S);
            var v2 = V * (1 - S * (h - i));
            var v3 = V * (1 - S * (1 - (h - i)));
            var r = 0;
            var g = 0;
            var b = 0;
            if (i === 0) {
                r = V;
                g = v3;
                b = v1;
            } else if (i === 1) {
                r = v2;
                g = V;
                b = v1;
            } else if (i === 2) {
                r = v1;
                g = V;
                b = v3;
            } else if (i === 3) {
                r = v1;
                g = v2;
                b = V;
            } else if (i === 4) {
                r = v3;
                g = v1;
                b = V;
            } else {
                r = V;
                g = v1;
                b = v2;
            }
            // RGB results from 0 to 255
            R = r * 255;
            G = g * 255;
            B = b * 255;
        }
        return [ R, G, B ];
    }
    function _HSL_2_RGB(data) {
        var H = data[0];
        var S = data[1];
        var L = data[2];
        // HSL from 0 to 1
        var R;
        var G;
        var B;
        if (S === 0) {
            R = L * 255;
            G = L * 255;
            B = L * 255;
        } else {
            var v2;
            if (L < .5) {
                v2 = L * (1 + S);
            } else {
                v2 = L + S - S * L;
            }
            var v1 = 2 * L - v2;
            R = 255 * _HUE_2_RGB(v1, v2, H + 1 / 3);
            G = 255 * _HUE_2_RGB(v1, v2, H);
            B = 255 * _HUE_2_RGB(v1, v2, H - 1 / 3);
        }
        return [ R, G, B ];
    }
    function _HUE_2_RGB(v1, v2, vH) {
        if (vH < 0) {
            vH += 1;
        }
        if (vH > 1) {
            vH -= 1;
        }
        if (6 * vH < 1) {
            return v1 + (v2 - v1) * 6 * vH;
        }
        if (2 * vH < 1) {
            return v2;
        }
        if (3 * vH < 2) {
            return v1 + (v2 - v1) * (2 / 3 - vH) * 6;
        }
        return v1;
    }
    function _RGB_2_HSB(data) {
        // RGB from 0 to 255
        var R = data[0] / 255;
        var G = data[1] / 255;
        var B = data[2] / 255;
        var vMin = Math.min(R, G, B);
        // Min. value of RGB
        var vMax = Math.max(R, G, B);
        // Max. value of RGB
        var delta = vMax - vMin;
        // Delta RGB value
        var V = vMax;
        var H;
        var S;
        // HSV results from 0 to 1
        if (delta === 0) {
            H = 0;
            S = 0;
        } else {
            S = delta / vMax;
            var deltaR = ((vMax - R) / 6 + delta / 2) / delta;
            var deltaG = ((vMax - G) / 6 + delta / 2) / delta;
            var deltaB = ((vMax - B) / 6 + delta / 2) / delta;
            if (R === vMax) {
                H = deltaB - deltaG;
            } else if (G === vMax) {
                H = 1 / 3 + deltaR - deltaB;
            } else if (B === vMax) {
                H = 2 / 3 + deltaG - deltaR;
            }
            if (H < 0) {
                H += 1;
            }
            if (H > 1) {
                H -= 1;
            }
        }
        H = H * 360;
        S = S * 100;
        V = V * 100;
        return [ H, S, V ];
    }
    function _RGB_2_HSL(data) {
        // RGB from 0 to 255
        var R = data[0] / 255;
        var G = data[1] / 255;
        var B = data[2] / 255;
        var vMin = Math.min(R, G, B);
        // Min. value of RGB
        var vMax = Math.max(R, G, B);
        // Max. value of RGB
        var delta = vMax - vMin;
        // Delta RGB value
        var L = (vMax + vMin) / 2;
        var H;
        var S;
        // HSL results from 0 to 1
        if (delta === 0) {
            H = 0;
            S = 0;
        } else {
            if (L < .5) {
                S = delta / (vMax + vMin);
            } else {
                S = delta / (2 - vMax - vMin);
            }
            var deltaR = ((vMax - R) / 6 + delta / 2) / delta;
            var deltaG = ((vMax - G) / 6 + delta / 2) / delta;
            var deltaB = ((vMax - B) / 6 + delta / 2) / delta;
            if (R === vMax) {
                H = deltaB - deltaG;
            } else if (G === vMax) {
                H = 1 / 3 + deltaR - deltaB;
            } else if (B === vMax) {
                H = 2 / 3 + deltaG - deltaR;
            }
            if (H < 0) {
                H += 1;
            }
            if (H > 1) {
                H -= 1;
            }
        }
        H = H * 360;
        S = S * 100;
        L = L * 100;
        return [ H, S, L ];
    }
    module.exports = {
        customPalette: customPalette,
        resetPalette: resetPalette,
        getColor: getColor,
        getHighlightColor: getHighlightColor,
        customHighlight: customHighlight,
        resetHighlight: resetHighlight,
        getRadialGradient: getRadialGradient,
        getLinearGradient: getLinearGradient,
        getGradientColors: getGradientColors,
        getStepColors: getStepColors,
        reverse: reverse,
        mix: mix,
        lift: lift,
        trim: trim,
        random: random,
        toRGB: toRGB,
        toRGBA: toRGBA,
        toHex: toHex,
        toHSL: toHSL,
        toHSLA: toHSLA,
        toHSB: toHSB,
        toHSBA: toHSBA,
        toHSV: toHSV,
        toHSVA: toHSVA,
        toName: toName,
        toColor: toColor,
        toArray: toArray,
        alpha: alpha,
        getData: getData
    };
});

define("app/pc/canvaslib/shape/Rectangle", [ "app/pc/canvaslib/shape/Base", "app/pc/canvaslib/tool/matrix", "app/pc/canvaslib/tool/guid", "app/pc/canvaslib/tool/util", "app/pc/canvaslib/dep/excanvas", "app/pc/canvaslib/tool/log", "app/pc/canvaslib/config", "app/pc/canvaslib/mixin/Transformable", "app/pc/canvaslib/tool/vector", "app/pc/canvaslib/mixin/Eventful", "app/pc/canvaslib/tool/area", "app/pc/canvaslib/tool/curve", "app/pc/canvaslib/tool/color" ], function(require, exports, module) {
    /**
 * 矩形
 * @module zrender/shape/Rectangle
 * @author Kener (@Kener-林峰, kener.linfeng@gmail.com) , 
 *         strwind (@劲风FEI)
 * @example
 *     var Rectangle = require('zrender/shape/Rectangle');
 *     var shape = new Rectangle({
 *         style: {
 *             x: 0,
 *             y: 0,
 *             width: 100,
 *             height: 100,
 *             radius: 20
 *         }
 *     });
 *     zr.addShape(shape);
 */
    /**
 * @typedef {Object} IRectangleStyle
 * @property {number} x 左上角x坐标
 * @property {number} y 左上角y坐标
 * @property {number} width 宽度
 * @property {number} height 高度
 * @property {number|Array.<number>} radius 矩形圆角，可以用数组分别指定四个角的圆角
 * @property {string} [brushType='fill']
 * @property {string} [color='#000000'] 填充颜色
 * @property {string} [strokeColor='#000000'] 描边颜色
 * @property {string} [lineCape='butt'] 线帽样式，可以是 butt, round, square
 * @property {number} [lineWidth=1] 描边宽度
 * @property {number} [opacity=1] 绘制透明度
 * @property {number} [shadowBlur=0] 阴影模糊度，大于0有效
 * @property {string} [shadowColor='#000000'] 阴影颜色
 * @property {number} [shadowOffsetX=0] 阴影横向偏移
 * @property {number} [shadowOffsetY=0] 阴影纵向偏移
 * @property {string} [text] 图形中的附加文本
 * @property {string} [textColor='#000000'] 文本颜色
 * @property {string} [textFont] 附加文本样式，eg:'bold 18px verdana'
 * @property {string} [textPosition='end'] 附加文本位置, 可以是 inside, left, right, top, bottom
 * @property {string} [textAlign] 默认根据textPosition自动设置，附加文本水平对齐。
 *                                可以是start, end, left, right, center
 * @property {string} [textBaseline] 默认根据textPosition自动设置，附加文本垂直对齐。
 *                                可以是top, bottom, middle, alphabetic, hanging, ideographic
 */
    var Base = require("app/pc/canvaslib/shape/Base");
    /**
         * @alias module:zrender/shape/Rectangle
         * @constructor
         * @extends module:zrender/shape/Base
         * @param {Object} options
         */
    var Rectangle = function(options) {
        Base.call(this, options);
    };
    Rectangle.prototype = {
        type: "rectangle",
        _buildRadiusPath: function(ctx, style) {
            // 左上、右上、右下、左下角的半径依次为r1、r2、r3、r4
            // r缩写为1         相当于 [1, 1, 1, 1]
            // r缩写为[1]       相当于 [1, 1, 1, 1]
            // r缩写为[1, 2]    相当于 [1, 2, 1, 2]
            // r缩写为[1, 2, 3] 相当于 [1, 2, 3, 2]
            var x = style.x;
            var y = style.y;
            var width = style.width;
            var height = style.height;
            var r = style.radius;
            var r1;
            var r2;
            var r3;
            var r4;
            if (typeof r === "number") {
                r1 = r2 = r3 = r4 = r;
            } else if (r instanceof Array) {
                if (r.length === 1) {
                    r1 = r2 = r3 = r4 = r[0];
                } else if (r.length === 2) {
                    r1 = r3 = r[0];
                    r2 = r4 = r[1];
                } else if (r.length === 3) {
                    r1 = r[0];
                    r2 = r4 = r[1];
                    r3 = r[2];
                } else {
                    r1 = r[0];
                    r2 = r[1];
                    r3 = r[2];
                    r4 = r[3];
                }
            } else {
                r1 = r2 = r3 = r4 = 0;
            }
            var total;
            if (r1 + r2 > width) {
                total = r1 + r2;
                r1 *= width / total;
                r2 *= width / total;
            }
            if (r3 + r4 > width) {
                total = r3 + r4;
                r3 *= width / total;
                r4 *= width / total;
            }
            if (r2 + r3 > height) {
                total = r2 + r3;
                r2 *= height / total;
                r3 *= height / total;
            }
            if (r1 + r4 > height) {
                total = r1 + r4;
                r1 *= height / total;
                r4 *= height / total;
            }
            ctx.moveTo(x + r1, y);
            ctx.lineTo(x + width - r2, y);
            r2 !== 0 && ctx.quadraticCurveTo(x + width, y, x + width, y + r2);
            ctx.lineTo(x + width, y + height - r3);
            r3 !== 0 && ctx.quadraticCurveTo(x + width, y + height, x + width - r3, y + height);
            ctx.lineTo(x + r4, y + height);
            r4 !== 0 && ctx.quadraticCurveTo(x, y + height, x, y + height - r4);
            ctx.lineTo(x, y + r1);
            r1 !== 0 && ctx.quadraticCurveTo(x, y, x + r1, y);
        },
        /**
             * 创建矩形路径
             * @param {CanvasRenderingContext2D} ctx
             * @param {Object} style
             */
        buildPath: function(ctx, style) {
            if (!style.radius) {
                ctx.moveTo(style.x, style.y);
                ctx.lineTo(style.x + style.width, style.y);
                ctx.lineTo(style.x + style.width, style.y + style.height);
                ctx.lineTo(style.x, style.y + style.height);
                ctx.lineTo(style.x, style.y);
            } else {
                this._buildRadiusPath(ctx, style);
            }
            ctx.closePath();
            return;
        },
        /**
             * 计算返回矩形包围盒矩阵
             * @param {module:zrender/shape/Rectangle~IRectangleStyle} style
             * @return {module:zrender/shape/Base~IBoundingRect}
             */
        getRect: function(style) {
            if (style.__rect) {
                return style.__rect;
            }
            var lineWidth;
            if (style.brushType == "stroke" || style.brushType == "fill") {
                lineWidth = style.lineWidth || 1;
            } else {
                lineWidth = 0;
            }
            style.__rect = {
                x: Math.round(style.x - lineWidth / 2),
                y: Math.round(style.y - lineWidth / 2),
                width: style.width + lineWidth,
                height: style.height + lineWidth
            };
            return style.__rect;
        }
    };
    require("app/pc/canvaslib/tool/util").inherits(Rectangle, Base);
    module.exports = Rectangle;
});

define("app/pc/canvaslib/shape/Image", [ "app/pc/canvaslib/shape/Base", "app/pc/canvaslib/tool/matrix", "app/pc/canvaslib/tool/guid", "app/pc/canvaslib/tool/util", "app/pc/canvaslib/dep/excanvas", "app/pc/canvaslib/tool/log", "app/pc/canvaslib/config", "app/pc/canvaslib/mixin/Transformable", "app/pc/canvaslib/tool/vector", "app/pc/canvaslib/mixin/Eventful", "app/pc/canvaslib/tool/area", "app/pc/canvaslib/tool/curve", "app/pc/canvaslib/tool/color" ], function(require, exports, module) {
    /**
 * 图片绘制
 * @module zrender/shape/Image
 * @author pissang(https://www.github.com/pissang)
 * @example
 *     var ImageShape = require('zrender/shape/Image');
 *     var image = new ImageShape({
 *         style: {
 *             image: 'test.jpg',
 *             x: 100,
 *             y: 100
 *         }
 *     });
 *     zr.addShape(image);
 */
    /**
 * @typedef {Object} IImageStyle
 * @property {string|HTMLImageElement|HTMLCanvasElement} image 图片url或者图片对象
 * @property {number} x 左上角横坐标
 * @property {number} y 左上角纵坐标
 * @property {number} [width] 绘制到画布上的宽度，默认为图片宽度
 * @property {number} [height] 绘制到画布上的高度，默认为图片高度
 * @property {number} [sx=0] 从图片中裁剪的左上角横坐标
 * @property {number} [sy=0] 从图片中裁剪的左上角纵坐标
 * @property {number} [sWidth] 从图片中裁剪的宽度，默认为图片高度
 * @property {number} [sHeight] 从图片中裁剪的高度，默认为图片高度
 * @property {number} [opacity=1] 绘制透明度
 * @property {number} [shadowBlur=0] 阴影模糊度，大于0有效
 * @property {string} [shadowColor='#000000'] 阴影颜色
 * @property {number} [shadowOffsetX=0] 阴影横向偏移
 * @property {number} [shadowOffsetY=0] 阴影纵向偏移
 * @property {string} [text] 图形中的附加文本
 * @property {string} [textColor='#000000'] 文本颜色
 * @property {string} [textFont] 附加文本样式，eg:'bold 18px verdana'
 * @property {string} [textPosition='end'] 附加文本位置, 可以是 inside, left, right, top, bottom
 * @property {string} [textAlign] 默认根据textPosition自动设置，附加文本水平对齐。
 *                                可以是start, end, left, right, center
 * @property {string} [textBaseline] 默认根据textPosition自动设置，附加文本垂直对齐。
 *                                可以是top, bottom, middle, alphabetic, hanging, ideographic
 */
    var Base = require("app/pc/canvaslib/shape/Base");
    /**
         * @alias zrender/shape/Image
         * @constructor
         * @extends module:zrender/shape/Base
         * @param {Object} options
         */
    var ZImage = function(options) {
        Base.call(this, options);
    };
    ZImage.prototype = {
        type: "image",
        brush: function(ctx, isHighlight, refreshNextFrame) {
            var style = this.style || {};
            if (isHighlight) {
                // 根据style扩展默认高亮样式
                style = this.getHighlightStyle(style, this.highlightStyle || {});
            }
            var image = style.image;
            var self = this;
            if (!this._imageCache) {
                this._imageCache = {};
            }
            if (typeof image === "string") {
                var src = image;
                if (this._imageCache[src]) {
                    image = this._imageCache[src];
                } else {
                    image = new Image();
                    image.onload = function() {
                        image.onload = null;
                        self.modSelf();
                        refreshNextFrame();
                    };
                    image.src = src;
                    this._imageCache[src] = image;
                }
            }
            if (image) {
                // 图片已经加载完成
                if (image.nodeName.toUpperCase() == "IMG") {
                    if (window.ActiveXObject) {
                        if (image.readyState != "complete") {
                            return;
                        }
                    } else {
                        if (!image.complete) {
                            return;
                        }
                    }
                }
                // Else is canvas
                var width = style.width || image.width;
                var height = style.height || image.height;
                var x = style.x;
                var y = style.y;
                // 图片加载失败
                if (!image.width || !image.height) {
                    return;
                }
                ctx.save();
                this.doClip(ctx);
                this.setContext(ctx, style);
                // 设置transform
                this.setTransform(ctx);
                if (style.sWidth && style.sHeight) {
                    var sx = style.sx || 0;
                    var sy = style.sy || 0;
                    ctx.drawImage(image, sx, sy, style.sWidth, style.sHeight, x, y, width, height);
                } else if (style.sx && style.sy) {
                    var sx = style.sx;
                    var sy = style.sy;
                    var sWidth = width - sx;
                    var sHeight = height - sy;
                    ctx.drawImage(image, sx, sy, sWidth, sHeight, x, y, width, height);
                } else {
                    ctx.drawImage(image, x, y, width, height);
                }
                // 如果没设置宽和高的话自动根据图片宽高设置
                if (!style.width) {
                    style.width = width;
                }
                if (!style.height) {
                    style.height = height;
                }
                if (!this.style.width) {
                    this.style.width = width;
                }
                if (!this.style.height) {
                    this.style.height = height;
                }
                this.drawText(ctx, style, this.style);
                ctx.restore();
            }
        },
        /**
             * 计算返回图片的包围盒矩形
             * @param {module:zrender/shape/Image~IImageStyle} style
             * @return {module:zrender/shape/Base~IBoundingRect}
             */
        getRect: function(style) {
            return {
                x: style.x,
                y: style.y,
                width: style.width,
                height: style.height
            };
        },
        clearCache: function() {
            this._imageCache = {};
        }
    };
    require("app/pc/canvaslib/tool/util").inherits(ZImage, Base);
    module.exports = ZImage;
});

define("app/pc/canvaslib/Storage", [ "app/pc/canvaslib/tool/util", "app/pc/canvaslib/dep/excanvas", "app/pc/canvaslib/Group", "app/pc/canvaslib/tool/guid", "app/pc/canvaslib/mixin/Transformable", "app/pc/canvaslib/tool/matrix", "app/pc/canvaslib/tool/vector", "app/pc/canvaslib/mixin/Eventful" ], function(require, exports, module) {
    /**
 * Storage内容仓库模块
 * @module zrender/Storage
 * @author Kener (@Kener-林峰, kener.linfeng@gmail.com)
 * @author errorrik (errorrik@gmail.com)
 * @author pissang (https://github.com/pissang/)
 */
    "use strict";
    var util = require("app/pc/canvaslib/tool/util");
    var Group = require("app/pc/canvaslib/Group");
    var defaultIterateOption = {
        hover: false,
        normal: "down",
        update: false
    };
    function shapeCompareFunc(a, b) {
        if (a.zlevel == b.zlevel) {
            if (a.z == b.z) {
                return a.__renderidx - b.__renderidx;
            }
            return a.z - b.z;
        }
        return a.zlevel - b.zlevel;
    }
    /**
         * 内容仓库 (M)
         * @alias module:zrender/Storage
         * @constructor
         */
    var Storage = function() {
        // 所有常规形状，id索引的map
        this._elements = {};
        // 高亮层形状，不稳定，动态增删，数组位置也是z轴方向，靠前显示在下方
        this._hoverElements = [];
        this._roots = [];
        this._shapeList = [];
        this._shapeListOffset = 0;
    };
    /**
         * 遍历迭代器
         * 
         * @param {Function} fun 迭代回调函数，return true终止迭代
         * @param {Object} [option] 迭代参数，缺省为仅降序遍历普通层图形
         * @param {boolean} [option.hover=true] 是否是高亮层图形
         * @param {string} [option.normal='up'] 是否是普通层图形，迭代时是否指定及z轴顺序
         * @param {boolean} [option.update=false] 是否在迭代前更新形状列表
         * 
         */
    Storage.prototype.iterShape = function(fun, option) {
        if (!option) {
            option = defaultIterateOption;
        }
        if (option.hover) {
            // 高亮层数据遍历
            for (var i = 0, l = this._hoverElements.length; i < l; i++) {
                var el = this._hoverElements[i];
                el.updateTransform();
                if (fun(el)) {
                    return this;
                }
            }
        }
        if (option.update) {
            this.updateShapeList();
        }
        // 遍历: 'down' | 'up'
        switch (option.normal) {
          case "down":
            // 降序遍历，高层优先
            var l = this._shapeList.length;
            while (l--) {
                if (fun(this._shapeList[l])) {
                    return this;
                }
            }
            break;

          // case 'up':
            default:
            // 升序遍历，底层优先
            for (var i = 0, l = this._shapeList.length; i < l; i++) {
                if (fun(this._shapeList[i])) {
                    return this;
                }
            }
            break;
        }
        return this;
    };
    /**
         * 返回hover层的形状数组
         * @param  {boolean} [update=false] 是否在返回前更新图形的变换
         * @return {Array.<module:zrender/shape/Base>}
         */
    Storage.prototype.getHoverShapes = function(update) {
        // hoverConnect
        var hoverElements = [];
        for (var i = 0, l = this._hoverElements.length; i < l; i++) {
            hoverElements.push(this._hoverElements[i]);
            var target = this._hoverElements[i].hoverConnect;
            if (target) {
                var shape;
                target = target instanceof Array ? target : [ target ];
                for (var j = 0, k = target.length; j < k; j++) {
                    shape = target[j].id ? target[j] : this.get(target[j]);
                    if (shape) {
                        hoverElements.push(shape);
                    }
                }
            }
        }
        hoverElements.sort(shapeCompareFunc);
        if (update) {
            for (var i = 0, l = hoverElements.length; i < l; i++) {
                hoverElements[i].updateTransform();
            }
        }
        return hoverElements;
    };
    /**
         * 返回所有图形的绘制队列
         * @param  {boolean} [update=false] 是否在返回前更新该数组
         * 详见{@link module:zrender/shape/Base.prototype.updateShapeList}
         * @return {Array.<module:zrender/shape/Base>}
         */
    Storage.prototype.getShapeList = function(update) {
        if (update) {
            this.updateShapeList();
        }
        return this._shapeList;
    };
    /**
         * 更新图形的绘制队列。
         * 每次绘制前都会调用，该方法会先深度优先遍历整个树，更新所有Group和Shape的变换并且把所有可见的Shape保存到数组中，
         * 最后根据绘制的优先级（zlevel > z > 插入顺序）排序得到绘制队列
         */
    Storage.prototype.updateShapeList = function() {
        this._shapeListOffset = 0;
        for (var i = 0, len = this._roots.length; i < len; i++) {
            var root = this._roots[i];
            this._updateAndAddShape(root);
        }
        this._shapeList.length = this._shapeListOffset;
        for (var i = 0, len = this._shapeList.length; i < len; i++) {
            this._shapeList[i].__renderidx = i;
        }
        this._shapeList.sort(shapeCompareFunc);
    };
    Storage.prototype._updateAndAddShape = function(el, clipShapes) {
        if (el.ignore) {
            return;
        }
        el.updateTransform();
        if (el.type == "group") {
            if (el.clipShape) {
                // clipShape 的变换是基于 group 的变换
                el.clipShape.parent = el;
                el.clipShape.updateTransform();
                // PENDING 效率影响
                if (clipShapes) {
                    clipShapes = clipShapes.slice();
                    clipShapes.push(el.clipShape);
                } else {
                    clipShapes = [ el.clipShape ];
                }
            }
            for (var i = 0; i < el._children.length; i++) {
                var child = el._children[i];
                // Force to mark as dirty if group is dirty
                child.__dirty = el.__dirty || child.__dirty;
                this._updateAndAddShape(child, clipShapes);
            }
            // Mark group clean here
            el.__dirty = false;
        } else {
            el.__clipShapes = clipShapes;
            this._shapeList[this._shapeListOffset++] = el;
        }
    };
    /**
         * 修改图形(Shape)或者组(Group)
         * 
         * @param {string} elId 唯一标识
         * @param {Object} [params] 参数
         */
    Storage.prototype.mod = function(elId, params) {
        var el = this._elements[elId];
        if (el) {
            el.modSelf();
            if (params) {
                // 如果第二个参数直接使用 shape
                // parent, _storage, __startClip 三个属性会有循环引用
                // 主要为了向 1.x 版本兼容，2.x 版本不建议使用第二个参数
                if (params.parent || params._storage || params.__startClip) {
                    var target = {};
                    for (var name in params) {
                        if (name == "parent" || name == "_storage" || name == "__startClip") {
                            continue;
                        }
                        if (params.hasOwnProperty(name)) {
                            target[name] = params[name];
                        }
                    }
                    util.merge(el, target, true);
                } else {
                    util.merge(el, params, true);
                }
            }
        }
        return this;
    };
    /**
         * 移动指定的图形(Shape)或者组(Group)的位置
         * @param {string} shapeId 形状唯一标识
         * @param {number} dx
         * @param {number} dy
         */
    Storage.prototype.drift = function(shapeId, dx, dy) {
        var shape = this._elements[shapeId];
        if (shape) {
            shape.needTransform = true;
            if (shape.draggable === "horizontal") {
                dy = 0;
            } else if (shape.draggable === "vertical") {
                dx = 0;
            }
            if (!shape.ondrift || shape.ondrift && !shape.ondrift(dx, dy)) {
                shape.drift(dx, dy);
            }
        }
        return this;
    };
    /**
         * 添加高亮层数据
         * 
         * @param {module:zrender/shape/Base} shape
         */
    Storage.prototype.addHover = function(shape) {
        shape.updateNeedTransform();
        this._hoverElements.push(shape);
        return this;
    };
    /**
         * 清空高亮层数据
         */
    Storage.prototype.delHover = function() {
        this._hoverElements = [];
        return this;
    };
    /**
         * 是否有图形在高亮层里
         * @return {boolean}
         */
    Storage.prototype.hasHoverShape = function() {
        return this._hoverElements.length > 0;
    };
    /**
         * 添加图形(Shape)或者组(Group)到根节点
         * @param {module:zrender/shape/Shape|module:zrender/Group} el
         */
    Storage.prototype.addRoot = function(el) {
        if (el instanceof Group) {
            el.addChildrenToStorage(this);
        }
        this.addToMap(el);
        this._roots.push(el);
    };
    /**
         * 删除指定的图形(Shape)或者组(Group)
         * @param  {string|Array.<string>} [elId] 如果为空清空整个Storage
         */
    Storage.prototype.delRoot = function(elId) {
        if (typeof elId == "undefined") {
            // 不指定elId清空
            for (var i = 0; i < this._roots.length; i++) {
                var root = this._roots[i];
                if (root instanceof Group) {
                    root.delChildrenFromStorage(this);
                }
            }
            this._elements = {};
            this._hoverElements = [];
            this._roots = [];
            this._shapeList = [];
            this._shapeListOffset = 0;
            return;
        }
        if (elId instanceof Array) {
            for (var i = 0, l = elId.length; i < l; i++) {
                this.delRoot(elId[i]);
            }
            return;
        }
        var el;
        if (typeof elId == "string") {
            el = this._elements[elId];
        } else {
            el = elId;
        }
        var idx = util.indexOf(this._roots, el);
        if (idx >= 0) {
            this.delFromMap(el.id);
            this._roots.splice(idx, 1);
            if (el instanceof Group) {
                el.delChildrenFromStorage(this);
            }
        }
    };
    Storage.prototype.addToMap = function(el) {
        if (el instanceof Group) {
            el._storage = this;
        }
        el.modSelf();
        this._elements[el.id] = el;
        return this;
    };
    Storage.prototype.get = function(elId) {
        return this._elements[elId];
    };
    Storage.prototype.delFromMap = function(elId) {
        var el = this._elements[elId];
        if (el) {
            delete this._elements[elId];
            if (el instanceof Group) {
                el._storage = null;
            }
        }
        return this;
    };
    /**
         * 清空并且释放Storage
         */
    Storage.prototype.dispose = function() {
        this._elements = this._renderList = this._roots = this._hoverElements = null;
    };
    module.exports = Storage;
});

define("app/pc/canvaslib/Group", [ "app/pc/canvaslib/tool/guid", "app/pc/canvaslib/tool/util", "app/pc/canvaslib/dep/excanvas", "app/pc/canvaslib/mixin/Transformable", "app/pc/canvaslib/tool/matrix", "app/pc/canvaslib/tool/vector", "app/pc/canvaslib/mixin/Eventful" ], function(require, exports, module) {
    /**
 * Group是一个容器，可以插入子节点，Group的变换也会被应用到子节点上
 * @module zrender/Group
 * @example
 *     var Group = require('zrender/Group');
 *     var Circle = require('zrender/shape/Circle');
 *     var g = new Group();
 *     g.position[0] = 100;
 *     g.position[1] = 100;
 *     g.addChild(new Circle({
 *         style: {
 *             x: 100,
 *             y: 100,
 *             r: 20,
 *             brushType: 'fill'
 *         }
 *     }));
 *     zr.addGroup(g);
 */
    var guid = require("app/pc/canvaslib/tool/guid");
    var util = require("app/pc/canvaslib/tool/util");
    var Transformable = require("app/pc/canvaslib/mixin/Transformable");
    var Eventful = require("app/pc/canvaslib/mixin/Eventful");
    /**
     * @alias module:zrender/Group
     * @constructor
     * @extends module:zrender/mixin/Transformable
     * @extends module:zrender/mixin/Eventful
     */
    var Group = function(options) {
        options = options || {};
        /**
         * Group id
         * @type {string}
         */
        this.id = options.id || guid();
        for (var key in options) {
            this[key] = options[key];
        }
        /**
         * @type {string}
         */
        this.type = "group";
        /**
         * 用于裁剪的图形(shape)，所有 Group 内的图形在绘制时都会被这个图形裁剪
         * 该图形会继承Group的变换
         * @type {module:zrender/shape/Base}
         * @see http://www.w3.org/TR/2dcontext/#clipping-region
         */
        this.clipShape = null;
        this._children = [];
        this._storage = null;
        this.__dirty = true;
        // Mixin
        Transformable.call(this);
        Eventful.call(this);
    };
    /**
     * 是否忽略该 Group 及其所有子节点
     * @type {boolean}
     * @default false
     */
    Group.prototype.ignore = false;
    /**
     * 复制并返回一份新的包含所有儿子节点的数组
     * @return {Array.<module:zrender/Group|module:zrender/shape/Base>}
     */
    Group.prototype.children = function() {
        return this._children.slice();
    };
    /**
     * 获取指定 index 的儿子节点
     * @param  {number} idx
     * @return {module:zrender/Group|module:zrender/shape/Base}
     */
    Group.prototype.childAt = function(idx) {
        return this._children[idx];
    };
    /**
     * 添加子节点，可以是Shape或者Group
     * @param {module:zrender/Group|module:zrender/shape/Base} child
     */
    // TODO Type Check
    Group.prototype.addChild = function(child) {
        if (child == this) {
            return;
        }
        if (child.parent == this) {
            return;
        }
        if (child.parent) {
            child.parent.removeChild(child);
        }
        this._children.push(child);
        child.parent = this;
        if (this._storage && this._storage !== child._storage) {
            this._storage.addToMap(child);
            if (child instanceof Group) {
                child.addChildrenToStorage(this._storage);
            }
        }
    };
    /**
     * 移除子节点
     * @param {module:zrender/Group|module:zrender/shape/Base} child
     */
    // TODO Type Check
    Group.prototype.removeChild = function(child) {
        var idx = util.indexOf(this._children, child);
        this._children.splice(idx, 1);
        child.parent = null;
        if (this._storage) {
            this._storage.delFromMap(child.id);
            if (child instanceof Group) {
                child.delChildrenFromStorage(this._storage);
            }
        }
    };
    /**
     * 遍历所有子节点
     * @param  {Function} cb
     * @param  {}   context
     */
    Group.prototype.eachChild = function(cb, context) {
        var haveContext = !!context;
        for (var i = 0; i < this._children.length; i++) {
            var child = this._children[i];
            if (haveContext) {
                cb.call(context, child);
            } else {
                cb(child);
            }
        }
    };
    /**
     * 深度优先遍历所有子孙节点
     * @param  {Function} cb
     * @param  {}   context
     */
    Group.prototype.traverse = function(cb, context) {
        var haveContext = !!context;
        for (var i = 0; i < this._children.length; i++) {
            var child = this._children[i];
            if (haveContext) {
                cb.call(context, child);
            } else {
                cb(child);
            }
            if (child.type === "group") {
                child.traverse(cb, context);
            }
        }
    };
    Group.prototype.addChildrenToStorage = function(storage) {
        for (var i = 0; i < this._children.length; i++) {
            var child = this._children[i];
            storage.addToMap(child);
            if (child.type === "group") {
                child.addChildrenToStorage(storage);
            }
        }
    };
    Group.prototype.delChildrenFromStorage = function(storage) {
        for (var i = 0; i < this._children.length; i++) {
            var child = this._children[i];
            storage.delFromMap(child.id);
            if (child.type === "group") {
                child.delChildrenFromStorage(storage);
            }
        }
    };
    Group.prototype.modSelf = function() {
        this.__dirty = true;
    };
    util.merge(Group.prototype, Transformable.prototype, true);
    util.merge(Group.prototype, Eventful.prototype, true);
    module.exports = Group;
});

define("app/pc/canvaslib/animation/Animation", [ "app/pc/canvaslib/animation/Clip", "app/pc/canvaslib/animation/easing", "app/pc/canvaslib/tool/color", "app/pc/canvaslib/tool/util", "app/pc/canvaslib/dep/excanvas", "app/pc/canvaslib/tool/event", "app/pc/canvaslib/mixin/Eventful" ], function(require, exports, module) {
    /**
 * 动画主类, 调度和管理所有动画控制器
 * 
 * @module zrender/animation/Animation
 * @author pissang(https://github.com/pissang)
 */
    "use strict";
    var Clip = require("app/pc/canvaslib/animation/Clip");
    var color = require("app/pc/canvaslib/tool/color");
    var util = require("app/pc/canvaslib/tool/util");
    var Dispatcher = require("app/pc/canvaslib/tool/event").Dispatcher;
    var requestAnimationFrame = window.requestAnimationFrame || window.msRequestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || function(func) {
        setTimeout(func, 16);
    };
    var arraySlice = Array.prototype.slice;
    /**
         * @typedef {Object} IZRenderStage
         * @property {Function} update
         */
    /** 
         * @alias module:zrender/animation/Animation
         * @constructor
         * @param {Object} [options]
         * @param {Function} [options.onframe]
         * @param {IZRenderStage} [options.stage]
         * @example
         *     var animation = new Animation();
         *     var obj = {
         *         x: 100,
         *         y: 100
         *     };
         *     animation.animate(node.position)
         *         .when(1000, {
         *             x: 500,
         *             y: 500
         *         })
         *         .when(2000, {
         *             x: 100,
         *             y: 100
         *         })
         *         .start('spline');
         */
    var Animation = function(options) {
        options = options || {};
        this.stage = options.stage || {};
        this.onframe = options.onframe || function() {};
        // private properties
        this._clips = [];
        this._running = false;
        this._time = 0;
        Dispatcher.call(this);
    };
    Animation.prototype = {
        /**
             * 添加动画片段
             * @param {module:zrender/animation/Clip} clip
             */
        add: function(clip) {
            this._clips.push(clip);
        },
        /**
             * 删除动画片段
             * @param {module:zrender/animation/Clip} clip
             */
        remove: function(clip) {
            var idx = util.indexOf(this._clips, clip);
            if (idx >= 0) {
                this._clips.splice(idx, 1);
            }
        },
        _update: function() {
            var time = new Date().getTime();
            var delta = time - this._time;
            var clips = this._clips;
            var len = clips.length;
            var deferredEvents = [];
            var deferredClips = [];
            for (var i = 0; i < len; i++) {
                var clip = clips[i];
                var e = clip.step(time);
                // Throw out the events need to be called after
                // stage.update, like destroy
                if (e) {
                    deferredEvents.push(e);
                    deferredClips.push(clip);
                }
            }
            if (this.stage.update) {
                this.stage.update();
            }
            // Remove the finished clip
            for (var i = 0; i < len; ) {
                if (clips[i]._needsRemove) {
                    clips[i] = clips[len - 1];
                    clips.pop();
                    len--;
                } else {
                    i++;
                }
            }
            len = deferredEvents.length;
            for (var i = 0; i < len; i++) {
                deferredClips[i].fire(deferredEvents[i]);
            }
            this._time = time;
            this.onframe(delta);
            this.dispatch("frame", delta);
        },
        /**
             * 开始运行动画
             */
        start: function() {
            var self = this;
            this._running = true;
            function step() {
                if (self._running) {
                    self._update();
                    requestAnimationFrame(step);
                }
            }
            this._time = new Date().getTime();
            requestAnimationFrame(step);
        },
        /**
             * 停止运行动画
             */
        stop: function() {
            this._running = false;
        },
        /**
             * 清除所有动画片段
             */
        clear: function() {
            this._clips = [];
        },
        /**
             * 对一个目标创建一个animator对象，可以指定目标中的属性使用动画
             * @param  {Object} target
             * @param  {Object} options
             * @param  {boolean} [options.loop=false] 是否循环播放动画
             * @param  {Function} [options.getter=null]
             *         如果指定getter函数，会通过getter函数取属性值
             * @param  {Function} [options.setter=null]
             *         如果指定setter函数，会通过setter函数设置属性值
             * @return {module:zrender/animation/Animation~Animator}
             */
        animate: function(target, options) {
            options = options || {};
            var deferred = new Animator(target, options.loop, options.getter, options.setter);
            deferred.animation = this;
            return deferred;
        },
        constructor: Animation
    };
    util.merge(Animation.prototype, Dispatcher.prototype, true);
    function _defaultGetter(target, key) {
        return target[key];
    }
    function _defaultSetter(target, key, value) {
        target[key] = value;
    }
    function _interpolateNumber(p0, p1, percent) {
        return (p1 - p0) * percent + p0;
    }
    function _interpolateArray(p0, p1, percent, out, arrDim) {
        var len = p0.length;
        if (arrDim == 1) {
            for (var i = 0; i < len; i++) {
                out[i] = _interpolateNumber(p0[i], p1[i], percent);
            }
        } else {
            var len2 = p0[0].length;
            for (var i = 0; i < len; i++) {
                for (var j = 0; j < len2; j++) {
                    out[i][j] = _interpolateNumber(p0[i][j], p1[i][j], percent);
                }
            }
        }
    }
    function _isArrayLike(data) {
        switch (typeof data) {
          case "undefined":
          case "string":
            return false;
        }
        return typeof data.length !== "undefined";
    }
    function _catmullRomInterpolateArray(p0, p1, p2, p3, t, t2, t3, out, arrDim) {
        var len = p0.length;
        if (arrDim == 1) {
            for (var i = 0; i < len; i++) {
                out[i] = _catmullRomInterpolate(p0[i], p1[i], p2[i], p3[i], t, t2, t3);
            }
        } else {
            var len2 = p0[0].length;
            for (var i = 0; i < len; i++) {
                for (var j = 0; j < len2; j++) {
                    out[i][j] = _catmullRomInterpolate(p0[i][j], p1[i][j], p2[i][j], p3[i][j], t, t2, t3);
                }
            }
        }
    }
    function _catmullRomInterpolate(p0, p1, p2, p3, t, t2, t3) {
        var v0 = (p2 - p0) * .5;
        var v1 = (p3 - p1) * .5;
        return (2 * (p1 - p2) + v0 + v1) * t3 + (-3 * (p1 - p2) - 2 * v0 - v1) * t2 + v0 * t + p1;
    }
    function _cloneValue(value) {
        if (_isArrayLike(value)) {
            var len = value.length;
            if (_isArrayLike(value[0])) {
                var ret = [];
                for (var i = 0; i < len; i++) {
                    ret.push(arraySlice.call(value[i]));
                }
                return ret;
            } else {
                return arraySlice.call(value);
            }
        } else {
            return value;
        }
    }
    function rgba2String(rgba) {
        rgba[0] = Math.floor(rgba[0]);
        rgba[1] = Math.floor(rgba[1]);
        rgba[2] = Math.floor(rgba[2]);
        return "rgba(" + rgba.join(",") + ")";
    }
    /**
         * @alias module:zrender/animation/Animation~Animator
         * @constructor
         * @param {Object} target
         * @param {boolean} loop
         * @param {Function} getter
         * @param {Function} setter
         */
    var Animator = function(target, loop, getter, setter) {
        this._tracks = {};
        this._target = target;
        this._loop = loop || false;
        this._getter = getter || _defaultGetter;
        this._setter = setter || _defaultSetter;
        this._clipCount = 0;
        this._delay = 0;
        this._doneList = [];
        this._onframeList = [];
        this._clipList = [];
    };
    Animator.prototype = {
        /**
             * 设置动画关键帧
             * @param  {number} time 关键帧时间，单位是ms
             * @param  {Object} props 关键帧的属性值，key-value表示
             * @return {module:zrender/animation/Animation~Animator}
             */
        when: function(time, props) {
            for (var propName in props) {
                if (!this._tracks[propName]) {
                    this._tracks[propName] = [];
                    // If time is 0 
                    //  Then props is given initialize value
                    // Else
                    //  Initialize value from current prop value
                    if (time !== 0) {
                        this._tracks[propName].push({
                            time: 0,
                            value: _cloneValue(this._getter(this._target, propName))
                        });
                    }
                }
                this._tracks[propName].push({
                    time: parseInt(time, 10),
                    value: props[propName]
                });
            }
            return this;
        },
        /**
             * 添加动画每一帧的回调函数
             * @param  {Function} callback
             * @return {module:zrender/animation/Animation~Animator}
             */
        during: function(callback) {
            this._onframeList.push(callback);
            return this;
        },
        /**
             * 开始执行动画
             * @param  {string|Function} easing 
             *         动画缓动函数，详见{@link module:zrender/animation/easing}
             * @return {module:zrender/animation/Animation~Animator}
             */
        start: function(easing) {
            var self = this;
            var setter = this._setter;
            var getter = this._getter;
            var useSpline = easing === "spline";
            var ondestroy = function() {
                self._clipCount--;
                if (self._clipCount === 0) {
                    // Clear all tracks
                    self._tracks = {};
                    var len = self._doneList.length;
                    for (var i = 0; i < len; i++) {
                        self._doneList[i].call(self);
                    }
                }
            };
            var createTrackClip = function(keyframes, propName) {
                var trackLen = keyframes.length;
                if (!trackLen) {
                    return;
                }
                // Guess data type
                var firstVal = keyframes[0].value;
                var isValueArray = _isArrayLike(firstVal);
                var isValueColor = false;
                // For vertices morphing
                var arrDim = isValueArray && _isArrayLike(firstVal[0]) ? 2 : 1;
                // Sort keyframe as ascending
                keyframes.sort(function(a, b) {
                    return a.time - b.time;
                });
                var trackMaxTime;
                if (trackLen) {
                    trackMaxTime = keyframes[trackLen - 1].time;
                } else {
                    return;
                }
                // Percents of each keyframe
                var kfPercents = [];
                // Value of each keyframe
                var kfValues = [];
                for (var i = 0; i < trackLen; i++) {
                    kfPercents.push(keyframes[i].time / trackMaxTime);
                    // Assume value is a color when it is a string
                    var value = keyframes[i].value;
                    if (typeof value == "string") {
                        value = color.toArray(value);
                        if (value.length === 0) {
                            // Invalid color
                            value[0] = value[1] = value[2] = 0;
                            value[3] = 1;
                        }
                        isValueColor = true;
                    }
                    kfValues.push(value);
                }
                // Cache the key of last frame to speed up when 
                // animation playback is sequency
                var cacheKey = 0;
                var cachePercent = 0;
                var start;
                var i;
                var w;
                var p0;
                var p1;
                var p2;
                var p3;
                if (isValueColor) {
                    var rgba = [ 0, 0, 0, 0 ];
                }
                var onframe = function(target, percent) {
                    // Find the range keyframes
                    // kf1-----kf2---------current--------kf3
                    // find kf2 and kf3 and do interpolation
                    if (percent < cachePercent) {
                        // Start from next key
                        start = Math.min(cacheKey + 1, trackLen - 1);
                        for (i = start; i >= 0; i--) {
                            if (kfPercents[i] <= percent) {
                                break;
                            }
                        }
                        i = Math.min(i, trackLen - 2);
                    } else {
                        for (i = cacheKey; i < trackLen; i++) {
                            if (kfPercents[i] > percent) {
                                break;
                            }
                        }
                        i = Math.min(i - 1, trackLen - 2);
                    }
                    cacheKey = i;
                    cachePercent = percent;
                    var range = kfPercents[i + 1] - kfPercents[i];
                    if (range === 0) {
                        return;
                    } else {
                        w = (percent - kfPercents[i]) / range;
                    }
                    if (useSpline) {
                        p1 = kfValues[i];
                        p0 = kfValues[i === 0 ? i : i - 1];
                        p2 = kfValues[i > trackLen - 2 ? trackLen - 1 : i + 1];
                        p3 = kfValues[i > trackLen - 3 ? trackLen - 1 : i + 2];
                        if (isValueArray) {
                            _catmullRomInterpolateArray(p0, p1, p2, p3, w, w * w, w * w * w, getter(target, propName), arrDim);
                        } else {
                            var value;
                            if (isValueColor) {
                                value = _catmullRomInterpolateArray(p0, p1, p2, p3, w, w * w, w * w * w, rgba, 1);
                                value = rgba2String(rgba);
                            } else {
                                value = _catmullRomInterpolate(p0, p1, p2, p3, w, w * w, w * w * w);
                            }
                            setter(target, propName, value);
                        }
                    } else {
                        if (isValueArray) {
                            _interpolateArray(kfValues[i], kfValues[i + 1], w, getter(target, propName), arrDim);
                        } else {
                            var value;
                            if (isValueColor) {
                                _interpolateArray(kfValues[i], kfValues[i + 1], w, rgba, 1);
                                value = rgba2String(rgba);
                            } else {
                                value = _interpolateNumber(kfValues[i], kfValues[i + 1], w);
                            }
                            setter(target, propName, value);
                        }
                    }
                    for (i = 0; i < self._onframeList.length; i++) {
                        self._onframeList[i](target, percent);
                    }
                };
                var clip = new Clip({
                    target: self._target,
                    life: trackMaxTime,
                    loop: self._loop,
                    delay: self._delay,
                    onframe: onframe,
                    ondestroy: ondestroy
                });
                if (easing && easing !== "spline") {
                    clip.easing = easing;
                }
                self._clipList.push(clip);
                self._clipCount++;
                self.animation.add(clip);
            };
            for (var propName in this._tracks) {
                createTrackClip(this._tracks[propName], propName);
            }
            return this;
        },
        /**
             * 停止动画
             */
        stop: function() {
            for (var i = 0; i < this._clipList.length; i++) {
                var clip = this._clipList[i];
                this.animation.remove(clip);
            }
            this._clipList = [];
        },
        /**
             * 设置动画延迟开始的时间
             * @param  {number} time 单位ms
             * @return {module:zrender/animation/Animation~Animator}
             */
        delay: function(time) {
            this._delay = time;
            return this;
        },
        /**
             * 添加动画结束的回调
             * @param  {Function} cb
             * @return {module:zrender/animation/Animation~Animator}
             */
        done: function(cb) {
            if (cb) {
                this._doneList.push(cb);
            }
            return this;
        }
    };
    module.exports = Animation;
});

define("app/pc/canvaslib/animation/Clip", [ "app/pc/canvaslib/animation/easing" ], function(require, exports, module) {
    /**
 * 动画主控制器
 * @config target 动画对象，可以是数组，如果是数组的话会批量分发onframe等事件
 * @config life(1000) 动画时长
 * @config delay(0) 动画延迟时间
 * @config loop(true)
 * @config gap(0) 循环的间隔时间
 * @config onframe
 * @config easing(optional)
 * @config ondestroy(optional)
 * @config onrestart(optional)
 */
    var Easing = require("app/pc/canvaslib/animation/easing");
    function Clip(options) {
        this._targetPool = options.target || {};
        if (!(this._targetPool instanceof Array)) {
            this._targetPool = [ this._targetPool ];
        }
        // 生命周期
        this._life = options.life || 1e3;
        // 延时
        this._delay = options.delay || 0;
        // 开始时间
        this._startTime = new Date().getTime() + this._delay;
        // 单位毫秒
        // 结束时间
        this._endTime = this._startTime + this._life * 1e3;
        // 是否循环
        this.loop = typeof options.loop == "undefined" ? false : options.loop;
        this.gap = options.gap || 0;
        this.easing = options.easing || "Linear";
        this.onframe = options.onframe;
        this.ondestroy = options.ondestroy;
        this.onrestart = options.onrestart;
    }
    Clip.prototype = {
        step: function(time) {
            var percent = (time - this._startTime) / this._life;
            // 还没开始
            if (percent < 0) {
                return;
            }
            percent = Math.min(percent, 1);
            var easingFunc = typeof this.easing == "string" ? Easing[this.easing] : this.easing;
            var schedule = typeof easingFunc === "function" ? easingFunc(percent) : percent;
            this.fire("frame", schedule);
            // 结束
            if (percent == 1) {
                if (this.loop) {
                    this.restart();
                    // 重新开始周期
                    // 抛出而不是直接调用事件直到 stage.update 后再统一调用这些事件
                    return "restart";
                }
                // 动画完成将这个控制器标识为待删除
                // 在Animation.update中进行批量删除
                this._needsRemove = true;
                return "destroy";
            }
            return null;
        },
        restart: function() {
            var time = new Date().getTime();
            var remainder = (time - this._startTime) % this._life;
            this._startTime = new Date().getTime() - remainder + this.gap;
            this._needsRemove = false;
        },
        fire: function(eventType, arg) {
            for (var i = 0, len = this._targetPool.length; i < len; i++) {
                if (this["on" + eventType]) {
                    this["on" + eventType](this._targetPool[i], arg);
                }
            }
        },
        constructor: Clip
    };
    module.exports = Clip;
});

define("app/pc/canvaslib/animation/easing", [], function(require, exports, module) {
    /**
         * 缓动代码来自 https://github.com/sole/tween.js/blob/master/src/Tween.js
         * @see http://sole.github.io/tween.js/examples/03_graphs.html
         * @exports zrender/animation/easing
         */
    var easing = {
        // 线性
        /**
             * @param {number} k
             * @return {number}
             */
        Linear: function(k) {
            return k;
        },
        // 二次方的缓动（t^2）
        /**
             * @param {number} k
             * @return {number}
             */
        QuadraticIn: function(k) {
            return k * k;
        },
        /**
             * @param {number} k
             * @return {number}
             */
        QuadraticOut: function(k) {
            return k * (2 - k);
        },
        /**
             * @param {number} k
             * @return {number}
             */
        QuadraticInOut: function(k) {
            if ((k *= 2) < 1) {
                return .5 * k * k;
            }
            return -.5 * (--k * (k - 2) - 1);
        },
        // 三次方的缓动（t^3）
        /**
             * @param {number} k
             * @return {number}
             */
        CubicIn: function(k) {
            return k * k * k;
        },
        /**
             * @param {number} k
             * @return {number}
             */
        CubicOut: function(k) {
            return --k * k * k + 1;
        },
        /**
             * @param {number} k
             * @return {number}
             */
        CubicInOut: function(k) {
            if ((k *= 2) < 1) {
                return .5 * k * k * k;
            }
            return .5 * ((k -= 2) * k * k + 2);
        },
        // 四次方的缓动（t^4）
        /**
             * @param {number} k
             * @return {number}
             */
        QuarticIn: function(k) {
            return k * k * k * k;
        },
        /**
             * @param {number} k
             * @return {number}
             */
        QuarticOut: function(k) {
            return 1 - --k * k * k * k;
        },
        /**
             * @param {number} k
             * @return {number}
             */
        QuarticInOut: function(k) {
            if ((k *= 2) < 1) {
                return .5 * k * k * k * k;
            }
            return -.5 * ((k -= 2) * k * k * k - 2);
        },
        // 五次方的缓动（t^5）
        /**
             * @param {number} k
             * @return {number}
             */
        QuinticIn: function(k) {
            return k * k * k * k * k;
        },
        /**
             * @param {number} k
             * @return {number}
             */
        QuinticOut: function(k) {
            return --k * k * k * k * k + 1;
        },
        /**
             * @param {number} k
             * @return {number}
             */
        QuinticInOut: function(k) {
            if ((k *= 2) < 1) {
                return .5 * k * k * k * k * k;
            }
            return .5 * ((k -= 2) * k * k * k * k + 2);
        },
        // 正弦曲线的缓动（sin(t)）
        /**
             * @param {number} k
             * @return {number}
             */
        SinusoidalIn: function(k) {
            return 1 - Math.cos(k * Math.PI / 2);
        },
        /**
             * @param {number} k
             * @return {number}
             */
        SinusoidalOut: function(k) {
            return Math.sin(k * Math.PI / 2);
        },
        /**
             * @param {number} k
             * @return {number}
             */
        SinusoidalInOut: function(k) {
            return .5 * (1 - Math.cos(Math.PI * k));
        },
        // 指数曲线的缓动（2^t）
        /**
             * @param {number} k
             * @return {number}
             */
        ExponentialIn: function(k) {
            return k === 0 ? 0 : Math.pow(1024, k - 1);
        },
        /**
             * @param {number} k
             * @return {number}
             */
        ExponentialOut: function(k) {
            return k === 1 ? 1 : 1 - Math.pow(2, -10 * k);
        },
        /**
             * @param {number} k
             * @return {number}
             */
        ExponentialInOut: function(k) {
            if (k === 0) {
                return 0;
            }
            if (k === 1) {
                return 1;
            }
            if ((k *= 2) < 1) {
                return .5 * Math.pow(1024, k - 1);
            }
            return .5 * (-Math.pow(2, -10 * (k - 1)) + 2);
        },
        // 圆形曲线的缓动（sqrt(1-t^2)）
        /**
             * @param {number} k
             * @return {number}
             */
        CircularIn: function(k) {
            return 1 - Math.sqrt(1 - k * k);
        },
        /**
             * @param {number} k
             * @return {number}
             */
        CircularOut: function(k) {
            return Math.sqrt(1 - --k * k);
        },
        /**
             * @param {number} k
             * @return {number}
             */
        CircularInOut: function(k) {
            if ((k *= 2) < 1) {
                return -.5 * (Math.sqrt(1 - k * k) - 1);
            }
            return .5 * (Math.sqrt(1 - (k -= 2) * k) + 1);
        },
        // 创建类似于弹簧在停止前来回振荡的动画
        /**
             * @param {number} k
             * @return {number}
             */
        ElasticIn: function(k) {
            var s;
            var a = .1;
            var p = .4;
            if (k === 0) {
                return 0;
            }
            if (k === 1) {
                return 1;
            }
            if (!a || a < 1) {
                a = 1;
                s = p / 4;
            } else {
                s = p * Math.asin(1 / a) / (2 * Math.PI);
            }
            return -(a * Math.pow(2, 10 * (k -= 1)) * Math.sin((k - s) * 2 * Math.PI / p));
        },
        /**
             * @param {number} k
             * @return {number}
             */
        ElasticOut: function(k) {
            var s;
            var a = .1;
            var p = .4;
            if (k === 0) {
                return 0;
            }
            if (k === 1) {
                return 1;
            }
            if (!a || a < 1) {
                a = 1;
                s = p / 4;
            } else {
                s = p * Math.asin(1 / a) / (2 * Math.PI);
            }
            return a * Math.pow(2, -10 * k) * Math.sin((k - s) * 2 * Math.PI / p) + 1;
        },
        /**
             * @param {number} k
             * @return {number}
             */
        ElasticInOut: function(k) {
            var s;
            var a = .1;
            var p = .4;
            if (k === 0) {
                return 0;
            }
            if (k === 1) {
                return 1;
            }
            if (!a || a < 1) {
                a = 1;
                s = p / 4;
            } else {
                s = p * Math.asin(1 / a) / (2 * Math.PI);
            }
            if ((k *= 2) < 1) {
                return -.5 * a * Math.pow(2, 10 * (k -= 1)) * Math.sin((k - s) * 2 * Math.PI / p);
            }
            return a * Math.pow(2, -10 * (k -= 1)) * Math.sin((k - s) * 2 * Math.PI / p) * .5 + 1;
        },
        // 在某一动画开始沿指示的路径进行动画处理前稍稍收回该动画的移动
        /**
             * @param {number} k
             * @return {number}
             */
        BackIn: function(k) {
            var s = 1.70158;
            return k * k * ((s + 1) * k - s);
        },
        /**
             * @param {number} k
             * @return {number}
             */
        BackOut: function(k) {
            var s = 1.70158;
            return --k * k * ((s + 1) * k + s) + 1;
        },
        /**
             * @param {number} k
             * @return {number}
             */
        BackInOut: function(k) {
            var s = 1.70158 * 1.525;
            if ((k *= 2) < 1) {
                return .5 * k * k * ((s + 1) * k - s);
            }
            return .5 * ((k -= 2) * k * ((s + 1) * k + s) + 2);
        },
        // 创建弹跳效果
        /**
             * @param {number} k
             * @return {number}
             */
        BounceIn: function(k) {
            return 1 - easing.BounceOut(1 - k);
        },
        /**
             * @param {number} k
             * @return {number}
             */
        BounceOut: function(k) {
            if (k < 1 / 2.75) {
                return 7.5625 * k * k;
            } else if (k < 2 / 2.75) {
                return 7.5625 * (k -= 1.5 / 2.75) * k + .75;
            } else if (k < 2.5 / 2.75) {
                return 7.5625 * (k -= 2.25 / 2.75) * k + .9375;
            } else {
                return 7.5625 * (k -= 2.625 / 2.75) * k + .984375;
            }
        },
        /**
             * @param {number} k
             * @return {number}
             */
        BounceInOut: function(k) {
            if (k < .5) {
                return easing.BounceIn(k * 2) * .5;
            }
            return easing.BounceOut(k * 2 - 1) * .5 + .5;
        }
    };
    module.exports = easing;
});

define("app/pc/canvaslib/shape/Line", [ "app/pc/canvaslib/shape/Base", "app/pc/canvaslib/tool/matrix", "app/pc/canvaslib/tool/guid", "app/pc/canvaslib/tool/util", "app/pc/canvaslib/dep/excanvas", "app/pc/canvaslib/tool/log", "app/pc/canvaslib/config", "app/pc/canvaslib/mixin/Transformable", "app/pc/canvaslib/tool/vector", "app/pc/canvaslib/mixin/Eventful", "app/pc/canvaslib/tool/area", "app/pc/canvaslib/tool/curve", "app/pc/canvaslib/tool/color", "app/pc/canvaslib/shape/util/dashedLineTo" ], function(require, exports, module) {
    /**
 * 直线
 * @module zrender/shape/Line
 * @author Kener (@Kener-林峰, kener.linfeng@gmail.com)
 * @example
 *   var Line = require('zrender/shape/Line');
 *   var shape = new Line({
 *       style: {
 *           xStart: 0,
 *           yStart: 0,
 *           xEnd: 100,
 *           yEnd: 100,
 *           strokeColor: '#000',
 *           lineWidth: 10
 *       }
 *   });
 *   zr.addShape(line);
 */
    /**
 * @typedef {Object} ILineStyle
 * @property {number} xStart 起点x坐标
 * @property {number} yStart 起点y坐标
 * @property {number} xEnd 终止点x坐标
 * @property {number} yEnd 终止点y坐标
 * @property {string} [strokeColor='#000000'] 描边颜色
 * @property {string} [lineCape='butt'] 线帽样式，可以是 butt, round, square
 * @property {number} [lineWidth=1] 描边宽度
 * @property {number} [opacity=1] 绘制透明度
 * @property {number} [shadowBlur=0] 阴影模糊度，大于0有效
 * @property {string} [shadowColor='#000000'] 阴影颜色
 * @property {number} [shadowOffsetX=0] 阴影横向偏移
 * @property {number} [shadowOffsetY=0] 阴影纵向偏移
 * @property {string} [text] 图形中的附加文本
 * @property {string} [textColor='#000000'] 文本颜色
 * @property {string} [textFont] 附加文本样式，eg:'bold 18px verdana'
 * @property {string} [textPosition='end'] 附加文本位置, 可以是 inside, left, right, top, bottom
 * @property {string} [textAlign] 默认根据textPosition自动设置，附加文本水平对齐。
 *                                可以是start, end, left, right, center
 * @property {string} [textBaseline] 默认根据textPosition自动设置，附加文本垂直对齐。
 *                                可以是top, bottom, middle, alphabetic, hanging, ideographic
 */
    var Base = require("app/pc/canvaslib/shape/Base");
    var dashedLineTo = require("app/pc/canvaslib/shape/util/dashedLineTo");
    /**
         * @alias module:zrender/shape/Line
         * @param {Object} options
         * @constructor
         * @extends module:zrender/shape/Base
         */
    var Line = function(options) {
        this.brushTypeOnly = "stroke";
        // 线条只能描边，填充后果自负
        this.textPosition = "end";
        Base.call(this, options);
    };
    Line.prototype = {
        type: "line",
        /**
             * 创建线条路径
             * @param {CanvasRenderingContext2D} ctx
             * @param {module:zrender/shape/Line~ILineStyle} style
             */
        buildPath: function(ctx, style) {
            if (!style.lineType || style.lineType == "solid") {
                // 默认为实线
                ctx.moveTo(style.xStart, style.yStart);
                ctx.lineTo(style.xEnd, style.yEnd);
            } else if (style.lineType == "dashed" || style.lineType == "dotted") {
                var dashLength = (style.lineWidth || 1) * (style.lineType == "dashed" ? 5 : 1);
                dashedLineTo(ctx, style.xStart, style.yStart, style.xEnd, style.yEnd, dashLength);
            }
        },
        /**
             * 计算返回线条的包围盒矩形
             * @param {module:zrender/shape/Line~ILineStyle} style
             * @return {module:zrender/shape/Base~IBoundingRect}
             */
        getRect: function(style) {
            if (style.__rect) {
                return style.__rect;
            }
            var lineWidth = style.lineWidth || 1;
            style.__rect = {
                x: Math.min(style.xStart, style.xEnd) - lineWidth,
                y: Math.min(style.yStart, style.yEnd) - lineWidth,
                width: Math.abs(style.xStart - style.xEnd) + lineWidth,
                height: Math.abs(style.yStart - style.yEnd) + lineWidth
            };
            return style.__rect;
        }
    };
    require("app/pc/canvaslib/tool/util").inherits(Line, Base);
    module.exports = Line;
});

define("app/pc/canvaslib/shape/util/dashedLineTo", [], function(require, exports, module) {
    /**
 * 虚线lineTo 
 *
 * author:  Kener (@Kener-林峰, kener.linfeng@gmail.com)
 *          errorrik (errorrik@gmail.com)
 */
    var dashPattern = [ 5, 5 ];
    module.exports = function(ctx, x1, y1, x2, y2, dashLength) {
        // http://msdn.microsoft.com/en-us/library/ie/dn265063(v=vs.85).aspx
        if (ctx.setLineDash) {
            dashPattern[0] = dashPattern[1] = dashLength;
            ctx.setLineDash(dashPattern);
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            return;
        }
        dashLength = typeof dashLength != "number" ? 5 : dashLength;
        var dx = x2 - x1;
        var dy = y2 - y1;
        var numDashes = Math.floor(Math.sqrt(dx * dx + dy * dy) / dashLength);
        dx = dx / numDashes;
        dy = dy / numDashes;
        var flag = true;
        for (var i = 0; i < numDashes; ++i) {
            if (flag) {
                ctx.moveTo(x1, y1);
            } else {
                ctx.lineTo(x1, y1);
            }
            flag = !flag;
            x1 += dx;
            y1 += dy;
        }
        ctx.lineTo(x2, y2);
    };
});

define("app/pc/canvaslib/shape/Circle", [ "app/pc/canvaslib/shape/Base", "app/pc/canvaslib/tool/matrix", "app/pc/canvaslib/tool/guid", "app/pc/canvaslib/tool/util", "app/pc/canvaslib/dep/excanvas", "app/pc/canvaslib/tool/log", "app/pc/canvaslib/config", "app/pc/canvaslib/mixin/Transformable", "app/pc/canvaslib/tool/vector", "app/pc/canvaslib/mixin/Eventful", "app/pc/canvaslib/tool/area", "app/pc/canvaslib/tool/curve", "app/pc/canvaslib/tool/color" ], function(require, exports, module) {
    /**
 * 圆形
 * @module zrender/shape/Circle
 * @author Kener (@Kener-林峰, kener.linfeng@gmail.com)
 * @example
 *   var Circle = require('zrender/shape/Circle');
 *   var shape = new Circle({
 *       style: {
 *           x: 100,
 *           y: 100,
 *           r: 40,
 *           brushType: 'both',
 *           color: 'blue',
 *           strokeColor: 'red',
 *           lineWidth: 3,
 *           text: 'Circle'
 *       }    
 *   });
 *   zr.addShape(shape);
 */
    /**
 * @typedef {Object} ICircleStyle
 * @property {number} x 圆心x坐标
 * @property {number} y 圆心y坐标
 * @property {number} r 半径
 * @property {string} [brushType='fill']
 * @property {string} [color='#000000'] 填充颜色
 * @property {string} [strokeColor='#000000'] 描边颜色
 * @property {string} [lineCape='butt'] 线帽样式，可以是 butt, round, square
 * @property {number} [lineWidth=1] 描边宽度
 * @property {number} [opacity=1] 绘制透明度
 * @property {number} [shadowBlur=0] 阴影模糊度，大于0有效
 * @property {string} [shadowColor='#000000'] 阴影颜色
 * @property {number} [shadowOffsetX=0] 阴影横向偏移
 * @property {number} [shadowOffsetY=0] 阴影纵向偏移
 * @property {string} [text] 图形中的附加文本
 * @property {string} [textColor='#000000'] 文本颜色
 * @property {string} [textFont] 附加文本样式，eg:'bold 18px verdana'
 * @property {string} [textPosition='end'] 附加文本位置, 可以是 inside, left, right, top, bottom
 * @property {string} [textAlign] 默认根据textPosition自动设置，附加文本水平对齐。
 *                                可以是start, end, left, right, center
 * @property {string} [textBaseline] 默认根据textPosition自动设置，附加文本垂直对齐。
 *                                可以是top, bottom, middle, alphabetic, hanging, ideographic
 */
    "use strict";
    var Base = require("app/pc/canvaslib/shape/Base");
    /**
         * @alias module:zrender/shape/Circle
         * @constructor
         * @extends module:zrender/shape/Base
         * @param {Object} options
         */
    var Circle = function(options) {
        Base.call(this, options);
    };
    Circle.prototype = {
        type: "circle",
        /**
             * 创建圆形路径
             * @param {CanvasRenderingContext2D} ctx
             * @param {module:zrender/shape/Circle~ICircleStyle} style
             */
        buildPath: function(ctx, style) {
            ctx.arc(style.x, style.y, style.r, 0, Math.PI * 2, true);
            return;
        },
        /**
             * 计算返回圆形的包围盒矩形
             * @param {module:zrender/shape/Circle~ICircleStyle} style
             * @return {module:zrender/shape/Base~IBoundingRect}
             */
        getRect: function(style) {
            if (style.__rect) {
                return style.__rect;
            }
            var lineWidth;
            if (style.brushType == "stroke" || style.brushType == "fill") {
                lineWidth = style.lineWidth || 1;
            } else {
                lineWidth = 0;
            }
            style.__rect = {
                x: Math.round(style.x - style.r - lineWidth / 2),
                y: Math.round(style.y - style.r - lineWidth / 2),
                width: style.r * 2 + lineWidth,
                height: style.r * 2 + lineWidth
            };
            return style.__rect;
        }
    };
    require("app/pc/canvaslib/tool/util").inherits(Circle, Base);
    module.exports = Circle;
});

define("app/pc/canvaslib/shape/Ring", [ "app/pc/canvaslib/shape/Base", "app/pc/canvaslib/tool/matrix", "app/pc/canvaslib/tool/guid", "app/pc/canvaslib/tool/util", "app/pc/canvaslib/dep/excanvas", "app/pc/canvaslib/tool/log", "app/pc/canvaslib/config", "app/pc/canvaslib/mixin/Transformable", "app/pc/canvaslib/tool/vector", "app/pc/canvaslib/mixin/Eventful", "app/pc/canvaslib/tool/area", "app/pc/canvaslib/tool/curve", "app/pc/canvaslib/tool/color" ], function(require, exports, module) {
    /**
 * 圆环
 * @module zrender/shape/Ring
 * @author Kener (@Kener-林峰, kener.linfeng@gmail.com)
 *
 * @example
 *     var Ring = require('zrender/shape/Ring');
 *     var shape = new Ring({
 *         style: {
 *             x: 100,
 *             y: 100,
 *             r0: 30,
 *             r: 50
 *         }
 *     });
 *     zr.addShape(shape);
 */
    /**
 * @typedef {Object} IRingStyle
 * @property {number} x 圆心x坐标
 * @property {number} y 圆心y坐标
 * @property {number} r0 内圆半径
 * @property {number} r 外圆半径
 * @property {string} [color='#000000'] 填充颜色
 * @property {string} [strokeColor='#000000'] 描边颜色
 * @property {string} [lineCape='butt'] 线帽样式，可以是 butt, round, square
 * @property {number} [lineWidth=1] 描边宽度
 * @property {number} [opacity=1] 绘制透明度
 * @property {number} [shadowBlur=0] 阴影模糊度，大于0有效
 * @property {string} [shadowColor='#000000'] 阴影颜色
 * @property {number} [shadowOffsetX=0] 阴影横向偏移
 * @property {number} [shadowOffsetY=0] 阴影纵向偏移
 * @property {string} [text] 图形中的附加文本
 * @property {string} [textColor='#000000'] 文本颜色
 * @property {string} [textFont] 附加文本样式，eg:'bold 18px verdana'
 * @property {string} [textPosition='end'] 附加文本位置, 可以是 inside, left, right, top, bottom
 * @property {string} [textAlign] 默认根据textPosition自动设置，附加文本水平对齐。
 *                                可以是start, end, left, right, center
 * @property {string} [textBaseline] 默认根据textPosition自动设置，附加文本垂直对齐。
 *                                可以是top, bottom, middle, alphabetic, hanging, ideographic
 */
    var Base = require("app/pc/canvaslib/shape/Base");
    /**
         * @alias module:zrender/shape/Ring
         * @constructor
         * @extends module:zrender/shape/Base
         * @param {Object} options
         */
    var Ring = function(options) {
        Base.call(this, options);
    };
    Ring.prototype = {
        type: "ring",
        /**
             * 创建圆环路径
             * @param {CanvasRenderingContext2D} ctx
             * @param {module:zrender/shape/Ring~IRingStyle} style
             */
        buildPath: function(ctx, style) {
            // 非零环绕填充优化
            ctx.arc(style.x, style.y, style.r, 0, Math.PI * 2, false);
            ctx.moveTo(style.x + style.r0, style.y);
            ctx.arc(style.x, style.y, style.r0, 0, Math.PI * 2, true);
            return;
        },
        /**
             * 计算返回圆环包围盒矩阵
             * @param {module:zrender/shape/Ring~IRingStyle} style
             * @return {module:zrender/shape/Base~IBoundingRect}
             */
        getRect: function(style) {
            if (style.__rect) {
                return style.__rect;
            }
            var lineWidth;
            if (style.brushType == "stroke" || style.brushType == "fill") {
                lineWidth = style.lineWidth || 1;
            } else {
                lineWidth = 0;
            }
            style.__rect = {
                x: Math.round(style.x - style.r - lineWidth / 2),
                y: Math.round(style.y - style.r - lineWidth / 2),
                width: style.r * 2 + lineWidth,
                height: style.r * 2 + lineWidth
            };
            return style.__rect;
        }
    };
    require("app/pc/canvaslib/tool/util").inherits(Ring, Base);
    module.exports = Ring;
});
