/*! 一唱成名 create by ErickSong */
define("app/phone/biaoqian/pklist", [ "core/jquery/1.8.3/jquery", "../../../util/others/getquery", "../../../util/loader/loader", "../../../util/log/log", "../../../util/platform/plt", "../../../util/browser/browser", "../../../util/net/urlquery", "../../../util/Timer/timer", "../../../util/vote/uniformDate", "../../../util/ppsdk/sdk", "../../../util/vote/vote", "../../../util/cookie/cookie", "../../../util/user/user", "client", "../../../util/vote/voteupdate" ], function(require, exports, module) {
    //获取服务器时间,需求改变，目前需要投票逻辑
    var $ = require("core/jquery/1.8.3/jquery");
    var getQuery = require("../../../util/others/getquery");
    var queryObj = getQuery();
    var areaid = parseInt(queryObj["scope_id"]);
    var ajaxLoad = require("../../../util/loader/loader");
    var timer = require("../../../util/Timer/timer");
    var serverOffsetTime = 0;
    var getServerSuccess = false;
    $.ajax({
        url: "http://time.pptv.com?time=" + new Date().getTime(),
        type: "GET",
        dataType: "jsonp",
        cache: true,
        jsonp: "cb",
        success: function(data) {
            getServerSuccess = true;
            serverOffsetTime = data * 1e3 - new Date().getTime();
            updatePkList();
        },
        timeout: 1e3,
        error: function() {
            updatePkList();
        }
    });
    function uuid(prefix) {
        var count = 0;
        return function() {
            return prefix + "_" + count++;
        };
    }
    var timerBefore = uuid("before");
    var timerLive = uuid("live");
    var timerVote = uuid("vote");
    var timerUID = uuid("timer");
    var beforeArr = [];
    var liveArr = [];
    var voteArr = [];
    var pageStartTime = new Date().getTime();
    var phpNowDate = $("#pk_list").attr("data-date");
    if (!!phpNowDate) {
        var tempCdnDate = uniformDate(phpNowDate);
    } else {
        var tempCdnDate = null;
    }
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
        $(".module-livepk .vs-item .avartar").each(function() {
            var obj = $(this);
            var tempHref = obj.attr("href");
            tempHref = tempHref.replace(/\&?type=app/, "");
            obj.attr("href", tempHref);
        });
        $(".module-livepk .role a").each(function() {
            var obj = $(this);
            var tempHref = obj.attr("href");
            tempHref = tempHref.replace(/\&?type=app/, "");
            obj.attr("href", tempHref);
        });
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
    var sdk = require("../../../util/ppsdk/sdk");
    var browser = require("../../../util/browser/browser");
    function redirectBiaoqian(tempHref) {
        if (sdk.isReady()) {
            sdk.openNativePage({
                pageUrl: "app://iph.pptv.com/v4/activity/web?activity=singtofame&url=" + encodeURIComponent(tempHref),
                success: function() {},
                error: function(code, msg) {
                    if (code == 1 && msg == "方法不存在") {
                        window.location.href = tempHref;
                    }
                }
            });
        } else {
            setTimeout(function() {
                redirectBiaoqian(tempHref);
            }, 300);
        }
    }
    if (browser.IPAD == true) {
        $(".module-pk-notice").on("click", ".avartar", function(e) {
            var tempHref = this.getAttribute("href");
            if (tempHref.indexOf("username") != -1) {
                e.preventDefault();
                redirectBiaoqian(tempHref);
            }
        });
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
    var finalHtml = "";
    var isIpad = function() {
        var ua = navigator.userAgent.toLowerCase();
        return /\(ipad/i.test(ua);
    }();
    var vote = require("../../../util/vote/vote");
    var voteMap = require("../../../util/vote/voteupdate");
    function exceptionCounter(counter) {
        if (typeof counter == "undefined" || counter == null) {
            return 0;
        } else {
            return counter;
        }
    }
    // 绑定投票事件
    function bindVote() {
        new vote({
            dom: ".js-vote",
            voteAttr: "data-id",
            container: "#pk_list",
            beforeVote: function(data, dom) {
                if (dom.find("span").text() != "投票") {
                    return false;
                }
            },
            afterVote: function(data, dom) {
                if (typeof data.counter != "undefined") {
                    var idx = dom.index();
                    var targetParentDom = dom.parent().siblings(".tr3");
                    if (idx == 0) {
                        targetParentDom.find(".count").eq(0).text(exceptionCounter(data.counter));
                    } else {
                        targetParentDom.find(".count").eq(1).text(exceptionCounter(data.counter));
                    }
                    voteAnimate(dom);
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
    }
    bindVote();
    function voteAnimate(dom) {
        counter(dom.find("span"), 10, true);
    }
    //常规倒计时
    function counter(dom, count, first) {
        if (first == true) {
            dom.text(count);
        }
        setTimeout(function() {
            dom.text(--count);
            if (count != 0) {
                counter(dom, count);
            } else {
                dom.text("投票");
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
                var idx = doms[j].index();
                var targetParentDom = doms[j].parent().siblings(".tr3");
                if (idx == 0) {
                    targetParentDom.find(".count").eq(0).text(exceptionCounter(tempObj.data.counter));
                } else {
                    targetParentDom.find(".count").eq(1).text(exceptionCounter(tempObj.data.counter));
                }
            }
        }
    }
    function resetData() {
        if (timerInterval != null) {
            clearInterval(timerInterval);
            timerInterval = null;
        }
        finalHtml = "";
        liveArr = [];
        voteArr = [];
        beforeArr = [];
    }
    function insertVoteEndItem(obj) {
        var tempHtml = "";
        var player1 = obj.player_1;
        var player2 = obj.player_2;
        if (player1.is_group == "1") {
            player1.showname = player1.group_name;
        } else {
            player1.showname = player1.real_name;
        }
        if (player2.is_group == "1") {
            player2.showname = player2.group_name;
        } else {
            player2.showname = player2.real_name;
        }
        if (!!isIpad) {
            player1.playerurl = "http://chang.pptv.com/ipad/player?username=" + player1.username;
            player2.playerurl = "http://chang.pptv.com/ipad/player?username=" + player2.username;
        } else {
            player1.playerurl = "http://chang.pptv.com/app/player?username=" + player1.username;
            player2.playerurl = "http://chang.pptv.com/app/player?username=" + player2.username;
        }
        if (!!isApp) {
            player1.playerurl = player1.playerurl + "&type=app";
            player2.playerurl = player2.playerurl + "&type=app";
        }
        if (Number(player1.counter) > Number(player2.counter)) {
            tempHtml += '<div class="swiper-slide vs-block"><table width="100%" cellpadding="0" cellspacing="0"><tbody><tr><td width="50%"><a class="avartar" href="' + player1.playerurl + '"><img src="' + player1.avatar + '">';
            tempHtml += '</a><div class="js-win index win">win</div></td>';
            tempHtml += '<td class="vs_txt">VS</td><td width="50%"><a class="avartar" href="' + player2.playerurl + '"><img src="' + player2.avatar + '"></a><div class="js-win"></div></td></tr><tr><td class="name">' + player1.showname + '</td><td></td><td class="name">' + player2.showname + "</td></tr>";
            tempHtml += '<tr class="tr3 c"><td><div class="count">' + exceptionCounter(player1.counter) + '</div></td><td></td><td><div class="count">' + exceptionCounter(player2.counter) + "</div></td></tr>";
            tempHtml += "</tbody></table></div>";
        } else {
            tempHtml += '<div class="swiper-slide vs-block"><table width="100%" cellpadding="0" cellspacing="0"><tbody><tr><td width="50%"><a class="avartar" href="' + player1.playerurl + '"><img src="' + player1.avatar + '">';
            tempHtml += '</a><div class="js-win"></div></td>';
            tempHtml += '<td class="vs_txt">VS</td><td width="50%"><a class="avartar" href="' + player2.playerurl + '"><img src="' + player2.avatar + '"></a><div class="js-win index win">win</div></td></tr><tr><td class="name">' + player1.showname + '</td><td></td><td class="name">' + player2.showname + "</td></tr>";
            tempHtml += '<tr class="tr3 c"><td><div class="count">' + exceptionCounter(player1.counter) + '</div></td><td></td><td><div class="count">' + exceptionCounter(player2.counter) + "</div></td></tr>";
            tempHtml += "</tbody></table></div>";
        }
        finalHtml += tempHtml;
    }
    function insertLiveItem(obj) {
        var tempHtml = "";
        var player1 = obj.player_1;
        var player2 = obj.player_2;
        if (player1.is_group == "1") {
            player1.showname = player1.group_name;
        } else {
            player1.showname = player1.real_name;
        }
        if (player2.is_group == "1") {
            player2.showname = player2.group_name;
        } else {
            player2.showname = player2.real_name;
        }
        if (!!isIpad) {
            player1.playerurl = "http://chang.pptv.com/ipad/player?username=" + player1.username;
            player2.playerurl = "http://chang.pptv.com/ipad/player?username=" + player2.username;
        } else {
            player1.playerurl = "http://chang.pptv.com/app/player?username=" + player1.username;
            player2.playerurl = "http://chang.pptv.com/app/player?username=" + player2.username;
        }
        if (!!isApp) {
            player1.playerurl = player1.playerurl + "&type=app";
            player2.playerurl = player2.playerurl + "&type=app";
        }
        var tempLiveId = timerLive();
        obj.domId = tempLiveId;
        liveArr.push(obj);
        if (!!isApp) {
            var url = obj.link;
            url = url.replace(/\&amp\;/g, "&");
        } else {
            var url = obj.app_link;
        }
        tempHtml += '<div class="swiper-slide vs-block" id="' + tempLiveId + '"><table width="100%" cellpadding="0" cellspacing="0"><tbody><tr><td width="50%"><a class="avartar" href="' + url + '" spaceurl="' + player1.playerurl + '"><img src="' + player1.avatar + '"></a><div class="js-win index">' + player1.rank + "</div></td>";
        tempHtml += '<td class="vs_txt">VS</td><td width="50%"><a class="avartar" href="' + url + '" spaceurl="' + player2.playerurl + '"><img src="' + player2.avatar + '"></a><div class="js-win index">' + player2.rank + '</div></td></tr><tr><td class="name">' + player1.showname + '</td><td></td><td class="name">' + player2.showname + '</td></tr><tr class="tr3 b"><td colspan="3"><a href="' + url + '"><div class="container"><div class="left">LIVE</div><div class="right">火热直播中</div></div></a></td></tr></tbody></table></div>';
        finalHtml += tempHtml;
    }
    var hasVote = false;
    var timerInterval = null;
    function insertVoteItem(obj) {
        var tempHtml = "";
        var player1 = obj.player_1;
        var player2 = obj.player_2;
        if (player1.is_group == "1") {
            player1.showname = player1.group_name;
        } else {
            player1.showname = player1.real_name;
        }
        if (player2.is_group == "1") {
            player2.showname = player2.group_name;
        } else {
            player2.showname = player2.real_name;
        }
        if (!!isIpad) {
            player1.playerurl = "http://chang.pptv.com/ipad/player?username=" + player1.username;
            player2.playerurl = "http://chang.pptv.com/ipad/player?username=" + player2.username;
        } else {
            player1.playerurl = "http://chang.pptv.com/app/player?username=" + player1.username;
            player2.playerurl = "http://chang.pptv.com/app/player?username=" + player2.username;
        }
        if (!!isApp) {
            player1.playerurl = player1.playerurl + "&type=app";
            player2.playerurl = player2.playerurl + "&type=app";
        }
        var tempvoteid = timerVote();
        obj.domId = tempvoteid;
        voteArr.push(obj);
        tempHtml += '<div class="swiper-slide vs-block fourLineItem" id="' + tempvoteid + '"><table width="100%" cellpadding="0" cellspacing="0"><tbody><tr><td width="50%"><a class="avartar" href="' + player1.playerurl + '"><img src="' + player1.avatar + '"></a><div class="js-win index">' + player1.rank + "</div></td>";
        tempHtml += '<td class="vs_txt">VS</td><td width="50%"><a class="avartar" href="' + player2.playerurl + '"><img src="' + player2.avatar + '"></a><div class="js-win index">' + player2.rank + '</div></td></tr><tr><td class="name">' + player1.showname + '</td><td></td><td class="name">' + player2.showname + "</td></tr>";
        tempHtml += '<tr><td class="vote js-vote" data-id="' + player1.vote_id + '"><span>投票</span></td><td></td><td class="vote js-vote" data-id="' + player2.vote_id + '"><span>投票</span></td></tr>';
        tempHtml += '<tr class="tr3 c"><td><div class="count">' + exceptionCounter(player1.counter) + '</div></td><td></td><td><div class="count">' + exceptionCounter(player2.counter) + "</div></td></tr>";
        tempHtml += "</tbody></table></div>";
        finalHtml += tempHtml;
        hasVote = true;
    }
    function insertBeforeItem(obj) {
        var tempHtml = "";
        var player1 = obj.player_1;
        var player2 = obj.player_2;
        if (player1.is_group == "1") {
            player1.showname = player1.group_name;
        } else {
            player1.showname = player1.real_name;
        }
        if (player2.is_group == "1") {
            player2.showname = player2.group_name;
        } else {
            player2.showname = player2.real_name;
        }
        if (!!isIpad) {
            player1.playerurl = "http://chang.pptv.com/ipad/player?username=" + player1.username;
            player2.playerurl = "http://chang.pptv.com/ipad/player?username=" + player2.username;
        } else {
            player1.playerurl = "http://chang.pptv.com/app/player?username=" + player1.username;
            player2.playerurl = "http://chang.pptv.com/app/player?username=" + player2.username;
        }
        if (!!isApp) {
            player1.playerurl = player1.playerurl + "&type=app";
            player2.playerurl = player2.playerurl + "&type=app";
        }
        var tempBeforeId = timerBefore();
        obj.domId = tempBeforeId;
        beforeArr.push(obj);
        var tempStartTime = obj["start"].match(/\d{2}:\d{2}/);
        if (tempStartTime == null) {
            tempStartTime = "";
        } else {
            tempStartTime = tempStartTime[0];
        }
        tempHtml += '<div class="swiper-slide vs-block" id="' + tempBeforeId + '"><table width="100%" cellpadding="0" cellspacing="0"><tbody><tr><td width="50%"><a class="avartar" href="' + player1.playerurl + '"><img src="' + player1.avatar + '"></a><div class="js-win index">' + player1.rank + "</div></td>";
        tempHtml += '<td class="vs_txt">VS</td><td width="50%"><a class="avartar" href="' + player2.playerurl + '"><img src="' + player2.avatar + '"></a><div class="js-win index">' + player2.rank + '</div></td></tr><tr><td class="name">' + player1.showname + '</td><td></td><td class="name">' + player2.showname + "</td></tr>";
        tempHtml += '<tr class="tr3 c"><td colspan="3"><div class="t1 c">' + tempStartTime + "登场</div></td></tr>";
        tempHtml += "</tbody></table></div>";
        finalHtml += tempHtml;
    }
    var $pkList = $("#pk_list");
    var liveSwiper = null;
    function dispatchFinish() {
        var prefix = '<div class="vs-item active"><div class="swiper-wrapper">';
        var suffix = "</div></div>";
        $pkList.html(prefix + finalHtml + suffix);
        var parentWrap = $pkList.parents(".module-livepk");
        if (parentWrap.length != 0) {
            parentWrap.removeClass("module-livepk").addClass("pk-biaoqian module-pk-notice");
        }
        var $vsItem = $pkList.find(".vs-item");
        if (!!hasVote) {
            $vsItem.addClass("fourline");
        }
        liveSwiper = new Swiper($vsItem, {
            slidesPerView: "auto"
        });
        voteMap.init({
            selector: ".js-vote",
            voteAttr: "data-id"
        });
        timerInterval = setInterval(function() {
            voteMap.getVotes({
                callback: updateUI
            });
        }, 45 * 1e3);
        dispatchLive();
        dispatchBefore();
    }
    function dispatchLive() {
        //live 默认全部更新
        if (liveArr.length == 0) {
            return false;
        } else {
            for (var i = 0; i < liveArr.length; i++) {
                LiveUpdate(liveArr[i]);
            }
        }
    }
    //更新dom投票
    function LiveUpdate(opts) {
        var now = getNow(tempCdnDate);
        var end = opts.endTime;
        var start = opts.startTime;
        var voteend = opts.voteEndTime;
        var uid = timerUID();
        var player1 = opts.player_1;
        var player2 = opts.player_2;
        var liveTempTarget = $("#" + opts.domId);
        var isExec = false;
        //修改dom
        if (liveSwiper != null) {
            liveSwiper.slideTo(liveTempTarget.index());
        }
        //h5的分享链接逻辑还要考虑
        if (!!isApp) {
            var url = opts.link;
            url = url.replace(/\&amp\;/g, "&");
        } else {
            var url = opts.app_link;
        }
        liveTempTarget.find(".tr3").removeClass("a").addClass("b").html('<td colspan="3" id=' + uid + '><a href="' + url + '"><div class="container"><div class="left">LIVE</div><div class="right">火热直播中</div></div></a></td>');
        if (!!isIpad) {
            player1.playerurl = "http://chang.pptv.com/ipad/player?username=" + player1.username;
            player2.playerurl = "http://chang.pptv.com/ipad/player?username=" + player2.username;
        } else {
            player1.playerurl = "http://chang.pptv.com/app/player?username=" + player1.username;
            player2.playerurl = "http://chang.pptv.com/app/player?username=" + player2.username;
        }
        if (!!isApp) {
            player1.playerurl = player1.playerurl + "&type=app";
            player2.playerurl = player2.playerurl + "&type=app";
        }
        liveTempTarget.find(".avartar").each(function(idx) {
            if (idx == 0) {
                var prevhref = player1.playerurl;
            } else {
                var prevhref = player2.playerurl;
            }
            this.setAttribute("spaceurl", prevhref);
            this.setAttribute("href", url);
        });
        timer({
            startTime: now,
            endTime: end,
            serverOffsetTime: serverOffsetTime,
            pageStartTime: pageStartTime,
            cdnDate: tempCdnDate,
            getServerSuccess: getServerSuccess,
            callback: function(status, times) {
                if (status == 2) {
                    var voteStr = '<tr><td class="vote js-vote" data-id="' + player1.vote_id + '"><span>投票</span></td><td></td><td class="vote js-vote" data-id="' + player2.vote_id + '"><span>投票</span></td></tr>';
                    var t3Wrap = liveTempTarget.find(".tr3");
                    t3Wrap.before(voteStr);
                    liveTempTarget.addClass("fourLineItem");
                    liveTempTarget.parents(".vs-item").addClass("fourline");
                    t3Wrap.html('<td><div class="count"></div></td><td></td><td><div class="count"></div></td>');
                    var jsVotes = liveTempTarget.find(".js-vote");
                    voteMap.add(player1.vote_id, jsVotes.eq(0));
                    voteMap.add(player2.vote_id, jsVotes.eq(1));
                    voteMap.getVotes({
                        callback: updateUI
                    });
                    liveTempTarget.find(".avartar").each(function() {
                        this.setAttribute("href", this.getAttribute("spaceurl"));
                    });
                    if (!isExec) {
                        isExec = true;
                        voteEndUpdate(opts);
                    }
                }
            }
        });
    }
    function voteEndUpdate(opts) {
        var end = opts.endTime;
        var voteend = opts.voteEndTime;
        timer({
            startTime: end,
            endTime: voteend,
            serverOffsetTime: serverOffsetTime,
            pageStartTime: pageStartTime,
            cdnDate: tempCdnDate,
            getServerSuccess: getServerSuccess,
            callback: function(status, times) {
                if (status == 2) {
                    //应该是进入第三阶段了，暂时不写dom逻辑，加延迟
                    setTimeout(function() {
                        window.location.reload();
                    }, 60 * 1e3);
                }
            }
        });
    }
    function dispatchBefore() {
        //sort
        //没有未开始的
        if (beforeArr.length == 0) {
            return false;
        }
        beforeArr.sort(function(a, b) {
            var returnVal = a.startTime.getTime() - b.startTime.getTime();
            if (returnVal == 0) {
                return -1;
            } else {
                return returnVal;
            }
        });
        nextTimer();
    }
    //未开始更新
    function beforeUpdate(opts) {
        var uid = timerUID();
        var now = getNow(tempCdnDate);
        var start = opts.startTime;
        var startStr = opts["start"].match(/\d{2}:\d{2}/);
        if (startStr == null) {
            startStr = "";
        } else {
            startStr = startStr[0];
        }
        var tempTarget = $("#" + opts.domId);
        tempTarget.find(".tr3").removeClass("a").addClass("c").html('<td colspan="3"><div class="t2 c" id=' + uid + "></div>后登场</td>");
        timer({
            startTime: now,
            endTime: start,
            serverOffsetTime: serverOffsetTime,
            pageStartTime: pageStartTime,
            cdnDate: tempCdnDate,
            getServerSuccess: getServerSuccess,
            callback: function(status, times) {
                if (status == 1) {
                    if (parseInt(times.hours, 10) < 24) {
                        $("#" + uid).html(times.hours + ":" + times.minitues + ":" + times.seconds);
                    } else {
                        tempTarget.find(".tr3").removeClass("a").addClass("c").html('<td colspan="3"><div class="t1 c" id=' + uid + ">" + startStr + "登场</div></td>");
                    }
                } else if (status == 2) {
                    //重置状态
                    nextTimer(opts);
                    LiveUpdate(opts);
                }
            }
        });
    }
    function nextTimer() {
        if (beforeArr.length == 0) {
            return;
        }
        var timerObj = beforeArr.shift();
        beforeUpdate(timerObj);
    }
    function updateAll(pkdata) {
        resetData();
        var allVoteEnd = false;
        for (var key in pkdata) {
            var obj = pkdata[key];
            var startTime = obj.startTime = uniformDate(obj.start);
            var endTime = obj.endTime = uniformDate(obj.end);
            var voteEndTime = obj.voteEndTime = obj.player_1.vote_end ? new Date(obj.player_1.vote_end * 1e3) : getEndVoteTime(endTime);
            var nowTime = getNow();
            //直播中
            if (startTime.getTime() <= nowTime.getTime() && nowTime.getTime() < endTime.getTime()) {
                insertLiveItem(obj);
            } else if (startTime.getTime() > nowTime.getTime()) {
                insertBeforeItem(obj);
            } else if (endTime.getTime() <= nowTime.getTime() && nowTime.getTime() < voteEndTime.getTime()) {
                //投票中
                insertVoteItem(obj);
            } else {
                insertVoteEndItem(obj);
            }
        }
        if (allVoteEnd == true) {
            return false;
        } else {
            dispatchFinish();
        }
    }
    var cachedPKDate = null;
    function updatePkList() {
        var tempData = {
            area_id: areaid
        };
        tempData.__config__ = {
            cdn: true,
            callback: "getPkList"
        };
        //先判断dom结构，如果是投票结束状态直接返回
        if ($("#pk_list .container").length == 3) {
            //投票都已经结束了
            return false;
        }
        ajaxLoad.load("http://chang.pptv.com/api/pk", tempData, function(data) {
            //var data=require('../index/testpk');
            if (data.err == 0) {
                var data = cachedPKDate = data.data[areaid];
                var tempEnd;
                var k = 9;
                while (k > 0) {
                    if (!!data[k]) {
                        var tempEnd = data[k]["end"];
                        var tempStart = data[k]["start"];
                        var tempvoteEnd = data[k]["player_1"]["vote_end"] ? new Date(data[k]["player_1"]["vote_end"] * 1e3) : getEndVoteTime(uniformDate(tempEnd));
                        break;
                    }
                    k--;
                }
                if (!tempEnd) {
                    return false;
                }
                var now = getNow();
                var endLast = uniformDate(tempEnd);
                var startLast = uniformDate(tempStart);
                var startFirst = uniformDate(data["0"]["start"]);
                // 直播未开始
                if (startFirst.getTime() > now.getTime()) {
                    if (!!isIpad) {
                        /*var $vsItem=$pkList.find('.vs-item');
                        new Swiper($vsItem, {
                            slidesPerView: 'auto'
                        });*/
                        updateAll(cachedPKDate);
                    }
                    return false;
                } else if (now.getTime() <= tempvoteEnd.getTime()) {
                    //需要更新
                    updateAll(cachedPKDate);
                }
            }
        });
    }
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

/**
 * @author  Erick Song
 * @email   ahschl0322@gmail.com
 * @info    PPSDK
 *
 * Example :
 *
 *  ppsdk.msgboard({
 *       info:{ id : "special_" + encodeURIComponent('querry.username') },
 *       success:function(rspData) {
 *       },
 *       error:function(errCode, msg) {
 *       },
 *       cancel:function() {
 *       }
 *  });
 *
 * or trigger it!
 *
 *  ppsdk.trigger('msgbord')
 *
 *
 */
define("util/ppsdk/sdk", [], function(require, exports, modules) {
    var isReady = false;
    if (!this.ppsdk) {
        alert("load sdk error!");
        return false;
    }
    ppsdk.config({
        api: [],
        //本页面用到的js接口列表(暂时不支持)
        signature: "",
        //签名，暂时可不填
        debug: true
    });
    ppsdk.types = [];
    ppsdk.proxy = function(name, opts) {
        if (!ppsdk.types[name]) {
            ppsdk.types[name] = opts;
        }
        return this;
    };
    ppsdk.trigger = function(name) {
        if (name && ppsdk[name] && isReady) {
            ppsdk[name](ppsdk.types[name]);
        }
        return this;
    };
    ppsdk.ready(function() {
        //alert('ppsdk ready!');
        isReady = true;
    });
    ppsdk.isReady = function() {
        return isReady;
    };
    return ppsdk;
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
