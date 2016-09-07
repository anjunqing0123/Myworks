/*! 一唱成名 create by ErickSong */
/* 
* @Author: WhiteWang
* @Date:   2015-09-08 20:58:13
* @Last Modified by:   weifengwang
* @Last Modified time: 2015-11-13 15:32:13
*/
define("app/pc/client/60out", [ "../../../util/vcanvas/vcanvas", "../../../util/vote/voteupdate", "core/jquery/1.8.3/jquery", "../../../util/loader/loader", "../../../util/log/log", "../../../util/platform/plt", "../../../util/browser/browser", "../../../util/net/urlquery", "../../../util/vote/vote", "../../../util/cookie/cookie", "../../../util/user/user", "client", "../../../util/vote/formatVote", "../../../util/Timer/timer", "../../../util/vote/uniformDate", "../../../util/Timer/servertime", "../../../util/linkcfg/interfaceurl", "core/underscore/1.8.3/underscore", "../../../util/countdown/countdown", "../../../util/eventpause/eventpause" ], function(require) {
    var VCanvas = require("../../../util/vcanvas/vcanvas"), voteMap = require("../../../util/vote/voteupdate"), ChangVote = require("../../../util/vote/vote"), formatVote = require("../../../util/vote/formatVote"), timer = require("../../../util/Timer/timer"), serverTime = require("../../../util/Timer/servertime"), api = require("../../../util/linkcfg/interfaceurl")["interface"], Loader = require("../../../util/loader/loader"), cookie = require("../../../util/cookie/cookie"), _ = require("core/underscore/1.8.3/underscore"), $ = require("core/jquery/1.8.3/jquery");
    require("../../../util/countdown/countdown")($);
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
    var pauseTime = 10;
    var pauseTime2 = 60;
    //绑定页面上的所有投票
    //最后会调用getVote方法，通过callback更新dom
    var voteMapCallback = {};
    voteMap.init({
        selector: ".cheerBtn",
        voteAttr: "data-sid",
        prior: "data-prior"
    });
    //为TA喝彩更新
    voteMapCallback[1] = function() {
        var opt = arguments[0];
        var counter = opt.data.counter;
        $(".module-cheer .ticket-num").html(addKannma(counter) + "票");
    };
    //为Ta喝彩按钮点击处理逻辑
    (function() {
        var $dom = $(".cheerBtn");
        new ChangVote({
            dom: $dom,
            voteAttr: "data-sid",
            beforeVote: function(data, el) {
                return true;
            },
            afterVote: function(data, el) {
                if (data.counter) {
                    var $el = $(el);
                    $el.countdown({
                        timing: pauseTime2
                    });
                    var $add = $('<span class="addIcon"></span>');
                    $el.parent().append($add);
                    $add.animate({
                        top: "-16px",
                        opacity: 0
                    }, 500, function() {
                        $add.remove();
                    });
                    cookie.set("_c_" + data.id, new Date().getTime(), 1 / 24 / (3600 / pauseTime2), "pptv.com", "/");
                    $(".ticket-num").html(addKannma(data.counter) + "票");
                } else if (data.errors) {
                    if (data.errors.code == 88) {
                        alert("请休息一会儿再投票哦！");
                    } else if (data.errors.code == 91) {
                        alert("投票未开始");
                    }
                }
            }
        });
        $dom.each(function(i, el) {
            var id = $(el).attr("data-sid");
            var co = cookie.get("_c_" + id);
            if (co) {
                co = Number(co);
                d = new Date().getTime();
                $(el).countdown({
                    timing: pauseTime2 - Math.floor((d - co) / 1e3)
                });
            }
        });
    })();
    //跑步机功能
    (function() {
        var speedUpdated = false;
        //创建一个跑步机投票canvas
        var disc = new VCanvas({
            canvas: "speed",
            font: "20px Arial",
            lineLength: 30,
            lineWidth: 3,
            scale: .5,
            textRadius: 130,
            lineRadius: 115
        });
        //一开始跑步机是0档
        disc.redraw(0, 0);
        //重绘投票canvas
        drawPointer(0, 1);
        //请求跑步机投票数据
        Loader.load(api.gettreadmill, window.webcfg, function(data) {
            if (data.code == 1) {
                var data = data.data;
                bindVoteId(data);
            }
        });
        //根据数据重绘投票canvas，绑定加速减速按钮事件
        function bindVoteId(data) {
            var $upBtn = $(".btn-add"), $downBtn = $(".btn-min"), upNum = data.speedUpVote.counter, downNum = data.slowDownVote.counter;
            $upBtn.attr("data-sid", data.speedUpVoteId);
            $downBtn.attr("data-sid", data.slowDownVoteId);
            voteMap.add({
                selector: ".btn-add, .btn-min",
                voteAttr: "data-sid",
                prior: "data-prior"
            });
            //增加更新投票数据，会在最后的getVotes中处理
            voteMapCallback[2] = function() {
                if (!speedUpdated) {
                    return;
                }
                var obj1 = arguments[0], obj2 = arguments[1];
                if (!obj1.data || !obj2.data) {
                    return;
                }
                if (obj1.id == data.speedUpVoteId) {
                    upNum = obj1.data.counter || upNum;
                } else if (obj1.id == data.slowDownVoteId) {
                    downNum = obj1.data.counter || downNum;
                }
                if (obj2.id == data.speedUpVoteId) {
                    upNum = obj2.data.counter || upNum;
                } else if (obj2.id == data.slowDownVoteId) {
                    downNum = obj2.data.counter || downNum;
                }
            };
            // disc.redraw(upNum, downNum);    //重绘投票canvas
            // drawPointer(upNum, downNum);
            endCountDown(webcfg.endTime * 1e3);
        }
        function drawPointer(upNum, downNum) {
            var t = 83;
            var $pointer = $(".pointer");
            var deg = t - t * 2 * downNum / (upNum + downNum);
            $pointer.css("-webkit-transform", "rotate(" + deg + "deg)");
        }
        function endCountDown(endTime) {
            serverTime.get(function(date, offset) {
                var $countdown = $(".counttime");
                timer({
                    startTime: date,
                    endTime: new Date(endTime),
                    serverOffsetTime: offset,
                    callback: function(status, times) {
                        if (status == 1) {
                            $countdown.html(times.hours + ":" + times.minitues + ":" + times.seconds);
                            if (Number(times.hours) < 1 && !speedUpdated) {
                                getSpeed();
                            }
                        } else if (status == 2) {
                            $countdown.html("00:00:00");
                            $(".btn-add, .btn-min").addClass("disable").attr("title", "投票已结束");
                        }
                    }
                });
            });
        }
        //获取跑步机速度
        function getSpeed() {
            Loader.load(api.speed, {
                cid: window.webcfg.cid
            }, function(data) {
                data = data.data;
                $(".run p strong").html(data.speed);
                // var sp = 1;
                var sp = Number(data.speed);
                disc.redraw(sp, 5 - sp);
                drawPointer(sp, 5 - sp);
                $(".btn-add, .btn-min").removeClass("disable").attr("title", "");
                if (!speedUpdated) {
                    var $dom = $(".btn-add, .btn-min");
                    new ChangVote({
                        //绑定投票点击事件
                        dom: $dom,
                        voteAttr: "data-sid",
                        beforeVote: function(data, el) {
                            if ($(el).hasClass("disable")) {
                                return false;
                            } else {
                                return true;
                            }
                        },
                        afterVote: function(data, el) {
                            if (data.errors) {
                                if (data.errors.code == 88) {
                                    alert("请休息一会儿再投票哦！");
                                } else if (data.errors.code == 91) {
                                    alert("投票未开始");
                                }
                            } else {
                                $(el).countdown();
                                cookie.set("_c_" + data.id, new Date().getTime(), 1 / 24 / (3600 / pauseTime), "pptv.com", "/");
                            }
                        }
                    });
                    $dom.each(function(i, el) {
                        var id = $(el).attr("data-sid");
                        var co = cookie.get("_c_" + id);
                        if (co) {
                            co = Number(co);
                            d = new Date().getTime();
                            $(el).countdown({
                                timing: pauseTime - Math.floor((d - co) / 1e3)
                            });
                        }
                    });
                }
                speedUpdated = true;
                if (data.offline_on) {
                    serverTime.get(function(t, o) {
                        timer({
                            //到时间以后重新获取
                            startTime: t,
                            endTime: new Date(data.offline_on * 1e3),
                            serverOffsetTime: o,
                            callback: function(status, times) {
                                // console.log(times.hours+':'+times.minitues+':'+times.seconds)
                                if (status == 2) {
                                    setTimeout(function() {
                                        getSpeed();
                                    }, 3e3);
                                }
                            }
                        });
                    });
                }
            });
        }
    })();
    //歌单模块
    //20分钟倒计时 听你想听
    (function() {
        var tpSongList = _.template("" + '<div class="songticket">' + '<span class="progress" style="width:<%= percent %>%;"></span>' + '<span class="song"><%= title %></span>' + '<span class="ticket"><%= counter %>票</span>' + '<a href="javascript:;" class="btn" data-sid="<%= voteId %>" data-prior="3">确认投票</a>' + "</div>");
        var $module = $(".module-20min");
        var $moduleHsy = $(".module-songlist");
        function getLength(maxLenth, num, rate) {
            // 该方法保证正相关，但是不成正比，目的是减小两个相差比较大的数之间的差值。
            // rata 是一个倍率，设成较大值的1/4比较合适。
            if (num === 0) {
                return 0;
            }
            var minLenth = 10;
            return minLenth + Math.atan(num / rate) / Math.PI * 2 * (maxLenth - minLenth);
        }
        //点击选中事件
        $module.on("click", ".songticket", function(ev) {
            if ($(ev.target).hasClass("btn")) {
                return;
            }
            var $list = $(this);
            if ($list.hasClass("s1")) {
                $list.removeClass("s1");
            } else {
                $module.find(".songticket").removeClass("s1");
                $list.addClass("s1");
            }
        });
        //倒数计时更新处理
        var $timerProgress = $module.find(".timer .progress");
        function updateCountDom(times, total) {
            var h = Number(times.hours), m = Number(times.minitues), s = Number(times.seconds);
            var t = h * 3600 + m * 60 + s;
            if (t > total) {
                t = total;
            }
            $timerProgress.width((total - t) * 100 / total + "%").find("span").html(times.hours + ":" + times.minitues + ":" + times.seconds);
        }
        //
        function updateSingList(list) {
            $module.find(".songticket").remove();
            var tracks = list.tracks;
            var len = tracks.length;
            var totalVotes = 0;
            var html = "";
            var maxCount = _.max(list, function(l) {
                l.counter = l.vote.counter || 0;
                return l.counter;
            }).counter;
            for (var i = 0; i < len; i++) {
                var obj = tracks[i];
                obj.percent = getLength(90, obj.counter, maxCount / 4);
                obj.counter = formatVote(obj.counter);
                html += tpSongList(obj);
            }
            $module.append(html);
            bindVote();
            bindVoteMap();
        }
        //绑定点击事件
        function bindVote() {
            new ChangVote({
                dom: $module.find(".btn"),
                voteAttr: "data-sid",
                beforeVote: function(data, el) {
                    return true;
                },
                afterVote: function(data, el) {
                    if (data.counter) {
                        $module.find(".btn").countdown();
                        var $parent = $(el).parent();
                        var $add = $('<span class="addIcon"></span>');
                        $parent.append($add);
                        $add.animate({
                            top: "-38px",
                            opacity: 0
                        }, 500, function() {
                            $add.remove();
                            $parent.removeClass("s1");
                        });
                        $(el).siblings(".ticket").html(formatVote(data.counter) + "票");
                    }
                    if (data.errors) {
                        if (data.errors.code == 88) {
                            alert("请休息一会儿再投票哦！");
                        } else if (data.errors.code == 91) {
                            alert("投票未开始");
                        }
                    }
                }
            });
        }
        //绑定投票map，定时统一更新，见最后的voteMap.getVotes
        function bindVoteMap() {
            voteMap.delPrior(3);
            voteMap.add({
                selector: $module.find(".btn"),
                voteAttr: "data-sid",
                prior: "data-prior"
            });
            //增加更新投票数据，会在最后的getVotes中处理
            voteMapCallback[3] = function() {
                var lists = arguments;
                var rate = _.max(lists, function(list) {
                    return list.data.counter;
                }).data.counter / 4;
                for (var i = 0, len = lists.length; i < len; i++) {
                    var list = lists[i];
                    var count = list.data.counter;
                    for (var j = 0; j < list.dom.length; j++) {
                        var $dom = list.dom[j];
                        $dom.siblings(".ticket").html(formatVote(counter) + "票");
                        $dom.siblings(".progress").width(getLength(90, counter, rate) + "%");
                    }
                }
            };
        }
        //历史歌单处理
        function updateHistoryList(list) {
            if (!list || !list.length) {
                return;
            }
            $(".js-songList").show();
            var html = "<h2>历史歌单</h2>";
            for (var i = 0, len = list.length; i < len; i++) {
                var tracks = list[i].tracks;
                var maxItem = _.max(tracks, function(track) {
                    return track.vote.counter || 0;
                });
                html += '<span class="list">' + maxItem.title + "</span>";
            }
            $moduleHsy.html(html);
        }
        //当前正在唱的歌单处理
        function updateNowList(list, nextRequest) {
            if (!list || !list.length) {
                return;
            }
            list = list[0];
            serverTime.get(function(serverTime, offsetTime) {
                var endTime = new Date(list.endedAt);
                var totalSeconds = parseInt((endTime.getTime() - serverTime.getTime()) / 1e3);
                timer({
                    startTime: serverTime,
                    endTime: endTime,
                    serverOffsetTime: offsetTime,
                    callback: function(status, times) {
                        updateCountDom(times, totalSeconds);
                        if (status == 2 && nextRequest) {
                            requestSingList();
                        }
                    }
                });
            });
            updateSingList(list);
        }
        function requestSingList() {
            Loader.load(api.singList, window.webcfg, function(data) {
                if (data.code == 1) {
                    serverTime.get(function(serverTime, offsetTime) {
                        var playlists = data.data.playlists;
                        var countI = null;
                        //用来判断是否要发送下一次请求
                        var nowArray = [];
                        var befArray = [];
                        var len = playlists.length;
                        var nextRequestTime = 0;
                        for (var i = 0; i < len; i++) {
                            var obj = playlists[i];
                            var startTime = new Date(obj.startedAt);
                            var endTime = new Date(obj.endAt);
                            if (serverTime >= startTime && serverTime < endTime) {
                                nowArray.push(obj);
                                countI = i;
                            } else if (serverTime >= endTime) {
                                befArray.push(obj);
                            }
                        }
                        if (countI != null && countI < len - 1) {
                            //如果歌单列表里的最后一个歌单，已经进入了nowArray，则不发送下一次请求，因为所有歌单都已经唱完了
                            updateNowList(nowArray, true);
                        } else {
                            updateNowList(nowArray, false);
                        }
                        updateHistoryList(befArray);
                    });
                }
            });
        }
    })();
    //通过getVote获取投票数据，统一更新dom
    //根据prior字段分发处理
    function voteFilter() {
        voteMap.getVotes({
            callback: function(map, idArray) {
                var prior = map.prior;
                for (var i in prior) {
                    var pArr = prior[i];
                    var tArr = [];
                    for (var j = 0, l = pArr.length; j < l; j++) {
                        var obj = map[pArr[j]];
                        obj.id = pArr[j];
                        tArr.push(obj);
                    }
                    if (voteMapCallback[i]) {
                        voteMapCallback[i].apply(null, tArr);
                    }
                }
            }
        });
    }
    function updateRewardMoney() {
        Loader.load(api["reward"], window.webcfg, function(data) {
            if (data.err === 0) {
                data = data.data;
                var playerCount = 0;
                var totalCount = 0;
                for (var i in data) {
                    totalCount += Number(data[i]);
                    if (i == window.webcfg.player_id) {
                        playerCount += data[i];
                    }
                }
                if (totalCount == 0) {
                    var percent = 0 + "%";
                } else {
                    var percent = Math.round(Number(playerCount) / totalCount * 1e3) / 10 + "%";
                }
                var $dom = $(".ticket-per span");
                $dom.html(percent).css("width", percent);
            }
        });
    }
    voteFilter();
    updateRewardMoney();
    setInterval(function() {
        voteFilter();
        //投票数据更新
        updateRewardMoney();
    }, 3e4);
});

