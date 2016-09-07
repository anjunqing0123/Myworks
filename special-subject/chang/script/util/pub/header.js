/*! 一唱成名 create by ErickSong */
/**
 * @author  yanyang
 * @email   ahschl0322@gmail.com
 * @info    header
 */
/**
chid = Id
o_cid = ClId
o_chid = SubId

 */
/*
1.播放记录：未登录从history模块中取，登录从http://sync.pptv.com/v3/中取；
*/
define("util/pub/header", [ "./main", "core/underscore/1.8.3/underscore", "core/jquery/1.8.3/jquery", "../cookie/cookie", "../lazyload/delayload", "../lazyload/webp", "../login/login", "../user/user", "client", "../scroller/scroller", "../event/event-mouse-wheel", "../scroller/scroller.css", "../log/log", "../user/user-fix", "../function/delay", "./checkin", "../loader/loader", "../platform/plt", "../browser/browser", "../net/urlquery", "../md5/md5", "./user-data", "./history", "../json/json", "./puid" ], function(require, exports, module) {
    //添加依赖
    require("./main");
    require("../scroller/scroller");
    var encode = encodeURIComponent;
    var cookie = require("../cookie/cookie");
    var pptoken = cookie.get("ppToken");
    var ppname = cookie.get("PPName");
    var domain = "pptv.com";
    var path = "/";
    if (!pptoken && !!ppname || !!pptoken && !ppname) {
        cookie.remove("PPKey", domain, path);
        cookie.remove("UDI", domain, path);
        cookie.remove("PPName", domain, path);
        cookie.remove("ppToken", domain, path);
    }
    var IE6 = !window.XMLHttpRequest;
    var iPad = navigator.userAgent.indexOf("iPad") >= 0;
    var isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry/i.test(navigator.userAgent);
    var $ = require("core/jquery/1.8.3/jquery"), login = require("../login/login"), log = require("../log/log"), user = require("../user/user"), user_fix = require("../user/user-fix"), cookie = require("../cookie/cookie"), _ = require("core/underscore/1.8.3/underscore"), delay = require("../function/delay"), checkIn = require("./checkin"), userData = require("./user-data");
    var webcfg = window.webcfg || {};
    // Publish/Subscribe
    if (typeof $.subscribe1 != "function") {
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
    }
    var playhistory = userData.playhistory, favorite = userData.favorite, recommend = userData.recommend, clearCache = userData.clearCache, userDetail = userData.userDetail, cloudhistory = userData.cloudhistory;
    var smallHead = $(".g-1408-hd").hasClass("g-1408-hd-s");
    /* 业务逻辑 start*/
    var webInit = function() {
        /* web端逻辑 */
        require.async("./suggest", function(suggest) {
            var sg = new suggest("#search_box");
            sg.init();
        });
        // 为了关联收藏、看过 和 个人中心的交互
        var commonCloser = {
            history: function() {},
            userCenter: function() {}
        };
        (function() {
            var container = $("#hd-operate");
            var tabCont = container.find("ul.hd-operate-ul");
            var DomListCont = $("#operate-drop");
            var icon = DomListCont.find("> i");
            var DomLists = DomListCont.find("div.history");
            var lock = false;
            //
            var loadedModules = [];
            //缓存key
            var noDataHTML = [ '<p class="nohistory"><i class="ui-history"></i><span class="">暂无观看记录</span></p>', '<p class="nohistory"><i class="ui-favorites"></i><span class="">暂无收藏内容</span></p>' ];
            var findModule = function(moduleName) {
                if (moduleName.toLowerCase() == "playhistory") {
                    return playhistory;
                } else if (moduleName.toLowerCase() == "favorite") {
                    return favorite;
                }
            };
            // 输出节目链接，带缓存
            var watchLink = function(item) {
                var cache = watchLink.cache = watchLink.cache || {};
                if (cache[item.Id]) {
                    return cache[item.Id];
                }
                var webcfg = window.webcfg || {};
                var state = Number(item.Pos) >= Number(item.Duration);
                var link = "http://v.pptv.com/show/" + (item.Link || item.link) + ".html" + (state ? "?" : "?rcc_starttime=" + item.Pos);
                var current = webcfg.id == (item.Id || item.SubId) && webcfg.pid == item.Id;
                return cache[item.id] = {
                    link: link,
                    current: current
                };
            };
            // 增加必要显示的内容，没有返回值
            var videoDataFilter = function(data, type) {
                _.each(data, function(data) {
                    var percent = data.Duration == 0 ? 0 : (parseInt(data.Pos) / parseInt(data.Duration) * 100).toFixed(0);
                    var watched = parseInt(percent) > 95;
                    data._watchEnd = watched;
                    var rcc;
                    //观看过用播放进度，收藏用收藏日期
                    switch (type) {
                      case "favorite":
                        var fDate = new Date(parseInt(data._mt));
                        data._progress = fDate.getFullYear() + "/" + (fDate.getMonth() + 1) + "/" + fDate.getDate();
                        rcc = "A8";
                        break;

                      case "playhistory":
                        data._progress = watched ? "看完" : "看到" + percent + "%";
                        rcc = "A7";
                        break;

                      default:
                        ;
                    }
                    data._link = watchLink(data).link + "&rcc_src=" + rcc;
                    data._isCurrent = watchLink(data).current;
                    data._moduleName = type;
                });
            };
            var clearModuleCacheKey = function() {
                loadedModules = [];
            };
            user_fix().onLogin(clearModuleCacheKey).onLogout(clearModuleCacheKey);
            var show = delay(function(i, moduleName) {
                lock = false;
                tabCont.find("li").removeClass("now").eq(i).addClass("now");
                if (moduleName) {
                    DomLists.hide().eq(i).show();
                    /* 浮层小三角位置计算 */
                    var btn = tabCont.find("li").eq(i);
                    var left = btn.position().left;
                    var btnWidth = btn.outerWidth(true);
                    var loginAreaWidth = $("#login-area").width();
                    var contWidth = container.width();
                    icon.css({
                        // 用户区域宽度加上按钮到其父标签右边距离
                        right: loginAreaWidth + contWidth - left - btnWidth / 2 - 20
                    });
                    var dataModule = findModule(moduleName);
                    DomListCont.show();
                    commonCloser.userCenterHandler();
                    // dom缓存
                    if (_.indexOf(loadedModules, moduleName) < 0) {
                        dataModule.get(function(data) {
                            var listCont = DomListCont.find("div[data-module=" + moduleName + "] div");
                            if (data.length) {
                                // 增加显示所需内容
                                videoDataFilter(data, moduleName);
                                // 渲染页面
                                render(listCont, data);
                                // 自定义滚动轴
                                listCont.ppScroller({
                                    maxHeight: parseInt(listCont.attr("data-scroller-height")) || 320
                                }).scroll();
                            } else {
                                listCont.html(noDataHTML[i]);
                            }
                            // 记录已加载module
                            loadedModules.push(moduleName);
                        }, function(n) {
                            return -parseInt(n._mt);
                        });
                    }
                }
            }, 300);
            var hideHandler = function(i) {
                if (lock) return;
                tabCont.find("li").removeClass("now");
                DomListCont.hide();
                DomLists.hide();
            };
            var hide = delay(hideHandler, 250);
            commonCloser.history = hide;
            commonCloser.historyHandler = hideHandler;
            var render = function(listCont, data) {
                var HTMLlist = [ [], [], [], [] ];
                var now = new Date();
                _.each(data, function(n) {
                    var curDate = new Date(parseInt(n._mt.slice(0, 13)));
                    var diff = dateDiff("d", curDate, now);
                    var ht = [];
                    var pid = "pid_" + n.Id + "_" + parseInt(Math.random() * 100);
                    var id = n.index || n.Id || n.SubId;
                    ht.push(n._isCurrent ? '<li id="' + pid + '">' + '<a href="javascript:;" title="' + (n.SubName || n.Name) + '" target="_blank">' + (n.SubName || n.Name) + "</a>" + '<span class="progress">' + '<a href="javascript:;" title="">正在播放</a>' + '<a href="javascript:;" title="" class="display close" data-id="' + id + '" data-pid="' + pid + '" data-type="' + n._moduleName + '">&times;</a>' + "</span></li>" : '<li id="' + pid + '">' + '<a href="' + n._link + '" title="' + (n.SubName || n.Name) + '" target="_blank">' + (n.SubName || n.Name) + "</a>" + '<span class="progress">' + '<a href="javascript:;" title="">' + n._progress + "</a>" + '<a href="' + n._link + '" title="" class="display">' + (n._watchEnd ? "重播" : "续播") + "</a>" + '<a href="javascript:;" title="" class="display close" data-id="' + id + '" data-pid="' + pid + '" data-type="' + n._moduleName + '">&times;</a>' + "</span></li>");
                    if (diff == 0) {
                        HTMLlist[0].push(ht);
                    } else if (diff == 1) {
                        HTMLlist[1].push(ht);
                    } else if (diff < 7) {
                        HTMLlist[2].push(ht);
                    } else {
                        HTMLlist[3].push(ht);
                    }
                });
                var html = [ "<dl>" ], tag = [ "今天", "昨天", "一周内", "更早" ];
                _.each(HTMLlist, function(n, i) {
                    if (n.length) {
                        html.push("<dt>" + tag[i] + "</dt><dd><ul>");
                        n.length && html.push(n.join(""));
                        html.push('<i class="ui-line"></i></ul></dd>');
                    }
                });
                html.push("</dl>");
                listCont.empty().append(html.join(""));
            };
            /* 简单处理，解决移动端连续点击只触发一次 */
            if (!webcfg.isMobile) {
                tabCont.on("mouseenter", "li", function(e) {
                    var me = $(this);
                    // 上传按钮不能阻止层的关闭
                    if (me.index() < 2) {
                        lock = true;
                    }
                    commonCloser.userCenter.cancel();
                    show(me.index(), me.find("a").attr("data-module"));
                }).on("mouseleave", "li", function() {
                    lock = false;
                    commonCloser.userCenter();
                    show.cancel();
                    hide();
                });
            } else {
                var lShowLayer;
                var showLayer = false;
                tabCont.on("click", "li", function(e) {
                    if (!showLayer || lShowLayer != this) {
                        var me = $(this);
                        // 上传按钮不能阻止层的关闭
                        if (me.index() < 2) {
                            lock = true;
                        }
                        show(me.index(), me.find("a").attr("data-module"));
                        showLayer = 1;
                        lShowLayer = this;
                    } else {
                        lock = false;
                        show.cancel();
                        hide();
                        showLayer = 0;
                    }
                });
            }
            DomListCont.on("mouseenter", function() {
                hide.cancel();
            }).on("mouseleave", function() {
                hide();
            }).on("dblclick", function(e) {
                lock = !lock;
            });
            var lastLi;
            DomListCont.find("div.history").on("mouseenter", "li", function(e) {
                lastLi && lastLi.removeClass("hover");
                lastLi = $(this).addClass("hover");
            }).on("mouseleave", "li", function(e) {
                lastLi.removeClass("hover");
            }).on("click", "a.close", function(e) {
                var id = this.getAttribute("data-id");
                var pid = this.getAttribute("data-pid");
                var moduleName = this.getAttribute("data-type");
                var btn = $(this);
                findModule(moduleName).del(id, function(d) {
                    $("#" + pid).fadeOut();
                }, function() {
                    alert("删除失败");
                });
            }).on("touchstart", function(e) {
                e.stopPropagation();
            });
            $.subscribe("closeAllLayout", function() {
                tabCont.find("li").removeClass("hover");
                DomListCont.hide();
            });
        })();
        (function() {
            var $loginArea = $("#login-area");
            var $areaLogin = $loginArea.find("div.logined");
            var $areaLogout = $loginArea.find("div.nologin");
            var $userDropdown = $loginArea.find("div.logined-drop");
            var $arrow = $loginArea.find(".arrow");
            var displayUserName;
            var delayLoader_userDetail = $.Callbacks();
            //一步读取内容
            var _lock = false;
            /* 登录、注册 */
            $areaLogout.find(".btn-login").on("click", function(e) {
                var type = $(this).attr("data-type") || "login";
                login.init({
                    type: type,
                    from: "web_topnav",
                    app: ""
                });
                cookie.set("userAutoLogin", "notAuto", 1 / 24 / 60 / 2, "pptv.com");
            });
            /* 登出 */
            $("#btn-user-logout").click(function() {
                user.logout();
                $userDropdown.trigger("close");
                try {
                    var uInfo = {};
                    if (webcfg.comment.tags.length > 0) {
                        uInfo.tags = webcfg.comment.tags.toString();
                    }
                    if (webcfg.comment.ids.length > 0) {
                        uInfo.ids = webcfg.comment.ids.toString();
                    }
                    player.setUserInfo(uInfo);
                } catch (e) {}
            });
            /* 渲染用户基本信息 */
            var renderHeaderUserInfo = function(info) {
                displayUserName = decodeURIComponent(info.Nickname || info.UserName || info.Email || "");
                var $userPic = $loginArea.find(".headpic img");
                $userPic.attr("src", webcfg.src_userPic + info.HeadPic).attr("title", displayUserName);
                var $userName = $loginArea.find(".username");
                $userName.html(displayUserName);
            };
            /* 渲染用户具体信息 */
            var renderHeaderUserDetail = function(detail, info) {
                var $icons = $loginArea.find(".user-icons");
                var getNextGradeLeave = (detail.gradeEnd - detail.userCredit + .01).toFixed(2);
                $icons.html('<img class="user-level-icon" src="' + (detail.gradePic || webcfg) + '" title="我的等级:' + detail.userGrade + "级 \n剩余升级天数:" + getNextGradeLeave + '天" />' + '<img src="http://static9.pplive.cn/pptv/pub/v_20130608151705/css/ic5.png" class="icon_up">' + userIcon(info.isVip));
                var $levelIcon = $loginArea.find("img.user-level-icon");
                detail.gradePic && $levelIcon.attr("src", detail.gradePic);
                // 积分、p币
                var $tScore = $loginArea.find("li.intergral span").html(detail.userAvailablePoint);
                delayLoader_userDetail.add(function() {
                    userDetail.getPb(function(amount) {
                        var $tPb = $loginArea.find("li.pb span").html(amount);
                    });
                });
                // 签到
                var $checkArea = $loginArea.find(".check");
                var checkInCount = 0, checked = true, leaveCount = 0;
                delayLoader_userDetail.add(function() {
                    checkIn.checkDay(function(result, count, leave) {
                        checkInCount = count;
                        leaveCount = leave;
                        if (result) {
                            checked = true;
                            $checkArea.find("a.count").html("已签到" + count + "天");
                            if (leave != 0) {
                                $checkArea.find("a.leave").html("本月可补签" + leave + "天");
                                $checkArea.addClass("checkleft");
                            }
                        } else {
                            checked = false;
                            $checkArea.removeClass("checked checkleft").find("a.count").html("签到赚积分");
                        }
                    });
                });
                var checkInHandler = function(e) {
                    if (checked) {
                        return;
                    }
                    checkIn.checkIn(function() {
                        $checkArea.addClass("checked").find("a.count").html("已签到" + ++checkInCount + "天");
                        checked = true;
                        if (leaveCount != 0) {
                            $checkArea.find("a.leave").html("本月可补签" + (leaveCount - 1) + "天");
                            $checkArea.addClass("checkleft");
                        }
                    });
                };
                $checkArea.on("click", "a.count", checkInHandler);
                // 等级icons
                // var $userLevel = $loginArea.find('.userlv .user-level').html(detail.userGrade);
                var $userGradeIcons = $loginArea.find(".userlv").html('LV：<a href="http://usergrowth.pptv.com/" target="_blank" class="user-level" title="我的等级:' + detail.userGrade + "级 \n剩余升级天数:" + getNextGradeLeave + '天">' + detail.userGrade + " " + getGradePics(detail.gradeMedal, detail.listGradeUrl)) + "</a>";
                // 等级天数
                var $userCredit = $loginArea.find("span.user-credit").html("活跃天数：" + detail.userCredit);
                var $userNextCreditLeft = $loginArea.find("span.user-next-credit-left").html("升级还需：" + getNextGradeLeave);
                // 等级天数进度
                var t;
                var tw = $loginArea.find("div.growdays").width();
                var max = detail.todayMaxCredit.toFixed(2), now = detail.todayObtainCredit.toFixed(2);
                var $line = $loginArea.find("span.grownow").css({
                    width: now / max * 100 + "%"
                });
                var $allDay = $loginArea.find("span.allday i").html(max);
                var $nowday = $loginArea.find("span.nowday").css({
                    left: (t = tw * now / max) > tw * .55 ? tw * .55 : t
                }).find("i").html(now);
                // 会员说明
                var ut = {
                    0: "注册用户",
                    1: "普通会员",
                    2: "年费会员"
                };
                var $userState = $loginArea.find("dd.userstate");
                $userState.find("span:eq(0)").html(ut[user.info.isVip] + userIcon(info.isVip));
                $userState.find("span:eq(1)").html(speedUpInfoText(user.info));
                (function() {
                    var userInfo = user.readInfo();
                    var vip = user.info.isVip != "0";
                    var privilege = {
                        noad: {
                            is: vip ? "true" : userInfo.IsNoad,
                            text: "免去视频播放贴片广告",
                            url: "http://viptv.pptv.com/privilege/pg_noad"
                        },
                        spdup: {
                            is: vip ? "true" : userInfo.IsSpdup,
                            text: "播放加速",
                            url: "http://viptv.pptv.com/privilege/pg_spdup"
                        },
                        rtmp: {
                            is: vip ? "true" : userInfo.IsRtmp,
                            text: "低延时直播",
                            url: "http://viptv.pptv.com/privilege/pg_rtmp"
                        },
                        ugspeed: {
                            is: vip ? "true" : userInfo.IsUgspeed,
                            text: "等级成长加速",
                            url: "http://viptv.pptv.com/privilege/pg_ug"
                        },
                        other: {
                            is: vip ? "true" : "false",
                            text: [ "免上传", "蓝光影片下载", "蓝光片库", "会员片库", "付费点播折扣", "专属超级表情" ],
                            url: "http://viptv.pptv.com/year_vip/"
                        }
                    };
                    $loginArea.find(".vipspc a").each(function(i, n) {
                        var arr = n.className.split(/\s/);
                        var name = $(n).attr("data-name") || "other";
                        var t = privilege[name];
                        if (t.is == "true") {
                            $(n).find("em").removeClass("ico-gray");
                        } else {
                            $(n).find("em").addClass("ico-gray");
                        }
                        $(n).attr({
                            href: t.url,
                            title: (name == "other" ? t.text[i - 4] : t.text) + (t.is == "true" ? "已开启" : "未开启")
                        });
                    });
                })();
            };
            /* 显示、影藏用户下拉事件 */
            var open = delay(function() {
                delayLoader_userDetail.fire();
                delayLoader_userDetail.empty();
                $userDropdown.show();
                commonCloser.historyHandler();
            }, 300), closeHandler = function() {
                if (_lock) return;
                $userDropdown.hide();
            }, close = delay(closeHandler, 250);
            commonCloser.userCenter = close;
            commonCloser.userCenterHandler = closeHandler;
            $userDropdown.on("open", function() {
                if (!user.isLogined) return;
                commonCloser.history.cancel();
                $loginArea.addClass("loginarea-hover");
                open();
                close.cancel();
            }).on("close", function() {
                $loginArea.removeClass("loginarea-hover");
                close();
                open.cancel();
                commonCloser.historyHandler();
            });
            $loginArea.on("mouseenter", function(e) {
                $userDropdown.trigger("open");
            }).on("mouseleave", function(e) {
                $userDropdown.trigger("close");
            }).on("touchstart", function(e) {
                e.stopPropagation();
            });
            $userDropdown.on("mouseenter", function(e) {
                $userDropdown.trigger("open");
            }).on("mouseleave", function(e) {
                $userDropdown.trigger("close");
            }).on("dblclick", function(e) {
                _lock = !_lock;
            }).on("touchstart", function(e) {
                e.stopPropagation();
            });
            $.subscribe("closeAllLayout", function() {
                $userDropdown.trigger("close");
            });
            /* 登录、登出绑定 */
            user_fix().onLogin(function(info) {
                //on login
                $areaLogin.show();
                $areaLogout.hide();
                renderHeaderUserInfo(info);
                userDetail.read(function(detail) {
                    detail.listGradeUrl = detail.listGradeUrl.reverse();
                    renderHeaderUserDetail(detail, info);
                });
                $arrow.show();
            }).onLogout(function() {
                //on logout
                $areaLogin.hide();
                $areaLogout.show();
                $arrow.hide();
            });
        })();
        (function() {
            if (smallHead) {
                return;
            }
            navType = {
                1: "电影",
                2: "电视剧",
                3: "动漫"
            };
            window.recommendShowed = false;
            window.circleshow = true;
            var timer, timer2;
            //判断是否有推荐
            var isRecommend = function(type) {
                if (navType[type] == "电影" || navType[type] == "电视剧" || navType[type] == "动漫") {
                    return true;
                }
                return false;
            };
            //加载iframe
            var loadFrame = function(type) {
                var frame = '<iframe src="http://pub.aplus.pptv.com/wwwpub/head/pg_recommend?navType=' + type + '" id="recommend_frame" frameborder="0" scrolling="no" width="100%" height="180px"></iframe>';
                $("#recommend").html(frame);
            };
            //记录展开状态
            var setState = function(show) {
                if (show) {
                    window.recommendShowed = show;
                } else {
                    window.recommendShowed = false;
                }
            };
            $("#header_nav .hd-nav a").mouseenter(function() {
                if (!circleshow) {
                    return;
                }
                clearTimeout(timer);
                $("#header_nav .hd-nav a i").removeClass("icon-tj");
                $(this).children("i").addClass("icon-tj");
            });
            $("#header_nav .hd-nav a").mouseleave(function() {
                if (!circleshow) {
                    return;
                }
                var el = this;
                timer = setTimeout(function() {
                    $(el).children("i").removeClass("icon-tj");
                }, 600);
            });
            $("#header_nav .hd-nav a i").click(function() {
                var type = $(this).parent("a").attr("channel");
                if (isRecommend(type) && type != recommendShowed) {
                    loadFrame(type);
                }
                return false;
            });
        })();
        (function() {
            if (smallHead) {
                return;
            }
            var subnav = $("#header_nav .hd-nav .hd-subnav");
            var more = subnav.children(".more");
            var morenav = subnav.children(".morenav");
            var pdview = $("#header_nav .hd-download #product-view");
            var pddrop = $("#header_nav .hd-download .pd-drop");
            var nav_change = function(className) {
                var bodyClass = $("body")[0].className.match(/grid-\d+/);
                var cn = className || (bodyClass ? bodyClass[0] : "");
                var nMax = 4;
                switch (cn) {
                  case "grid-1410":
                    nMax = 10;
                    break;

                  case "grid-1230":
                    nMax = 9;
                    break;

                  case "grid-1010":
                    nMax = 4;
                    break;

                  default:
                    nMax = 4;
                    break;
                }
                var n = subnav.children("a").length - 1;
                if (n > nMax) {
                    var links = subnav.children("a");
                    var l = n - nMax;
                    for (var i = 0; i <= l; i++) {
                        var li = document.createElement("li");
                        $(li).html(links[n - 1 - i]);
                        morenav.prepend($(li));
                    }
                } else if (n < nMax) {
                    var lists = morenav.children("li");
                    var l = lists.length + n <= nMax ? lists.length : nMax - n - 1;
                    for (var i = 0; i < l; i++) {
                        var a = $(lists[i]).children("a");
                        a.insertBefore(more);
                        $(lists[i]).remove();
                    }
                }
                if (morenav.children("li").length < 1) {
                    more.hide();
                } else {
                    more.show();
                }
            };
            $.subscribe1("onBodyResize", function(className) {
                nav_change(className);
            });
            $(document).ready(function() {
                nav_change();
            });
            var more_show = delay(function() {
                morenav.show();
                more.addClass("more-hover");
            }, 200);
            var more_hide = delay(function() {
                morenav.hide();
                more.removeClass("more-hover");
            }, 200);
            var pd_show = delay(function() {
                pdview.addClass("cur");
                pddrop.show();
                pddrop.addClass("pd-drop-shake");
            }, 200);
            var pd_hide = delay(function() {
                pdview.removeClass("cur");
                pddrop.hide();
                pddrop.removeClass("pd-drop-shake");
            }, 200);
            more.mouseenter(function() {
                more_show();
            }).mouseleave(function() {
                more_hide();
            });
            morenav.mouseenter(function() {
                more_hide.cancel();
            }).mouseleave(function() {
                more_hide();
            });
            pdview.mouseenter(function() {
                pd_show();
            }).mouseleave(function() {
                pd_hide();
            });
            pddrop.mouseenter(function() {
                pd_hide.cancel();
            }).mouseleave(function() {
                pd_hide();
            });
            $(window).on("scroll", function() {
                morenav.hide();
                pddrop.hide();
            });
        })();
        (function() {
            if (IE6 || smallHead) {
                return;
            }
            var previousScroll = 0;
            var key = true;
            var direction;
            var header = $(".g-1408-hd");
            var headHeight = header.height();
            var timer;
            function scrollDown(scrolltop) {
                if (scrolltop < headHeight || previousScroll > headHeight && direction == "down") {
                    return;
                }
                if (previousScroll < headHeight && scrolltop > headHeight) {
                    direction = "down";
                    header.css({
                        position: "fixed",
                        top: -headHeight
                    });
                    $("body").css({
                        "padding-top": headHeight
                    });
                    window.circleshow = false;
                }
                if (previousScroll > headHeight) {
                    direction = "down";
                    header.animate({
                        top: -headHeight
                    }, 300);
                }
            }
            function scrollUp(scrolltop) {
                if (previousScroll < headHeight || scrolltop > headHeight && direction == "up") {
                    return;
                }
                if (previousScroll > headHeight && scrolltop < headHeight) {
                    if (direction == "up") {
                        header.animate({
                            top: -scrolltop
                        }, 200, function() {
                            header.css({
                                top: 0,
                                position: "relative"
                            });
                            $("body").css({
                                "padding-top": 0
                            });
                            window.circleshow = true;
                        });
                    } else {
                        direction = "up";
                        header.animate({
                            top: -scrolltop
                        }, 200, function() {
                            header.css({
                                top: 0,
                                position: "relative"
                            });
                            $("body").css({
                                "padding-top": 0
                            });
                            window.circleshow = true;
                        });
                    }
                }
                if (scrolltop > headHeight) {
                    direction = "up";
                    header.animate({
                        top: 0
                    }, 300);
                }
            }
            $(window).scroll(function() {
                clearTimeout(timer);
                timer = setTimeout(function() {
                    var currentScroll = $(window).scrollTop();
                    if (previousScroll < currentScroll) {
                        scrollDown(currentScroll);
                    } else {
                        scrollUp(currentScroll);
                    }
                    previousScroll = currentScroll;
                }, 200);
            });
        })();
        (function() {
            if (!smallHead) {
                return;
            }
            var ch = $(".hd-s-nav .ui-icon-ch");
            var chdrop = $(".hd-s-nav .ch-drop");
            var dropshow = delay(function() {
                ch.addClass("ui-icon-ch-hover");
                chdrop.show();
            }, 300);
            var drophide = delay(function() {
                ch.removeClass("ui-icon-ch-hover");
                chdrop.hide();
            }, 300);
            ch.on("mouseenter", function() {
                drophide.cancel();
                dropshow();
            }).on("mouseleave", function() {
                dropshow.cancel();
                drophide();
            });
            chdrop.on("mouseenter", function() {
                drophide.cancel();
                dropshow();
            }).on("mouseleave", function() {
                dropshow.cancel();
                drophide();
            });
        })();
        (function() {
            var $wrap = $(".g-1408-hdtop .hd-recommend");
            var $inner = $(".g-1408-hdtop .hd-recommend .slide-wrap");
            var $lists = $wrap.find("a");
            if ($lists.length === 0 || $lists.length === 1) {
                return;
            }
            var width = $wrap.width();
            var len = $lists.length;
            function slide() {
                $($lists[len - 1]).fadeOut(function() {
                    $inner.prepend($lists[len - 1]);
                    $($lists[len - 1]).show();
                    $lists = $wrap.find("a");
                    setTimeout(function() {
                        slide();
                    }, 3e3);
                });
            }
            $inner.css("position", "relative");
            $lists.css({
                position: "absolute",
                top: "0px",
                left: "0px",
                width: width,
                overflow: "hidden"
            });
            setTimeout(function() {
                slide();
            }, 3e3);
        })();
    };
    // web端自动启动
    if (!webcfg.isClient) {
        webInit();
    }
    /* 业务逻辑 end*/
    var header = {
        playHistory: playhistory,
        favorite: favorite,
        recommend: recommend,
        clearCache: clearCache,
        userDetail: userDetail,
        cloudHistory: cloudhistory
    };
    /*数据模块end*/
    $("body").on("touchstart", function() {
        $.publish("closeAllLayout");
    });
    /*helper*/
    function dateDiff(interval, objDate1, objDate2) {
        var d = objDate1, i = {}, t = d.getTime(), t2 = objDate2.getTime();
        i["y"] = objDate2.getFullYear() - d.getFullYear();
        i["q"] = i["y"] * 4 + Math.floor(objDate2.getMonth() / 4) - Math.floor(d.getMonth() / 4);
        i["m"] = i["y"] * 12 + objDate2.getMonth() - d.getMonth();
        i["ms"] = objDate2.getTime() - d.getTime();
        i["w"] = Math.floor((t2 + 3456e5) / 6048e5) - Math.floor((t + 3456e5) / 6048e5);
        i["d"] = Math.floor(t2 / 864e5) - Math.floor(t / 864e5);
        i["h"] = Math.floor(t2 / 36e5) - Math.floor(t / 36e5);
        i["n"] = Math.floor(t2 / 6e4) - Math.floor(t / 6e4);
        i["s"] = Math.floor(t2 / 1e3) - Math.floor(t / 1e3);
        return i[interval];
    }
    function userIcon(vip) {
        var titleVip, titleYear;
        switch (vip) {
          case "0":
            titleVip = "您还不是PPTV会员，等级加速未开启";
            titleYear = "立即点亮年费会员，独享1.4倍等级加速";
            break;

          case "1":
            titleVip = "您是PPTV会员，等级加速1.2倍生效中";
            titleYear = "立即点亮年费会员，独享1.4倍等级加速";
            break;

          case "2":
            titleVip = "您是PPTV年费会员,等级加速1.4倍生效中";
            titleYear = "年费会员独享1.4倍等级加速";
            break;

          default:        }
        return '<a href="http://pay.vip.pptv.com/?plt=web&aid=wdh_vip" target="_blank" title="' + titleVip + '" class="ui-vip ' + (vip === "0" ? "ui-novip" : "") + '"></a>' + '<a href="http://pay.vip.pptv.com/?plt=web&aid=wdh_year" target="_blank" title="' + titleYear + '" class="ui-year ' + (vip === "2" ? "" : "ui-noyear") + '"></a>';
    }
    function getGradePics(gradeMedal, listGradeUrl) {
        var arr = gradeMedal.split(";");
        return _.map(arr, function(n, i) {
            var n = parseInt(n);
            if (n > 0) {
                var t = [], obj = listGradeUrl[i];
                while (n--) {
                    t.push('<img src="' + obj["gradeUrl"] + '" alt="" />\n');
                }
                return t.join("");
            }
            return "";
        }).join("");
    }
    function speedUpInfoText(UserInfo) {
        var s;
        if (UserInfo.isVip == 2) {
            s = "享受<i>1.4</i>倍等级加速中";
        } else if (UserInfo.isVip == 1) {
            s = "<i>1.2</i>倍等级加速中";
        } else if (UserInfo.isVip == 0 && UserInfo.IsUgspeed == "true") {
            s = "<i>1.2</i>倍等级加速中";
        } else if (UserInfo.isVip == 0) {
            s = "没有开启加速";
        }
        return s;
    }
    return header;
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

define("util/pub/checkin", [ "core/jquery/1.8.3/jquery", "util/loader/loader", "util/log/log", "util/platform/plt", "util/browser/browser", "util/net/urlquery", "util/user/user", "client", "util/cookie/cookie", "util/md5/md5" ], function(require, exports) {
    var $ = require("core/jquery/1.8.3/jquery"), loader = require("util/loader/loader"), user = require("util/user/user"), cookie = require("util/cookie/cookie"), md5 = require("util/md5/md5");
    var checkIn = {
        href: "http://api.usergrowth.pptv.com/",
        checkDay: function(cb, date) {
            if (!user.isLogined) {
                return;
            }
            var date = date || new Date(), year = date.getYear().toString(), month = date.getMonth() + 1;
            year = year.substring(year.length - 2);
            if (parseInt(month) < 10) {
                month = "0" + month;
            }
            loader.ajax({
                url: this.href + "pcardInfo/getMonthPcard",
                jsonpCallback: "getMonthPcard",
                data: {
                    username: user.info.UserName,
                    month: year + month,
                    from: "web",
                    version: "unknown",
                    format: "jsonp",
                    token: cookie.get("ppToken")
                }
            }).done(function(monthPcard) {
                if (monthPcard.flag === 0) {
                    var _date = date.getDate(), log = monthPcard.result.monthPcardLog, todayChecked = log.charAt(_date - 1) == "1";
                    cb && cb(todayChecked, monthPcard.result.conDays, monthPcard.result.leaveDays);
                }
            });
        },
        checkIn: function(cb) {
            var index = "";
            for (var i = 0; i < 6; i++) {
                var nu = Math.floor(Math.random() * 10);
                if (nu == 0) {
                    nu = 1;
                }
                index += nu;
            }
            var addstr = md5.hex_md5(encodeURIComponent(user.info.UserName + "$DAILY_PCARD$" + index));
            ajax({
                url: this.href + "doDailyPcard",
                jsonpCallback: "checkIn",
                data: {
                    username: user.info.UserName,
                    from: "web",
                    version: "unknown",
                    format: "jsonp",
                    token: cookie.get("ppToken"),
                    index: index,
                    addstr: addstr
                }
            }).done(function(data) {
                if (data.flag === 0) {
                    cb && cb();
                } else {
                    log("[checkIn.checkIn] error ", data);
                }
            });
        }
    };
    return checkIn;
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

define("util/md5/md5", [], function(require) {
    /*
 * A JavaScript implementation of the RSA Data Security, Inc. MD5 Message
 * Digest Algorithm, as defined in RFC 1321.
 * Version 2.2 Copyright (C) Paul Johnston 1999 - 2009
 * Other contributors: Greg Holt, Andrew Kepert, Ydnar, Lostinet
 * Distributed under the BSD License
 * See http://pajhome.org.uk/crypt/md5 for more info.
 */
    /*
 * Configurable variables. You may need to tweak these to be compatible with
 * the server-side, but the defaults work in most cases.
 */
    var hexcase = 0;
    /* hex output format. 0 - lowercase; 1 - uppercase        */
    var b64pad = "";
    /* base-64 pad character. "=" for strict RFC compliance   */
    /*
 * These are the functions you'll usually want to call
 * They take string arguments and return either hex or base-64 encoded strings
 */
    function hex_md5(s) {
        return rstr2hex(rstr_md5(str2rstr_utf8(s)));
    }
    function b64_md5(s) {
        return rstr2b64(rstr_md5(str2rstr_utf8(s)));
    }
    function any_md5(s, e) {
        return rstr2any(rstr_md5(str2rstr_utf8(s)), e);
    }
    function hex_hmac_md5(k, d) {
        return rstr2hex(rstr_hmac_md5(str2rstr_utf8(k), str2rstr_utf8(d)));
    }
    function b64_hmac_md5(k, d) {
        return rstr2b64(rstr_hmac_md5(str2rstr_utf8(k), str2rstr_utf8(d)));
    }
    function any_hmac_md5(k, d, e) {
        return rstr2any(rstr_hmac_md5(str2rstr_utf8(k), str2rstr_utf8(d)), e);
    }
    /*
 * Perform a simple self-test to see if the VM is working
 */
    function md5_vm_test() {
        return hex_md5("abc").toLowerCase() == "900150983cd24fb0d6963f7d28e17f72";
    }
    /*
 * Calculate the MD5 of a raw string
 */
    function rstr_md5(s) {
        return binl2rstr(binl_md5(rstr2binl(s), s.length * 8));
    }
    /*
 * Calculate the HMAC-MD5, of a key and some data (raw strings)
 */
    function rstr_hmac_md5(key, data) {
        var bkey = rstr2binl(key);
        if (bkey.length > 16) bkey = binl_md5(bkey, key.length * 8);
        var ipad = Array(16), opad = Array(16);
        for (var i = 0; i < 16; i++) {
            ipad[i] = bkey[i] ^ 909522486;
            opad[i] = bkey[i] ^ 1549556828;
        }
        var hash = binl_md5(ipad.concat(rstr2binl(data)), 512 + data.length * 8);
        return binl2rstr(binl_md5(opad.concat(hash), 512 + 128));
    }
    /*
 * Convert a raw string to a hex string
 */
    function rstr2hex(input) {
        try {
            hexcase;
        } catch (e) {
            hexcase = 0;
        }
        var hex_tab = hexcase ? "0123456789ABCDEF" : "0123456789abcdef";
        var output = "";
        var x;
        for (var i = 0; i < input.length; i++) {
            x = input.charCodeAt(i);
            output += hex_tab.charAt(x >>> 4 & 15) + hex_tab.charAt(x & 15);
        }
        return output;
    }
    /*
 * Convert a raw string to a base-64 string
 */
    function rstr2b64(input) {
        try {
            b64pad;
        } catch (e) {
            b64pad = "";
        }
        var tab = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
        var output = "";
        var len = input.length;
        for (var i = 0; i < len; i += 3) {
            var triplet = input.charCodeAt(i) << 16 | (i + 1 < len ? input.charCodeAt(i + 1) << 8 : 0) | (i + 2 < len ? input.charCodeAt(i + 2) : 0);
            for (var j = 0; j < 4; j++) {
                if (i * 8 + j * 6 > input.length * 8) output += b64pad; else output += tab.charAt(triplet >>> 6 * (3 - j) & 63);
            }
        }
        return output;
    }
    /*
 * Convert a raw string to an arbitrary string encoding
 */
    function rstr2any(input, encoding) {
        var divisor = encoding.length;
        var i, j, q, x, quotient;
        /* Convert to an array of 16-bit big-endian values, forming the dividend */
        var dividend = Array(Math.ceil(input.length / 2));
        for (i = 0; i < dividend.length; i++) {
            dividend[i] = input.charCodeAt(i * 2) << 8 | input.charCodeAt(i * 2 + 1);
        }
        /*
   * Repeatedly perform a long division. The binary array forms the dividend,
   * the length of the encoding is the divisor. Once computed, the quotient
   * forms the dividend for the next step. All remainders are stored for later
   * use.
   */
        var full_length = Math.ceil(input.length * 8 / (Math.log(encoding.length) / Math.log(2)));
        var remainders = Array(full_length);
        for (j = 0; j < full_length; j++) {
            quotient = Array();
            x = 0;
            for (i = 0; i < dividend.length; i++) {
                x = (x << 16) + dividend[i];
                q = Math.floor(x / divisor);
                x -= q * divisor;
                if (quotient.length > 0 || q > 0) quotient[quotient.length] = q;
            }
            remainders[j] = x;
            dividend = quotient;
        }
        /* Convert the remainders to the output string */
        var output = "";
        for (i = remainders.length - 1; i >= 0; i--) output += encoding.charAt(remainders[i]);
        return output;
    }
    /*
 * Encode a string as utf-8.
 * For efficiency, this assumes the input is valid utf-16.
 */
    function str2rstr_utf8(input) {
        var output = "";
        var i = -1;
        var x, y;
        while (++i < input.length) {
            /* Decode utf-16 surrogate pairs */
            x = input.charCodeAt(i);
            y = i + 1 < input.length ? input.charCodeAt(i + 1) : 0;
            if (55296 <= x && x <= 56319 && 56320 <= y && y <= 57343) {
                x = 65536 + ((x & 1023) << 10) + (y & 1023);
                i++;
            }
            /* Encode output as utf-8 */
            if (x <= 127) output += String.fromCharCode(x); else if (x <= 2047) output += String.fromCharCode(192 | x >>> 6 & 31, 128 | x & 63); else if (x <= 65535) output += String.fromCharCode(224 | x >>> 12 & 15, 128 | x >>> 6 & 63, 128 | x & 63); else if (x <= 2097151) output += String.fromCharCode(240 | x >>> 18 & 7, 128 | x >>> 12 & 63, 128 | x >>> 6 & 63, 128 | x & 63);
        }
        return output;
    }
    /*
 * Encode a string as utf-16
 */
    function str2rstr_utf16le(input) {
        var output = "";
        for (var i = 0; i < input.length; i++) output += String.fromCharCode(input.charCodeAt(i) & 255, input.charCodeAt(i) >>> 8 & 255);
        return output;
    }
    function str2rstr_utf16be(input) {
        var output = "";
        for (var i = 0; i < input.length; i++) output += String.fromCharCode(input.charCodeAt(i) >>> 8 & 255, input.charCodeAt(i) & 255);
        return output;
    }
    /*
 * Convert a raw string to an array of little-endian words
 * Characters >255 have their high-byte silently ignored.
 */
    function rstr2binl(input) {
        var output = Array(input.length >> 2);
        for (var i = 0; i < output.length; i++) output[i] = 0;
        for (var i = 0; i < input.length * 8; i += 8) output[i >> 5] |= (input.charCodeAt(i / 8) & 255) << i % 32;
        return output;
    }
    /*
 * Convert an array of little-endian words to a string
 */
    function binl2rstr(input) {
        var output = "";
        for (var i = 0; i < input.length * 32; i += 8) output += String.fromCharCode(input[i >> 5] >>> i % 32 & 255);
        return output;
    }
    /*
 * Calculate the MD5 of an array of little-endian words, and a bit length.
 */
    function binl_md5(x, len) {
        /* append padding */
        x[len >> 5] |= 128 << len % 32;
        x[(len + 64 >>> 9 << 4) + 14] = len;
        var a = 1732584193;
        var b = -271733879;
        var c = -1732584194;
        var d = 271733878;
        for (var i = 0; i < x.length; i += 16) {
            var olda = a;
            var oldb = b;
            var oldc = c;
            var oldd = d;
            a = md5_ff(a, b, c, d, x[i + 0], 7, -680876936);
            d = md5_ff(d, a, b, c, x[i + 1], 12, -389564586);
            c = md5_ff(c, d, a, b, x[i + 2], 17, 606105819);
            b = md5_ff(b, c, d, a, x[i + 3], 22, -1044525330);
            a = md5_ff(a, b, c, d, x[i + 4], 7, -176418897);
            d = md5_ff(d, a, b, c, x[i + 5], 12, 1200080426);
            c = md5_ff(c, d, a, b, x[i + 6], 17, -1473231341);
            b = md5_ff(b, c, d, a, x[i + 7], 22, -45705983);
            a = md5_ff(a, b, c, d, x[i + 8], 7, 1770035416);
            d = md5_ff(d, a, b, c, x[i + 9], 12, -1958414417);
            c = md5_ff(c, d, a, b, x[i + 10], 17, -42063);
            b = md5_ff(b, c, d, a, x[i + 11], 22, -1990404162);
            a = md5_ff(a, b, c, d, x[i + 12], 7, 1804603682);
            d = md5_ff(d, a, b, c, x[i + 13], 12, -40341101);
            c = md5_ff(c, d, a, b, x[i + 14], 17, -1502002290);
            b = md5_ff(b, c, d, a, x[i + 15], 22, 1236535329);
            a = md5_gg(a, b, c, d, x[i + 1], 5, -165796510);
            d = md5_gg(d, a, b, c, x[i + 6], 9, -1069501632);
            c = md5_gg(c, d, a, b, x[i + 11], 14, 643717713);
            b = md5_gg(b, c, d, a, x[i + 0], 20, -373897302);
            a = md5_gg(a, b, c, d, x[i + 5], 5, -701558691);
            d = md5_gg(d, a, b, c, x[i + 10], 9, 38016083);
            c = md5_gg(c, d, a, b, x[i + 15], 14, -660478335);
            b = md5_gg(b, c, d, a, x[i + 4], 20, -405537848);
            a = md5_gg(a, b, c, d, x[i + 9], 5, 568446438);
            d = md5_gg(d, a, b, c, x[i + 14], 9, -1019803690);
            c = md5_gg(c, d, a, b, x[i + 3], 14, -187363961);
            b = md5_gg(b, c, d, a, x[i + 8], 20, 1163531501);
            a = md5_gg(a, b, c, d, x[i + 13], 5, -1444681467);
            d = md5_gg(d, a, b, c, x[i + 2], 9, -51403784);
            c = md5_gg(c, d, a, b, x[i + 7], 14, 1735328473);
            b = md5_gg(b, c, d, a, x[i + 12], 20, -1926607734);
            a = md5_hh(a, b, c, d, x[i + 5], 4, -378558);
            d = md5_hh(d, a, b, c, x[i + 8], 11, -2022574463);
            c = md5_hh(c, d, a, b, x[i + 11], 16, 1839030562);
            b = md5_hh(b, c, d, a, x[i + 14], 23, -35309556);
            a = md5_hh(a, b, c, d, x[i + 1], 4, -1530992060);
            d = md5_hh(d, a, b, c, x[i + 4], 11, 1272893353);
            c = md5_hh(c, d, a, b, x[i + 7], 16, -155497632);
            b = md5_hh(b, c, d, a, x[i + 10], 23, -1094730640);
            a = md5_hh(a, b, c, d, x[i + 13], 4, 681279174);
            d = md5_hh(d, a, b, c, x[i + 0], 11, -358537222);
            c = md5_hh(c, d, a, b, x[i + 3], 16, -722521979);
            b = md5_hh(b, c, d, a, x[i + 6], 23, 76029189);
            a = md5_hh(a, b, c, d, x[i + 9], 4, -640364487);
            d = md5_hh(d, a, b, c, x[i + 12], 11, -421815835);
            c = md5_hh(c, d, a, b, x[i + 15], 16, 530742520);
            b = md5_hh(b, c, d, a, x[i + 2], 23, -995338651);
            a = md5_ii(a, b, c, d, x[i + 0], 6, -198630844);
            d = md5_ii(d, a, b, c, x[i + 7], 10, 1126891415);
            c = md5_ii(c, d, a, b, x[i + 14], 15, -1416354905);
            b = md5_ii(b, c, d, a, x[i + 5], 21, -57434055);
            a = md5_ii(a, b, c, d, x[i + 12], 6, 1700485571);
            d = md5_ii(d, a, b, c, x[i + 3], 10, -1894986606);
            c = md5_ii(c, d, a, b, x[i + 10], 15, -1051523);
            b = md5_ii(b, c, d, a, x[i + 1], 21, -2054922799);
            a = md5_ii(a, b, c, d, x[i + 8], 6, 1873313359);
            d = md5_ii(d, a, b, c, x[i + 15], 10, -30611744);
            c = md5_ii(c, d, a, b, x[i + 6], 15, -1560198380);
            b = md5_ii(b, c, d, a, x[i + 13], 21, 1309151649);
            a = md5_ii(a, b, c, d, x[i + 4], 6, -145523070);
            d = md5_ii(d, a, b, c, x[i + 11], 10, -1120210379);
            c = md5_ii(c, d, a, b, x[i + 2], 15, 718787259);
            b = md5_ii(b, c, d, a, x[i + 9], 21, -343485551);
            a = safe_add(a, olda);
            b = safe_add(b, oldb);
            c = safe_add(c, oldc);
            d = safe_add(d, oldd);
        }
        return Array(a, b, c, d);
    }
    /*
 * These functions implement the four basic operations the algorithm uses.
 */
    function md5_cmn(q, a, b, x, s, t) {
        return safe_add(bit_rol(safe_add(safe_add(a, q), safe_add(x, t)), s), b);
    }
    function md5_ff(a, b, c, d, x, s, t) {
        return md5_cmn(b & c | ~b & d, a, b, x, s, t);
    }
    function md5_gg(a, b, c, d, x, s, t) {
        return md5_cmn(b & d | c & ~d, a, b, x, s, t);
    }
    function md5_hh(a, b, c, d, x, s, t) {
        return md5_cmn(b ^ c ^ d, a, b, x, s, t);
    }
    function md5_ii(a, b, c, d, x, s, t) {
        return md5_cmn(c ^ (b | ~d), a, b, x, s, t);
    }
    /*
 * Add integers, wrapping at 2^32. This uses 16-bit operations internally
 * to work around bugs in some JS interpreters.
 */
    function safe_add(x, y) {
        var lsw = (x & 65535) + (y & 65535);
        var msw = (x >> 16) + (y >> 16) + (lsw >> 16);
        return msw << 16 | lsw & 65535;
    }
    /*
 * Bitwise rotate a 32-bit number to the left.
 */
    function bit_rol(num, cnt) {
        return num << cnt | num >>> 32 - cnt;
    }
    return {
        hex_md5: hex_md5
    };
});

define("util/pub/user-data", [ "core/jquery/1.8.3/jquery", "util/user/user-fix", "util/user/user", "client", "util/cookie/cookie", "util/loader/loader", "util/log/log", "util/platform/plt", "util/browser/browser", "util/net/urlquery", "util/pub/history", "util/json/json", "util/pub/puid", "core/underscore/1.8.3/underscore" ], function(require, exports) {
    var $ = require("core/jquery/1.8.3/jquery"), user_fix = require("util/user/user-fix"), user = require("util/user/user"), loader = require("util/loader/loader"), cookie = require("util/cookie/cookie"), history = require("util/pub/history"), _ = require("core/underscore/1.8.3/underscore"), JSON = require("util/json/json");
    var webcfg = window.webcfg || {};
    var FROM = webcfg.isClient ? "clt" : "web";
    /*数据模块start*/
    //播放记录
    var playhistorySync = {
        api: "http://sync.pptv.com/v6/",
        errData: {
            200: "成功",
            304: "成功",
            401: "权限出错",
            404: "资源不存在",
            422: "参数或内容不可处理",
            500: "系统内部错误"
        },
        getUserName: function(username) {
            var _username = username || user.info.UserName;
            return _username;
        },
        getUrl: function(params) {
            var _url = this.api + this.getUserName(params.username) + "/";
            if (!params.type) {
                log("type can not be null!");
                return false;
            }
            _url += params.type + "/";
            if (params.cid) {
                _url += params.cid + "/";
            }
            log("_url : >>> ", _url);
            return _url += "?";
        },
        go: function(params, callback) {
            if (!this.getUserName(params.username)) {
                log("Not Login!");
                return false;
            }
            if (webcfg && webcfg.IsCloudOpen === false) {
                log("由于接口有问题，云同步已经关闭....", webcfg.IsCloudOpen);
                return false;
            }
            return loader.ajax({
                url: this.getUrl(params),
                data: params.parms
            }).done(function(d) {
                log("Data >>>>", d);
                if (callback && typeof callback == "function") {
                    callback.apply(null, arguments);
                }
            });
        }
    };
    var playhistory = {
        get: function(callback, sort) {
            // 取缓存
            if (this._cache_playhistory) {
                callback(this._cache_playhistory);
                return;
            }
            if (user.isLogined) {
                playhistorySync.go({
                    type: "Recent",
                    parms: {
                        from: FROM,
                        tk: cookie.get("ppToken") || ""
                    }
                }).done(function(data) {
                    // data = {0:{}, 1:{}}
                    playhistory._cache_playhistory = typeof sort === "function" ? _.sortBy(_.toArray(data), sort) : _.toArray(data);
                    callback && callback(playhistory._cache_playhistory);
                });
            } else {
                history.PlayHistory.get(function(data) {
                    /*
                    data = {error: 0, message: "操作成功", value: [
                        index: 0
                        value: "{"Id":8006303,"SubId":17413248,"Name":"哎哟好正点-20140707-第四期","Pos":91,"Duration":"3012","link":"gHLeXSpmjMotqxM","VideoType":3,"_mt":"1404895274103"}"
                    ]}
                    */
                    if (!data.error) {
                        var ndata;
                        if (data.value && data.value.length) {
                            ndata = _.map(data.value, function(n) {
                                var t = $.parseJSON(n.value);
                                t.index = n.index;
                                return t;
                            });
                        }
                        playhistory._cache_playhistory = typeof sort === "function" ? _.sortBy(ndata, sort) : ndata;
                        callback && callback(playhistory._cache_playhistory);
                    } else {
                        log(data.message);
                        callback && callback([]);
                    }
                });
            }
        },
        delCache: function() {
            this._cache_playhistory = null;
        },
        del: function(id, success, fail) {
            var cache = this._cache_playhistory, index = -1;
            if (cache) {
                $.each(cache, function(i, n) {
                    // Id || SubId || index
                    if (n && (n.Id == id || n.index == id || n.SubId == id)) {
                        index = i;
                        return false;
                    }
                });
                if (index !== -1 && cache[index]) {
                    if (user.isLogined) {
                        playhistorySync.go({
                            type: "Recent",
                            cid: id,
                            parms: {
                                _method: "delete",
                                from: FROM,
                                tk: cookie.get("ppToken") || ""
                            }
                        }).done(function(d) {
                            if (d && (d.errCode == 200 || d.errCode == 304)) {
                                success && success(d);
                                delete cache[index];
                            } else {
                                log("[remove playhistory error]", d);
                                fail && fail(d);
                            }
                        });
                    } else {
                        history.PlayHistory.remove(id, function(d) {
                            if (d && d.error === 0) {
                                success && success(d);
                                delete cache[index];
                            } else {
                                log("[remove playhistory error]", d);
                                fail && fail(d);
                            }
                        });
                    }
                }
            }
        }
    };
    //云播播放记录
    var cloudhistory = {
        get: function(callback, sort) {
            if (this._cache_cloudhistory) {
                callback(this._cache_cloudhistory);
                return;
            }
            if (user.isLogined) {
                playhistorySync.go({
                    type: "CpRecent",
                    parms: {
                        from: FROM,
                        tk: cookie.get("ppToken") || ""
                    }
                }).done(function(data) {
                    cloudhistory._cache_cloudhistory = typeof sort === "function" ? _.sortBy(_.toArray(data), sort) : _.toArray(data);
                    callback && callback(cloudhistory._cache_cloudhistory);
                });
            }
        }
    };
    var favorite = {
        get: function(callback, sort) {
            // 取缓存
            var cache;
            if (this._cache_favorite) {
                callback(this._cache_favorite);
                return;
            }
            if (user.isLogined) {
                playhistorySync.go({
                    type: "Favorites",
                    parms: {
                        from: FROM,
                        tk: cookie.get("ppToken") || ""
                    }
                }).done(function(data) {
                    // data = {0:{}, 1:{}}
                    favorite._cache_favorite = typeof sort === "function" ? _.sortBy(_.toArray(data), sort) : _.toArray(data);
                    callback && callback(favorite._cache_favorite);
                });
            } else {
                // 未登录用户没有收藏功能
                callback && callback([]);
            }
        },
        set: function(id, success, fail) {
            var FavoriteObject = {
                Id: id,
                Pos: 0
            };
            playhistorySync.go({
                type: "Favorites",
                cid: id,
                parms: {
                    from: "web",
                    _method: "post",
                    _json: decodeURIComponent(JSON.stringify(FavoriteObject)),
                    tk: cookie.get("ppToken") || ""
                }
            }, function(d) {
                favorite._cache_favorite.push({
                    Id: id
                });
                success && success(d);
            }, null, function() {
                fail && fail();
            });
        },
        delCache: function() {
            this._cache_favorite = null;
        },
        del: function(id, success, fail) {
            var cache = this._cache_favorite, index = -1;
            if (cache) {
                $.each(cache, function(i, n) {
                    if (n && n.Id === id) {
                        index = i;
                        return false;
                    }
                });
                if (index !== -1 && cache[index]) {
                    if (user.isLogined) {
                        playhistorySync.go({
                            type: "Favorites",
                            cid: cache[index].Id,
                            parms: {
                                _method: "delete",
                                from: FROM,
                                tk: cookie.get("ppToken") || ""
                            }
                        }).done(function(d) {
                            if (d && (d.errCode == 200 || d.errCode == 304)) {
                                success && success(d);
                                delete cache[index];
                            } else {
                                log("[remove favorites error]", d);
                                fail && fail(d);
                            }
                        });
                    }
                }
            }
        }
    };
    var recommend = {
        get: function(callback, sort) {
            // 取缓存
            var cache;
            if (this._cache_recommend) {
                callback(this._cache_recommend, recommend._cache_uuid);
                return;
            }
            var option = {
                params: {}
            };
            if (typeof sort != "function") {
                option = sort;
                sort = option.sort;
            }
            $.extend(option.params, {
                format: "jsonp",
                callback: "getRec"
            });
            /*文档地址：http://sharepoint/tech/datadivision/Shared%20Documents/Forms/AllItems.aspx?RootFolder=%2Ftech%2Fdatadivision%2FShared%20Documents%2Frecommend&FolderCTID=0x012000C0777BE34EFFDB41A199ECB0A77193B9&View={AB4A77E1-A2B8-4E2D-B0AD-136B7CDAAF4E}*/
            /*原接口：http://svcdn.pptv.com/show/v1/recommend.json?cb=getRec&long_video=1&ppi=302c32&num=30*/
            /*
            --- params -----
            参数                               = 网站/客户端
            appplt[*产品线]                    = ikan/client
            appid[*&产品线id]                  = 111/110
            appver[产品版本]                   = 1.0/1.0
            src[*&产品线]                      = 71/63
            video[频道id]                      = null
            uid[用户id]                        = username || uid
            num[返回数量]                      = 18
            area[地域屏蔽]                     = P
            userLevel[??]                      = 0
            vipUser[用户等级0|1]               = 0
            removeVideoIds[要过滤的频道ID列表] =
            extraFields[返回域]                =all
            format                             =jsonp
            callback                           =func
            */
            loader.ajax({
                url: "http://api.v.pptv.com/api/pg_recommend?",
                jsonpCallback: "getRec",
                data: option.params
            }).done(function(data) {
                if (!data.error) {
                    var urlFormat = data.data.urlFormat, picUrlFormat = data.data.picUrlFormat;
                    recommend._cache_uuid = data.requestUUID;
                    recommend._cache_recommend = typeof sort === "function" ? _.sortBy(data.videos, sort) : _.toArray(data.videos);
                    _.map(recommend._cache_recommend, function(n) {
                        n.id = n.pic;
                        n.pic = picUrlFormat.replace("[PIC]", n.pic).replace("[SN]", n.sn);
                        n.url = urlFormat.replace("[URL]", n.url);
                        return n;
                    });
                    callback && callback(recommend._cache_recommend, recommend._cache_uuid);
                } else {
                    log("load http://recommend.pptv.com/recommend error!", data);
                }
            });
        }
    };
    // 清缓存
    var clearCache = function() {
        playhistory._cache_playhistory = null;
        favorite._cache_favorite = null;
        recommend._cache_recommend = null;
    };
    user_fix().onLogin(clearCache).onLogout(clearCache);
    var userDetail = {
        read: function(callback) {
            var self = this;
            var detail = this.detail = {};
            var cb = callback || function() {};
            this.load = false;
            if (!this.load) {
                if (!user.isLogined) {
                    return;
                }
                loader.ajax({
                    url: "http://api.usergrowth.pptv.com/getUserBilling?",
                    data: {
                        username: user.info.UserName,
                        from: "web",
                        format: "jsonp",
                        token: cookie.get("ppToken") || ""
                    }
                }).done(function(data) {
                    if (!data.flag) {
                        self.load = true;
                        self.data = data.result;
                        callback && callback(data.result);
                    }
                });
            } else {
                cb(this.data);
            }
        },
        getPb: function(callback) {
            var UserInfo = user.info;
            loader.ajax({
                url: "http://pb.pptv.com/getmemberinfo?",
                data: {
                    username: UserInfo.UserName,
                    token: cookie.get("ppToken") || "",
                    format: "jsonp"
                }
            }).done(function(d) {
                var msg = {
                    "1": "decode token exception",
                    "2": "token content illegal",
                    "3": "token expired",
                    "4": "username not match",
                    "5": "get pb member exception"
                };
                if (d.errcode === 0) {
                    callback && callback(d.pbamount);
                } else {
                    log("pb -> getmemberinfo", d.errcode, msg[d.errcode]);
                }
            });
        },
        clear: function() {
            self.load = false;
            self.data = {};
        }
    };
    /*数据模块end*/
    return {
        playhistory: playhistory,
        PlayHistory: playhistorySync,
        favorite: favorite,
        recommend: recommend,
        clearCache: clearCache,
        userDetail: userDetail,
        cloudhistory: cloudhistory
    };
});

/**
 * @author  Erick Song
 * @date    2012-08-30
 * @email   ahschl0322@gmail.com
 * @info    网站历史记录功能
 *
 */
define("util/pub/history", [ "core/jquery/1.8.3/jquery", "util/json/json", "util/log/log", "util/pub/puid", "util/cookie/cookie" ], function(require) {
    var $ = require("core/jquery/1.8.3/jquery"), JSON = require("util/json/json"), log = require("util/log/log"), puid = require("util/pub/puid");
    puid.getPuid(function(_puid) {
        puid = _puid;
    });
    var History = {
        load: function(action, params, callback, domain) {
            var parsList = [], item, url = "http://" + (typeof domain == "undefined" ? "c1" : domain) + ".pptv.com/stg/";
            log(action, " : ", params);
            $.ajax({
                dataType: "jsonp",
                type: "GET",
                url: url + action + "?" + $.param(params),
                jsonp: "cb",
                data: {
                    format: "jsonp"
                },
                //cache : false,
                success: function(data) {
                    if (data && data.error === 0) {
                        if (callback && typeof callback == "function") {
                            callback.apply(null, arguments);
                        }
                    }
                }
            });
        },
        set: function(params, callback) {
            this.load("set", params, callback);
        },
        get: function(params, callback) {
            this.load("get", params, callback);
        },
        add: function(params, callback) {
            this.load("add", params, callback);
        },
        remove: function(params, callback) {
            this.load("remove", params, callback);
        },
        clear: function(key, callback) {
            this.load("set", {
                key: key,
                value: "",
                expire: 0
            }, callback);
        }
    };
    var PlayHistory = {
        key: "play_history",
        expire: 365 * 24 * 60 * 60,
        max: 8,
        set: function(value, callback) {
            if (!isArray(value)) {
                value = [ value ];
            }
            for (var i = 0, l = value.length; i < l; i++) {
                value[i] = $.JSON.encode(value[i]);
            }
            History.set({
                key: this.key,
                value: value,
                expire: this.expire,
                max_len: this.max
            }, callback);
        },
        get: function(callback) {
            History.get({
                key: this.key,
                max_len: this.max
            }, callback);
        },
        add: function(value, callback) {
            History.add({
                key: this.key,
                value: JSON.stringify(value),
                expire: this.expire,
                ut: 1,
                //去除已存在的，追加新的记录
                max_len: this.max
            }, callback);
        },
        remove: function(index, callback) {
            History.remove({
                key: this.key,
                index: index,
                expire: this.expire
            }, callback);
        },
        clear: function(callback) {
            History.clear(this.key, callback);
        }
    };
    var SearchHistory = {
        key: "search_history",
        expire: 365 * 24 * 60 * 60,
        max: 6,
        set: function(value, callback) {
            if (!isArray(value)) {
                value = [ value ];
            }
            for (var i = 0, l = value.length; i < l; i++) {
                value[i] = $.JSON.encode(value[i]);
            }
            History.set({
                key: this.key,
                value: value,
                expire: this.expire,
                max_len: this.max
            }, callback);
        },
        get: function(callback) {
            History.get({
                key: this.key,
                max_len: this.max
            }, callback);
        },
        add: function(value, callback) {
            History.add({
                key: this.key,
                value: JSON.stringify(value),
                expire: this.expire,
                ut: 1,
                //去除已存在的，追加新的记录
                max_len: this.max
            }, callback);
        },
        remove: function(index, callback) {
            History.remove({
                key: this.key,
                index: index,
                expire: this.expire
            }, callback);
        },
        clear: function(callback) {
            History.clear(this.key, callback);
        }
    };
    var NavHistory = {
        trigger: null,
        //#mini_record
        holder: null,
        //#fu_historylist
        listDiv: null,
        //.fu_history
        recommend: null,
        //.fu_recommend
        build: function() {
            if (!this.trigger && !this.holder && !this.listDiv) return;
            //获取一次数据，并将构建好的html插入到制定的div里面
            var self = this;
            function show() {
                self.trigger.addClass("hover his_active");
                self.holder.show();
            }
            function hide() {
                self.trigger.removeClass("hover his_active");
                self.holder.hide();
            }
            function displayRecommend(display) {
                if (self.recommend) {
                    self.recommend.css("display", display || "block");
                }
            }
            displayRecommend("none");
            function _build() {
                PlayHistory.get(function(d) {
                    var list = d.value || [];
                    list.reverse();
                    if (d.error == 1) {
                        self.recommend.html("<p>" + d.message + "</p>");
                    } else {
                        if (list.length < 1) {
                            self.listDiv.hide();
                            displayRecommend("block");
                        } else {
                            self.listDiv.show();
                            displayRecommend("none");
                            self.listDiv.find(".fu_lists").html(self._makeListHtml(list));
                            self._bindHtmlEvent();
                        }
                    }
                });
            }
            self.holder.find(".fu_delall").on("click", function(ev) {
                ev.preventDefault();
                PlayHistory.clear(function() {
                    self.listDiv.hide();
                    displayRecommend("block");
                });
            });
            self.holder.find(".fu_viewall").hide();
            self.holder.find(".fu_viewall").on("click", function(ev) {
                ev.preventDefault();
                //判断登录逻辑
                seajs.use("user", function(user) {
                    log("user : ", user);
                    var islogin = user.isLogined;
                    if (!islogin) {}
                });
            });
            self.trigger.hover(function() {
                show();
                _build();
            }, function() {
                hide();
            });
            self.holder.hover(show, hide);
        },
        _bindHtmlEvent: function() {
            var self = this;
            var del = self.listDiv.find(".fu_del");
            self.listDiv.find("dl").hover(function() {
                $(this).addClass("hover");
            }, function() {
                $(this).removeClass("hover");
            });
            del.on("click", function(ev) {
                ev.preventDefault();
                var el = this;
                PlayHistory.remove($(this).attr("data-index"), function(d) {
                    if (d.error === 0) {
                        var p = $(el.parentNode.parentNode);
                        p.remove();
                        if ($(self.listDiv).children().length < 1) {
                            if ($(self.recommend)) {
                                $(this).find(".fu_delbox").css("display", "none");
                                $(self.recommend).css("display", "block");
                            }
                        }
                    }
                });
            });
        },
        _makeListHtml: function(list) {
            var html = [];
            for (var i = 0, len = list.length; i < len; i++) {
                var item = list[i];
                var value = $.parseJSON(decodeURIComponent(item.value));
                var relUrl = this.pushUrl(value.Link || value.link);
                html.push('<dl class="' + (i == len - 1 ? "fu_nobd" : "") + '"><dt>');
                html.push('<a href="' + relUrl + "?rcc_starttime=" + (value.Pos || value.pos) + '" title="' + (value.Name || value.name) + '" target="_play">' + (value.Name || value.name) + "</a>");
                //兼容线上播放页
                html.push('<a href="' + relUrl + '" class="fu_del" data-index="' + item.index + '" title="删除本条记录"></a>');
                html.push("</dt><dd></dd></dl>");
            }
            return html.join("");
        },
        pushUrl: function(s) {
            return s.indexOf("http") > -1 ? s : "http://v.pptv.com/show/" + s + ".html";
        },
        parseUrl: function(s) {
            return s.indexOf("http") > -1 ? s.match(/.*?v.pptv.com\/(.*?)\.html/)[1] : s;
        }
    };
    window.History = History;
    //兼容顶踩
    return {
        History: History,
        PlayHistory: PlayHistory,
        SearchHistory: SearchHistory,
        NavHistory: NavHistory
    };
});

/*
 @fileOverview  http://www.JSON.org/json2.js

 2010-08-25

 Public Domain.

 NO WARRANTY EXPRESSED OR IMPLIED. USE AT YOUR OWN RISK.

 See http://www.JSON.org/js.html


 This code should be minified before deployment.
 See http://javascript.crockford.com/jsmin.html

 USE YOUR OWN COPY. IT IS EXTREMELY UNWISE TO LOAD CODE FROM SERVERS YOU DO
 NOT CONTROL.


 This file creates a global JSON object containing two methods: stringify
 and parse.

 JSON.stringify(value, replacer, space)
 value       any JavaScript value, usually an object or array.

 replacer    an optional parameter that determines how object
 values are stringified for objects. It can be a
 function or an array of strings.

 space       an optional parameter that specifies the indentation
 of nested structures. If it is omitted, the text will
 be packed without extra whitespace. If it is a number,
 it will specify the number of spaces to indent at each
 level. If it is a string (such as '\t' or '&nbsp;'),
 it contains the characters used to indent at each level.

 This method produces a JSON text from a JavaScript value.

 When an object value is found, if the object contains a toJSON
 method, its toJSON method will be called and the result will be
 stringified. A toJSON method does not serialize: it returns the
 value represented by the name/value pair that should be serialized,
 or undefined if nothing should be serialized. The toJSON method
 will be passed the key associated with the value, and this will be
 bound to the value

 For example, this would serialize Dates as ISO strings.

 Date.prototype.toJSON = function (key) {
 function f(n) {
 // Format integers to have at least two digits.
 return n < 10 ? '0' + n : n;
 }

 return this.getUTCFullYear()   + '-' +
 f(this.getUTCMonth() + 1) + '-' +
 f(this.getUTCDate())      + 'T' +
 f(this.getUTCHours())     + ':' +
 f(this.getUTCMinutes())   + ':' +
 f(this.getUTCSeconds())   + 'Z';
 };

 You can provide an optional replacer method. It will be passed the
 key and value of each member, with this bound to the containing
 object. The value that is returned from your method will be
 serialized. If your method returns undefined, then the member will
 be excluded from the serialization.

 If the replacer parameter is an array of strings, then it will be
 used to select the members to be serialized. It filters the results
 such that only members with keys listed in the replacer array are
 stringified.

 Values that do not have JSON representations, such as undefined or
 functions, will not be serialized. Such values in objects will be
 dropped; in arrays they will be replaced with null. You can use
 a replacer function to replace those with JSON values.
 JSON.stringify(undefined) returns undefined.

 The optional space parameter produces a stringification of the
 value that is filled with line breaks and indentation to make it
 easier to read.

 If the space parameter is a non-empty string, then that string will
 be used for indentation. If the space parameter is a number, then
 the indentation will be that many spaces.

 Example:

 text = JSON.stringify(['e', {pluribus: 'unum'}]);
 // text is '["e",{"pluribus":"unum"}]'


 text = JSON.stringify(['e', {pluribus: 'unum'}], null, '\t');
 // text is '[\n\t"e",\n\t{\n\t\t"pluribus": "unum"\n\t}\n]'

 text = JSON.stringify([new Date()], function (key, value) {
 return this[key] instanceof Date ?
 'Date(' + this[key] + ')' : value;
 });
 // text is '["Date(---current time---)"]'


 JSON.parse(text, reviver)
 This method parses a JSON text to produce an object or array.
 It can throw a SyntaxError exception.

 The optional reviver parameter is a function that can filter and
 transform the results. It receives each of the keys and values,
 and its return value is used instead of the original value.
 If it returns what it received, then the structure is not modified.
 If it returns undefined then the member is deleted.

 Example:

 // Parse the text. Values that look like ISO date strings will
 // be converted to Date objects.

 myData = JSON.parse(text, function (key, value) {
 var a;
 if (typeof value === 'string') {
 a =
 /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}(?:\.\d*)?)Z$/.exec(value);
 if (a) {
 return new Date(Date.UTC(+a[1], +a[2] - 1, +a[3], +a[4],
 +a[5], +a[6]));
 }
 }
 return value;
 });

 myData = JSON.parse('["Date(09/09/2001)"]', function (key, value) {
 var d;
 if (typeof value === 'string' &&
 value.slice(0, 5) === 'Date(' &&
 value.slice(-1) === ')') {
 d = new Date(value.slice(5, -1));
 if (d) {
 return d;
 }
 }
 return value;
 });


 This is a reference implementation. You are free to copy, modify, or
 redistribute.
 */
/*jslint evil: true, strict: false */
/*members "", "\b", "\t", "\n", "\f", "\r", "\"", JSON, "\\", apply,
 call, charCodeAt, getUTCDate, getUTCFullYear, getUTCHours,
 getUTCMinutes, getUTCMonth, getUTCSeconds, hasOwnProperty, join,
 lastIndex, length, parse, prototype, push, replace, slice, stringify,
 test, toJSON, toString, valueOf
 */
// Create a JSON object only if one does not already exist. We create the
// methods in a closure to avoid creating global variables.
define("util/json/json", [], function() {
    var JSON;
    if (!JSON) {
        JSON = {};
    }
    function f(n) {
        // Format integers to have at least two digits.
        return n < 10 ? "0" + n : n;
    }
    if (typeof Date.prototype.toJSON !== "function") {
        Date.prototype.toJSON = function(key) {
            return isFinite(this.valueOf()) ? this.getUTCFullYear() + "-" + f(this.getUTCMonth() + 1) + "-" + f(this.getUTCDate()) + "T" + f(this.getUTCHours()) + ":" + f(this.getUTCMinutes()) + ":" + f(this.getUTCSeconds()) + "Z" : null;
        };
        String.prototype.toJSON = Number.prototype.toJSON = Boolean.prototype.toJSON = function(key) {
            return this.valueOf();
        };
    }
    var cx = /[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g, escapable = /[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g, gap, indent, meta = {
        // table of character substitutions
        "\b": "\\b",
        "	": "\\t",
        "\n": "\\n",
        "\f": "\\f",
        "\r": "\\r",
        '"': '\\"',
        "\\": "\\\\"
    }, rep;
    function quote(string) {
        // If the string contains no control characters, no quote characters, and no
        // backslash characters, then we can safely slap some quotes around it.
        // Otherwise we must also replace the offending characters with safe escape
        // sequences.
        escapable["lastIndex"] = 0;
        return escapable.test(string) ? '"' + string.replace(escapable, function(a) {
            var c = meta[a];
            return typeof c === "string" ? c : "\\u" + ("0000" + a.charCodeAt(0).toString(16)).slice(-4);
        }) + '"' : '"' + string + '"';
    }
    function str(key, holder) {
        // Produce a string from holder[key].
        var i, // The loop counter.
        k, // The member key.
        v, // The member value.
        length, mind = gap, partial, value = holder[key];
        // If the value has a toJSON method, call it to obtain a replacement value.
        if (value && typeof value === "object" && typeof value.toJSON === "function") {
            value = value.toJSON(key);
        }
        // If we were called with a replacer function, then call the replacer to
        // obtain a replacement value.
        if (typeof rep === "function") {
            value = rep.call(holder, key, value);
        }
        // What happens next depends on the value's type.
        switch (typeof value) {
          case "string":
            return quote(value);

          case "number":
            // JSON numbers must be finite. Encode non-finite numbers as null.
            return isFinite(value) ? String(value) : "null";

          case "boolean":
          case "null":
            // If the value is a boolean or null, convert it to a string. Note:
            // typeof null does not produce 'null'. The case is included here in
            // the remote chance that this gets fixed someday.
            return String(value);

          // If the type is 'object', we might be dealing with an object or an array or
            // null.
            case "object":
            // Due to a specification blunder in ECMAScript, typeof null is 'object',
            // so watch out for that case.
            if (!value) {
                return "null";
            }
            // Make an array to hold the partial results of stringifying this object value.
            gap += indent;
            partial = [];
            // Is the value an array?
            if (Object.prototype.toString.apply(value) === "[object Array]") {
                // The value is an array. Stringify every element. Use null as a placeholder
                // for non-JSON values.
                length = value.length;
                for (i = 0; i < length; i += 1) {
                    partial[i] = str(i, value) || "null";
                }
                // Join all of the elements together, separated with commas, and wrap them in
                // brackets.
                v = partial.length === 0 ? "[]" : gap ? "[\n" + gap + partial.join(",\n" + gap) + "\n" + mind + "]" : "[" + partial.join(",") + "]";
                gap = mind;
                return v;
            }
            // If the replacer is an array, use it to select the members to be stringified.
            if (rep && typeof rep === "object") {
                length = rep.length;
                for (i = 0; i < length; i += 1) {
                    k = rep[i];
                    if (typeof k === "string") {
                        v = str(k, value);
                        if (v) {
                            partial.push(quote(k) + (gap ? ": " : ":") + v);
                        }
                    }
                }
            } else {
                // Otherwise, iterate through all of the keys in the object.
                for (k in value) {
                    if (Object.hasOwnProperty.call(value, k)) {
                        v = str(k, value);
                        if (v) {
                            partial.push(quote(k) + (gap ? ": " : ":") + v);
                        }
                    }
                }
            }
            // Join all of the member texts together, separated with commas,
            // and wrap them in braces.
            v = partial.length === 0 ? "{}" : gap ? "{\n" + gap + partial.join(",\n" + gap) + "\n" + mind + "}" : "{" + partial.join(",") + "}";
            gap = mind;
            return v;
        }
    }
    // If the JSON object does not yet have a stringify method, give it one.
    if (typeof JSON.stringify !== "function") {
        JSON.stringify = function(value, replacer, space) {
            // The stringify method takes a value and an optional replacer, and an optional
            // space parameter, and returns a JSON text. The replacer can be a function
            // that can replace values, or an array of strings that will select the keys.
            // A default replacer method can be provided. Use of the space parameter can
            // produce text that is more easily readable.
            var i;
            gap = "";
            indent = "";
            // If the space parameter is a number, make an indent string containing that
            // many spaces.
            if (typeof space === "number") {
                for (i = 0; i < space; i += 1) {
                    indent += " ";
                }
            } else if (typeof space === "string") {
                indent = space;
            }
            // If there is a replacer, it must be a function or an array.
            // Otherwise, throw an error.
            rep = replacer;
            if (replacer && typeof replacer !== "function" && (typeof replacer !== "object" || typeof replacer.length !== "number")) {
                throw new Error("JSON.stringify");
            }
            // Make a fake root object containing our value under the key of ''.
            // Return the result of stringifying the value.
            return str("", {
                "": value
            });
        };
    }
    // If the JSON object does not yet have a parse method, give it one.
    if (typeof JSON.parse !== "function") {
        JSON.parse = function(text, reviver) {
            // The parse method takes a text and an optional reviver function, and returns
            // a JavaScript value if the text is a valid JSON text.
            var j;
            function walk(holder, key) {
                // The walk method is used to recursively walk the resulting structure so
                // that modifications can be made.
                var k, v, value = holder[key];
                if (value && typeof value === "object") {
                    for (k in value) {
                        if (Object.hasOwnProperty.call(value, k)) {
                            v = walk(value, k);
                            if (v !== undefined) {
                                value[k] = v;
                            } else {
                                delete value[k];
                            }
                        }
                    }
                }
                return reviver.call(holder, key, value);
            }
            // Parsing happens in four stages. In the first stage, we replace certain
            // Unicode characters with escape sequences. JavaScript handles many characters
            // incorrectly, either silently deleting them, or treating them as line endings.
            text = String(text);
            cx["lastIndex"] = 0;
            if (cx.test(text)) {
                text = text.replace(cx, function(a) {
                    return "\\u" + ("0000" + a.charCodeAt(0).toString(16)).slice(-4);
                });
            }
            // In the second stage, we run the text against regular expressions that look
            // for non-JSON patterns. We are especially concerned with '()' and 'new'
            // because they can cause invocation, and '=' because it can cause mutation.
            // But just to be safe, we want to reject all unexpected forms.
            // We split the second stage into 4 regexp operations in order to work around
            // crippling inefficiencies in IE's and Safari's regexp engines. First we
            // replace the JSON backslash pairs with '@' (a non-JSON character). Second, we
            // replace all simple value tokens with ']' characters. Third, we delete all
            // open brackets that follow a colon or comma or that begin the text. Finally,
            // we look to see that the remaining characters are only whitespace or ']' or
            // ',' or ':' or '{' or '}'. If that is so, then the text is safe for eval.
            if (/^[\],:{}\s]*$/.test(text.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g, "@").replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, "]").replace(/(?:^|:|,)(?:\s*\[)+/g, ""))) {
                // In the third stage we use the eval function to compile the text into a
                // JavaScript structure. The '{' operator is subject to a syntactic ambiguity
                // in JavaScript: it can begin a block or an object literal. We wrap the text
                // in parens to eliminate the ambiguity.
                j = eval("(" + text + ")");
                // In the optional fourth stage, we recursively walk the new structure, passing
                // each name/value pair to a reviver function for possible transformation.
                return typeof reviver === "function" ? walk({
                    "": j
                }, "") : j;
            }
            // If the text is not JSON parseable, then a SyntaxError is thrown.
            throw new SyntaxError("JSON.parse");
        };
    }
    return JSON;
});

/**
 * @author  Erick Song
 * @email   ahschl0322@gmail.com
 * @info    获取PUID
 */
define("util/pub/puid", [ "core/jquery/1.8.3/jquery", "util/cookie/cookie" ], function(require) {
    var puid, $ = require("core/jquery/1.8.3/jquery"), cookie = require("util/cookie/cookie");
    var Puid = {
        getPuid: function(cb) {
            puid = cookie.get("PUID");
            if (puid) {
                cb.call(null, puid);
            } else {
                //分配PUID    http://c(1|2|3|4).pptv.com/puid/get?(&format=[jsonp|json|xml]&cb=[cb])
                $.ajax({
                    dataType: "jsonp",
                    type: "GET",
                    url: "http://c1.pptv.com/puid/get",
                    jsonp: "cb",
                    data: {
                        format: "jsonp"
                    },
                    success: function(data) {
                        if (data.error === 0) {
                            puid = data.value;
                            if (typeof cb == "function") {
                                cb.call(null, puid);
                            }
                        }
                    }
                });
            }
        }
    };
    return Puid;
});