/* 
* @Author: WhiteWang
* @Date:   2015-09-08 20:41:16
* @Last Modified by:   weifengwang
* @Last Modified time: 2015-10-28 15:40:39
*/
//效果见页面：http://static9.pptv.com/chang/pages/pc/60out/client.html
define("util/vcanvas/vcanvas", [], function(require) {
    /**
     * [VCanvas description]
     * opt.canvas   canvas的ID
     * opt.nColor   数组，两个值，代表数字的两种颜色
     */
    var VCanvas = function() {
        function extend(target, options) {
            for (name in options) {
                var copy = options[name];
                if (copy instanceof Array) {
                    target[name] = extend([], copy);
                } else if (copy instanceof Object) {
                    target[name] = extend({}, copy);
                } else {
                    target[name] = options[name];
                }
            }
            return target;
        }
        //画数字
        function drawNumbers(ctx, opt) {
            var numbers = opt.numbers;
            len = numbers.length;
            for (var i = 0; i < len; i++) {
                var deg = Math.PI * (1 - i / (len - 1));
                var x = opt.cp.x + opt.radius * Math.cos(deg);
                var y = opt.cp.y - opt.radius * Math.sin(deg);
                var fillStyle = opt.color[0];
                // if(i>len/2){
                //     fillStyle = opt.color[1];
                // }
                ctx.fillStyle = fillStyle;
                ctx.textAlign = "center";
                ctx.font = opt.font;
                ctx.fillText(numbers[i], x, y);
            }
        }
        function drawDisc(ctx, opt) {
            var len = opt.lineNumber;
            var arr = [];
            var oRadius = opt.radius;
            //外半径
            var iRadius = oRadius - opt.lineLength;
            //内半径
            for (var i = 0; i < len; i++) {
                var obj = {};
                var deg = Math.PI * (1 - i / (len - 1));
                obj.x1 = opt.cp.x + oRadius * Math.cos(deg);
                obj.y1 = opt.cp.y - oRadius * Math.sin(deg);
                obj.x2 = opt.cp.x + iRadius * Math.cos(deg);
                obj.y2 = opt.cp.y - iRadius * Math.sin(deg);
                obj.color = opt.color;
                obj.lineWidth = opt.lineWidth;
                // drawLine(ctx, obj);
                arr.push(obj);
            }
            return arr;
        }
        function drawLine(ctx, opt) {
            ctx.beginPath();
            ctx.strokeStyle = opt.color;
            ctx.lineWidth = opt.lineWidth;
            ctx.moveTo(opt.x1, opt.y1);
            ctx.lineTo(opt.x2, opt.y2);
            ctx.stroke();
        }
        //计算圆心坐标
        function getCenterPos(w, h) {
            return {
                x: parseInt(w / 2),
                y: h
            };
        }
        //计算半径
        function computeRadius(w, h) {
            var halfWidth = parseInt(w / 2);
            var radius = halfWidth;
            if (halfWidth > h) {
                radius = h;
            }
            return radius;
        }
        function clearCircle(ctx, opt) {
            ctx.beginPath();
            ctx.arc(opt.x, opt.y, opt.r, 0, 2 * Math.PI);
            ctx.clip();
            ctx.clearRect(0, 0, opt.width, opt.height);
        }
        function repaintDisc(ctx, opt) {
            var time = 300;
            var disc = opt.disc;
            var colors = opt.colors;
            var len = disc.length;
            var n = Math.round(len * opt.percent);
            var lineArr = [];
            for (var i = 0; i < n; i++) {
                disc[i].color = colors[0];
                drawLine(ctx, disc[i]);
            }
            for (var i = n; i < len; i++) {
                disc[i].color = colors[1];
                drawLine(ctx, disc[i]);
            }
        }
        return function(opt) {
            opt = extend({
                canvas: "speed",
                //canvas id
                nColor: [ "#bd7845", "#922f2b" ],
                //数字颜色
                lineWidth: 1,
                //线粗细
                lineLength: 15,
                //线长度
                lColor: [ "#ec904c", "#d5d5d5" ],
                //线颜色
                lineNumber: 30,
                //线个数,
                scale: 1,
                font: "12px Arial"
            }, opt);
            var canvas = document.getElementById(opt.canvas);
            var ctx = canvas.getContext("2d");
            ctx.scale(opt.scale, opt.scale);
            var width = parseInt(canvas.width / opt.scale);
            var height = parseInt(canvas.height / opt.scale);
            var cp = getCenterPos(width, height);
            var cRadius = computeRadius(width, height);
            var textRadius = opt.textRadius ? opt.textRadius : cRadius - 10 / opt.scale;
            var lineRadius = opt.lineRadius ? opt.lineRadius : cRadius - 18 / opt.scale;
            drawNumbers(ctx, {
                width: width,
                height: height,
                numbers: [ "0", "1", "2", "3", "4", "5" ],
                font: opt.font,
                color: opt.nColor,
                cp: cp,
                scale: opt.scale,
                radius: textRadius
            });
            var disc = drawDisc(ctx, {
                lineWidth: opt.lineWidth,
                lineLength: opt.lineLength,
                color: opt.lColor[1],
                lineNumber: opt.lineNumber,
                radius: lineRadius,
                cp: cp,
                scale: opt.scale
            });
            var currPercent = 0;
            this.redraw = function(positive, negtive) {
                clearCircle(ctx, {
                    x: cp.x,
                    y: cp.y,
                    r: lineRadius + 1,
                    width: width,
                    height: height
                });
                // var percent = 0;
                if (positive == 0) {
                    percent = 0;
                } else {
                    percent = positive / (positive + negtive);
                }
                repaintDisc(ctx, {
                    disc: disc,
                    percent: percent,
                    colors: opt.lColor
                });
            };
        };
    }();
    return VCanvas;
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

/* 
* @Author: WhiteWang
* @Date:   2015-09-22 18:02:46
* @Last Modified by:   weifengwang
* @Last Modified time: 2015-09-23 19:58:58
*/
define("util/Timer/servertime", [ "core/jquery/1.8.3/jquery" ], function(require) {
    var $ = require("core/jquery/1.8.3/jquery");
    //根据服务器时间，计算与本地时间的差异
    function calculateOffsetTime(serverTime) {
        return serverTime * 1e3 - new Date().getTime();
    }
    //根据offsetTime，计算出服务器时间
    function calculateServerTime(ot) {
        var serverTime = new Date().getTime() + ot;
        return new Date(serverTime);
    }
    var ServerTime = {
        offsetTime: 0,
        serverGet: false,
        get: function(callback) {
            if (this.serverGet) {
                callback(calculateServerTime(this.offsetTime), this.offsetTime);
            } else {
                this.getServerTime(callback);
            }
        },
        getServerTime: function(callback) {
            var self = this;
            $.ajax({
                url: "http://time.pptv.com",
                type: "GET",
                dataType: "jsonp",
                cache: true,
                jsonp: "cb",
                timeout: 1e3,
                jsonpCallback: "getServerTime",
                success: function(data) {
                    self.serverGet = true;
                    self.offsetTime = calculateOffsetTime(data);
                    callback(new Date(data * 1e3), self.offsetTime);
                },
                error: function(jqXHR, status) {
                    callback(calculateServerTime(self.offsetTime), self.offsetTime);
                }
            });
        }
    };
    return ServerTime;
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

/* 
* @Author: WhiteWang
* @Date:   2015-09-17 09:59:17
* @Last Modified by:   weifengwang
* @Last Modified time: 2015-09-23 09:58:24
*/
//jquery插件，点击按钮后，给按钮覆盖一层dom，默认10秒后才能再次点击
//样式需要CSS定义
define("util/countdown/countdown", [ "util/eventpause/eventpause" ], function(require) {
    return function($) {
        require("util/eventpause/eventpause")($);
        $.fn.countdown = function(options) {
            var defaults = {
                customClass: "countdown",
                timing: 10,
                clickCallback: function() {}
            };
            var opt = $.extend({}, defaults, options);
            var $el = $(this);
            $el.each(function(i, e) {
                appendCountdown(e);
            });
            function appendCountdown(el) {
                var $el = $(el);
                var timing = opt.timing;
                if (!!opt.formatCounter) {
                    var $cd = $('<span class="' + opt.customClass + '">' + opt.formatCounter(timing) + "</span>");
                } else {
                    var $cd = $('<span class="' + opt.customClass + '">' + timing + "</span>");
                }
                $cd.on("click", function() {
                    opt.clickCallback();
                });
                $el.append($cd);
                $el.eventPause("pause", "click");
                var timer = setInterval(function() {
                    if (timing === 0) {
                        clearInterval(timer);
                        $cd.remove();
                        $el.eventPause("active", "click");
                        return;
                    }
                    timing--;
                    if (!!opt.formatCounter) {
                        $cd.html(opt.formatCounter(timing));
                    } else {
                        $cd.html(timing);
                    }
                }, 1e3);
            }
        };
    };
});

/* 
* @Author: WhiteWang
* @Date:   2015-09-22 14:27:00
* @Last Modified by:   weifengwang
* @Last Modified time: 2015-09-22 14:30:55
*/
define("util/eventpause/eventpause", [], function(require) {
    /*
eventPause.js v 1.0.0
Author: sudhanshu yadav
s-yadav.github.com
Copyright (c) 2013 Sudhanshu Yadav.
Dual licensed under the MIT and GPL licenses
*/
    //https://github.com/s-yadav/eventPause.js
    return function($) {
        $.fn.eventPause = function(method, events) {
            initialize();
            //check if method is defined
            if (!methods[method] && events == null) {
                events = method;
            }
            events = structureEvent(events);
            if (methods[method]) {
                return methods[method].call(this, events);
            } else {
                return methods.pause.call(this, events);
            }
        };
        var methods = {
            pause: function(events) {
                return this.each(function() {
                    if (!$(this).data("iw-disable")) {
                        $(this).data("iw-eventactive", false);
                        $._iwEventPause["assigned"].push(this);
                        pauseEvent(this, events);
                    }
                });
            },
            active: function(events) {
                return this.each(function() {
                    if (!$(this).data("iw-disable")) {
                        $(this).data("iw-eventactive", true);
                        $._iwEventPause["assigned"].splice(this);
                        activeEvent(this, events);
                    }
                });
            },
            pauseChild: function(events) {
                return methods["pause"].call(this.add(this.find("*")), events);
            },
            activeChild: function(events) {
                return methods["active"].call(this.add(this.find("*")), events);
            },
            enable: function() {
                //to enable pausing and unpausing temperorly
                this.data("iw-disable", false);
            },
            disable: function() {
                //to disable pausing and unpausing temperorly
                this.data("iw-disable", true);
            },
            toggle: function(events) {
                var status = this.data("iw-eventactive");
                if (status) {
                    return methods["active"].call(this, events);
                } else {
                    return methods["pause"].call(this, events);
                }
            },
            state: function() {
                var disable = this.data("iw-disable") ? "disabled" : "enabled", active = this.data("iw-eventactive") == false ? "paused" : "active";
                return active + "-" + disable;
            }
        };
        //globalMethod
        $.eventPause = {
            activeAll: function() {
                loop("active");
            },
            //this will enable disable all pause events 
            enableAll: function() {
                loop("enable");
            },
            disableAll: function() {
                loop("disable");
            }
        };
        //  internal method
        //function to run for all element in array in global methods
        function loop(type) {
            if ($._iwEventPause) {
                var asgnd = $._iwEventPause["assigned"];
                for (var i = 0; i < asgnd.length; i++) {
                    return methods[type].call($(asgnd[i]));
                }
            }
        }
        //function to initialize
        function initialize() {
            if (!$._iwEventPause) {
                $._iwEventPause = {};
                $._iwEventPause["assigned"] = [];
            }
        }
        //null function
        var nullFun = function() {};
        //function to restructure event
        function structureEvent(events) {
            var eventJson = [];
            if (!events) {
                events = "";
            }
            if (typeof events == "string" && events != "") {
                events = events.split(" ");
                for (var i = 0; i < events.length; i++) {
                    if (events[i] == "hover") {
                        eventJson.push("hover");
                        eventJson.push("mouseover");
                        eventJson.push("mouseout");
                    } else if (events[i] == "mouseenter") {
                        eventJson.push("mouseover");
                    } else if (events[i] == "mouseleave") {
                        eventJson.push("mouseoout");
                    } else {
                        eventJson.push(events[i]);
                    }
                }
                events = eventJson;
            }
            return events;
        }
        function getIndex(array, value) {
            for (var i = 0; i < array.length; i++) {
                if (array[i] == value) {
                    return i;
                }
            }
            return -1;
        }
        //function to pasue event
        function pauseEvent(elm, eventAry) {
            var events = $._data(elm, "events");
            if (events) {
                $.each(events, function(type, definition) {
                    if (getIndex(eventAry, type) != -1 || eventAry == "") {
                        $.each(definition, function(index, event) {
                            if (event.handler.toString() != nullFun.toString()) {
                                $._iwEventPause["iw-event" + event.guid] = event.handler;
                                event.handler = nullFun;
                            }
                        });
                    }
                });
            }
        }
        //function to unpasue event
        function activeEvent(elm, eventAry) {
            var events = $._data(elm, "events");
            if (events) {
                $.each(events, function(type, definition) {
                    if (getIndex(eventAry, type) != -1 || eventAry == "") {
                        $.each(definition, function(index, event) {
                            if (event.handler.toString() == nullFun.toString()) {
                                event.handler = $._iwEventPause["iw-event" + event.guid];
                            }
                        });
                    }
                });
            }
        }
    };
});
