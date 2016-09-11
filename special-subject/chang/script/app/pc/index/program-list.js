/*! 一唱成名 create by ErickSong */
/**
 * @Description 播放页逻辑
 * @Author 		YanYang
 * @Qq			175225632
 * @Data		2014/9/26
 */
define("app/pc/index/program-list", [ "../../../util/pub/main", "core/underscore/1.8.3/underscore", "core/jquery/1.8.3/jquery", "../../../util/cookie/cookie", "../../../util/lazyload/delayload", "../../../util/lazyload/webp", "../../../util/login/login", "../../../util/user/user", "client", "../../../util/loader/loader", "../../../util/log/log", "../../../util/platform/plt", "../../../util/browser/browser", "../../../util/net/urlquery", "../../../util/date/format", "../../../util/event/event-aggregator", "../../../util/scroller/scroller", "../../../util/event/event-mouse-wheel", "../../../util/scroller/scroller.css", "./video", "./video-controller", "./group", "./group-controller", "../../../util/function/delay", "./living-controller", "./module" ], function(require, exports) {
    //添加依赖
    require("../../../util/pub/main");
    var $ = require("core/jquery/1.8.3/jquery");
    var client = require("client");
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
    var _ = require("core/underscore/1.8.3/underscore");
    var Loader = require("../../../util/loader/loader");
    var formatDate = require("../../../util/date/format");
    var EventAggregator = require("../../../util/event/event-aggregator");
    require("../../../util/scroller/scroller");
    var Video = require("./video");
    var VideoController = require("./video-controller");
    var Group = require("./group");
    var GroupController = require("./group-controller");
    var LivingController = require("./living-controller");
    var Mod = require("./module");
    var PAGESIZE = {
        episode: 100,
        collection: 1e3
    };
    var webcfg = window.webcfg || {};
    /**
	 * current_webcfg 【当前播放视频的webcfg】
	 * 1.保存正在播放video相关信息，不覆盖原有信息
	 * 2.通过$来监听和发布相关信息修改
	 */
    window.current_webcfg = {};
    _.extend(current_webcfg, {
        set: function(attr, value) {
            this[attr] = value;
        },
        get: function(attr) {
            if (this[attr] !== undefined) {
                return this[attr];
            } else {
                return webcfg[attr];
            }
        }
    });
    $.subscribe1("webcfg.change", function(attr, value) {
        current_webcfg.set(attr, value);
    });
    var player = window.player;
    // if(!player){
    // 	throw('player is not define!');
    // }
    /*视频数据接口*/
    var Data = {
        episode: function(opt, callback) {
            var params = _.extend({
                pid: 10034216,
                page: 1,
                pageSize: PAGESIZE.episode,
                cat_id: current_webcfg.get("cat_id")
            }, opt);
            if (params.page == null) {
                delete params.page;
            }
            Loader.ajax({
                url: "http://v.pptv.com/show/videoList?",
                data: params,
                jsonpCallback: "videoList",
                success: function(data) {
                    log("【剧集接口http://v.pptv.com/show/videoList?】");
                    log("param:", params);
                    log("return:", data);
                    callback(data);
                },
                error: function(e) {
                    throw "episode load failed!", e;
                }
            });
        },
        collection: function(opt, callback) {
            var params = _.extend({
                pid: 950471,
                page: 1,
                pageSize: PAGESIZE.collection,
                cat_id: current_webcfg.get("cat_id")
            }, opt);
            Loader.ajax({
                url: "http://v.pptv.com/show/videoList?",
                data: params,
                jsonpCallback: "videoList",
                success: function(data) {
                    log("【合集接口http://v.pptv.com/show/videoList?】");
                    log("param:", params);
                    log("return:", data);
                    callback(data);
                },
                error: function(e) {
                    log(e);
                    throw "collection load failed!";
                }
            });
        },
        living: function(opt, callback) {
            var params = _.extend({
                pid: 300170,
                page: 1,
                cat_id: current_webcfg.get("cat_id")
            }, opt);
            Loader.ajax({
                url: "http://v.pptv.com/show/videoList?",
                data: params,
                jsonpCallback: "videoList",
                success: function(data) {
                    log("【直播接口http://v.pptv.com/show/videoList?】");
                    log("param:", params);
                    log("return:", data);
                    callback(data);
                },
                error: function(e) {
                    log(e);
                    throw "living load failed!";
                }
            });
        }
    };
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
        },
        /**
		 * [group_living 直播分组数据]
		 * @param  {[int]} page [最大页的日期-今天的日期，例如：从明天开始输出就是1]
		 * @param  {[int]} size [个数]
		 * @param  {[Date]} date [当前时间/服务器时间]
		 * @return {[Array]}
		 */
        group_living: function(page, size, date) {
            var date = date || new Date();
            var timeStamp = parseInt(date.valueOf());
            var day = 1e3 * 60 * 60 * 24;
            var page = page || 1;
            //默认明天开始
            var size = size || 7;
            //显示日期个数
            var start = 1 + page;
            // 开始输出的日期 = 今天 + 相差日期
            var end = start - size;
            var groupArray = [];
            while (start > end) {
                var cDate = new Date(timeStamp + day * (start - 1));
                groupArray.push({
                    date: cDate,
                    page: start,
                    title: start == 1 ? "今天" : formatDate(cDate, "MM月DD日"),
                    url: "",
                    data: [],
                    active: start == 1 ? true : false
                });
                start -= 1;
            }
            // groupArray.reverse();
            var groups = _.map(groupArray, function(n) {
                var g = new Group(n);
                return new Group(n);
            });
            log("[simulate data] 直播分组：", groups);
            return groups;
        }
    };
    var StateHTML = {
        over: '<i class="over"></i>已结束，可回看',
        onair: '<i class="playing"></i>正在直播',
        now: '<i class="playing"></i>正在回播',
        normal: '<i class="nobook"></i>未订阅'
    };
    /*直播视频状态控制器-用来刷新直播节目的状态（可回看，直播，订阅，已订阅）*/
    var VideoTypeController = {
        idPrefix: "video-",
        /**
		 * @param  {Video Array}   videos   [需要渲染的视频集合]
		 * @param  {Function} callback [将正在播放的视频最为第一个参数的回调方法]
		 */
        init: function(videos, callback) {
            this.videos = videos;
            this.map(callback);
            this.curVideo = null;
        },
        map: function(callback) {
            var self = this;
            CurTime.get(function(time) {
                _.each(self.videos, function(n) {
                    if (n.etime < time) {} else if (time < n.etime && n.stime < time) {
                        // console.log(2,n,time);
                        $("#" + self.idPrefix + n.stime).addClass("now on-air").find(".state").html(StateHTML.onair);
                        self.curVideo = n;
                    } else if (time < n.stime) {
                        // console.log(3,n,time);
                        $("#" + self.idPrefix + n.stime).addClass("cant-play").find(".state").html(StateHTML.normal);
                    }
                });
                self.curVideo && callback && callback(self.curVideo);
            });
        },
        position: function(posi) {
            this.curPosi = posi;
            if (posi > this.curVideo.etime) {
                this._nextVideo && this._nextVideo();
            }
        },
        nextVideo: function(fn) {
            this._nextVideo = fn;
        }
    };
    /*接收player返回的当前时间*/
    var CurTime = {
        cb: $.Callbacks(),
        live: 0,
        posi: 0,
        set: function(live, posi) {
            this.live = live;
            this.posi = posi;
            if (this.live && this.posi && this.cb) {
                this.cb.fire(live, posi);
                this.cb.empty();
                this.cb = null;
            }
        },
        get: function(cb) {
            if (this.live && this.posi) {
                cb && cb(this.live, this.posi);
                return this.live;
            } else {
                this.cb.add(cb);
            }
        }
    };
    /*计算sidebar列表区域高度*/
    var heightCtrl = function() {
        var total = "total";
        var hash = {};
        var _get = function(name) {
            // console.log(name, typeof this[name]);
            if (typeof hash[name] === "object") {
                return hash[name].is(":hidden") ? 0 : hash[name].height();
            } else {
                return hash[name];
            }
        };
        return {
            height: function(name, value) {
                hash[name] = value;
            },
            count: function() {
                var height = _get(total);
                for (var n in hash) {
                    if (n !== total) {
                        height -= _get(n);
                    }
                }
                return height;
            }
        };
    };
    /*直播DEMO*/
    function renderLiving($wrap, player, tools) {
        var ea = new EventAggregator();
        ea.subscribe("reflashProgram", function() {
            // scrollToCurrentHandler();
            groupController.init({
                page: 1
            });
        });
        var template_container = "" + '<div class="module-video-live-1408" style="display:;">' + '<h3 title="<%= title %>"><%= title %></h3>' + '<div class="tabcon">' + '<div class="liveprogram" data-scroller-class="liveprogram-wrap">' + '<div class="numbox">' + '<div class="subnum cf">' + "</div><!-- subnum end -->" + '<div class="morenum cf">' + "</div><!-- morenum end -->" + "</div>" + '<div class="liveprogram-wrap">' + "<ul></ul>" + "</div>" + "</div>" + '<div id="barrage" style="display:none"></div>' + "</div>" + "</div>";
        var template_video = '<li id="video-<%= stime %>" data-start-time="<%= stime %>">' + // hover now
        '<em class="time"><%= begin_time.substr(0, 5) %></em>' + "<p>" + '<span class=""><%= title %></span>' + '<span class="state">' + StateHTML.over + "</span>" + "</p>" + "</li>";
        var videoController = new LivingController("living", {
            eventAggregator: ea
        });
        var tempFunc = _.template(template_container);
        var $wrap_preload = $(tempFunc({
            title: current_webcfg.get("p_title")
        }));
        var $container = $wrap_preload.find("div.liveprogram-wrap");
        var scrollTop = 0;
        var scroller;
        $container.on("click", "li", function(e) {
            /*直播播放不需要id, 用startTime作为key，来定位视频*/
            e.preventDefault();
            var btn = $(this);
            if (!btn.hasClass("cant-play") && !btn.hasClass("hover")) {
                var startTime = $(this).attr("data-start-time");
                videoController.play(startTime, btn.hasClass("on-air"));
            }
        });
        if (player) {
            player.onRegister("nextvideo", function() {
                videoController.playNext();
                scrollToCurrentHandler();
            });
            player.onRegister("position", function(data) {
                /*Vod: 0live: 1413260861posi: 1413260860*/
                var data = data.body.data;
                CurTime.set(data.live, data.posi);
                if (data.posi > videoController.currentVideo.etime) {
                    videoController.playNext();
                    scrollToCurrentHandler();
                }
            });
            player.onRegister("golive", function() {
                var startTime = $container.find(".on-air").attr("data-start-time");
                videoController.play(startTime, true);
                scrollToCurrentHandler();
                groupController.onSelectHandler(1, $.Callbacks().add(function() {
                    var startTime = $container.find(".on-air").attr("data-start-time");
                    videoController.play(startTime, true);
                    scrollToCurrentHandler();
                }));
            });
        }
        ea.subscribe("videoController.getCurTime", function(callback) {
            callback(CurTime.live, CurTime.posi);
        });
        /*测试自动播放下一级，勿删*/
        /*$wrap_preload.on('click', 'li.cant-play', function(e){
			var stime = $(this).attr('data-start-time');
			ea.publish('videoController.afterPlay', {
				stime: stime
			});
		});*/
        ea.subscribe("videoController.afterPlay", function(video) {
            var oldVideo = $container.find("li.now").removeClass("now");
            if (!oldVideo.hasClass("on-air")) {
                oldVideo.find(".state").html(StateHTML.over);
            }
            var newVideo = $("#video-" + video.stime).addClass("now");
            if (!newVideo.hasClass("cant-play")) {
                if (!newVideo.hasClass("on-air")) {
                    newVideo.find(".state").html(StateHTML.now);
                }
            } else {
                //自动播放到新的时间段
                $container.find("li.on-air").removeClass("on-air").find(".state").html(StateHTML.over);
                newVideo.addClass("on-air").find(".state").html(StateHTML.onair);
            }
        });
        var scrollToCurrentHandler = function() {
            var now = $container.find("li.now");
            if (now.length) {
                var h = now.outerHeight();
                tools.scroller.scrollTo($container.find("li.now").position().top - 2 * h);
            }
        };
        tools.afterResize = function() {
            scrollToCurrentHandler();
        };
        var mod = new Mod({
            $wrap: $wrap || $("#player-sidebar"),
            $container: $container,
            renderWrap: function($wrap) {
                $wrap.empty().append($wrap_preload);
            },
            render: function($container, videos) {
                log("[render videos]", videos);
                var html = _.map(videos, function(video) {
                    return video.render(template_video);
                }).join("");
                $container.find("ul").empty().append(html);
                CurTime.get(function(live, posi) {
                    var idPrefix = "video-";
                    videoController.each(function(video) {
                        // console.log('111',video.etime, time);
                        if (video.etime < live) {} else if (live < video.etime && video.stime < live) {
                            // console.log(2,video,time);
                            $("#" + idPrefix + video.stime).addClass("on-air").find(".state").html(StateHTML.onair);
                            videoController.setCurVideo(video);
                        } else if (live < video.stime) {
                            // console.log(3,video,time);
                            $("#" + idPrefix + video.stime).addClass("cant-play").find(".state").html(StateHTML.normal);
                        }
                        if (posi < video.etime && video.stime < posi) {
                            // console.log(2,video,time);
                            $("#" + idPrefix + video.stime).addClass("now on-air").find(".state").html(StateHTML.onair);
                            videoController.setCurVideo(video);
                        }
                    });
                    tools.containerResize($container, $wrap_preload.find("div.numbox").height());
                });
            }
        });
        mod.init();
        loadData(1);
        //加载今天数据
        var groupController = new GroupController(groupCreater.group_living(), {
            eventAggregator: ea,
            $container: $wrap_preload.find("div.subnum"),
            $containerMore: $wrap_preload.find("div.morenum"),
            render: function($container, data) {
                $container.empty().append(_.template("<% _.each(data, function(n, i){%>" + '<a href="javascript:;" title="" <% if(n.active){print(\'class="now"\')} %>><%= n.title %></a>' + "<% }); %>")({
                    data: data
                }));
                return $container.find("a:last");
            },
            renderMore: function($containerMore, data) {
                $containerMore.append(_.template("<% _.each(data, function(n, i){%>" + '<a href="javascript:;" title="<%= n.title %>" <% if(n.active){print(\'class="now"\')} %>><%= n.title %></a>' + "<% }); %>")({
                    data: data
                }));
            }
        });
        groupController.init({
            page: 1
        });
        ea.subscribe("changePage", function(group, callbacks) {
            $container.find("ul").empty();
            loadData(group.page, callbacks);
        });
        function loadData(page, callbacks) {
            Data.living({
                pid: current_webcfg.get("id"),
                page: page
            }, function(data) {
                if (!data.err) {
                    videoController.empty();
                    var videos = _.map(data.data.list, function(n) {
                        n.id = n.begin_time.replace(/:/g, "");
                        var video = new Video(n);
                        videoController.push(video, {
                            isPlaying: false
                        });
                        return video;
                    });
                    mod.loadData(videos);
                    if (callbacks && typeof callbacks == "function") {
                        callbacks();
                    } else if (callbacks) {
                        callbacks.fire();
                    }
                }
            });
        }
    }
    /*合集DEMO*/
    function renderCollection($wrap, player, tools) {
        var ea = new EventAggregator();
        var template_container = '<div class="module-video-program-1408">' + '<div class="plist">' + // '<h3 title="<%= title %>"><%= title %></h3>' +
        '<div class="tabcon">' + '<div class="collection-wrap" data-scroller-class="ui-resp-pics">' + '<div class="numbox">' + '<div class="subnum cf"></div>' + '<div class="morenum cf"></div>' + "</div>" + '<div class="ui-resp-pics ui-80x45 cf v-container">' + "<ul><!-- template_item --></ul>" + "</div>" + "</div>" + "</div>" + "</div><!-- plist end -->" + "</div>";
        var template_video = '<li  id="video-<%= id %>" class="<% if(isPlaying){ %>now <% }%>">' + '<a href="javascript:;" title="<%= title %>" class="ui-list-ct" data-id="<%= id %>">' + '<dl class="cf">' + "<dt>" + '<img src="http://s1.pplive.cn/v/cap/<%= id %>/w120.jpg">' + "<i></i>" + "</dt>" + "<dd>" + '<p class="main-tt"><%= epTitle %></p>' + "</dd>" + "</dl>" + "</a>" + "</li>";
        var videoController = new VideoController("collection", {
            eventAggregator: ea,
            redirect: false
        });
        var tempFunc = _.template(template_container);
        var $wrap_preload = $(tempFunc({
            title: current_webcfg.get("p_title")
        }));
        var $container = $wrap_preload.find(".v-container");
        var page = 1;
        var total, pageSize = PAGESIZE.collection;
        var scrollTop = 0;
        var scroller;
        var maxPage, autoType;
        $container.on("click", "a", function(e) {
            var btn = $(this);
            e.preventDefault();
            var id = btn.attr("data-id");
            var parent = btn.parent();
            var idx = parent.index();
            if (client.isClient()) {
                parent.siblings().removeClass("now");
                parent.addClass("now");
                client.playById(id, 0, id, true);
            } else if (window.player) {
                videoController.play(id);
            }
        });
        //剧集新增scroll mask的逻辑,需要优化
        if ($(".mask1").length != 0) {
            $(".mask1").on("click", function(e) {
                var mouseOffset = e.offsetY;
                var scroll = tools.scroller;
                var targetUl = scroll.find("ul");
                var tempTop = Math.abs(parseInt(targetUl.css("top")));
                var targetLi = targetUl.find("li");
                var itemHeight = targetLi.height();
                var finalH = mouseOffset + tempTop;
                var index = Math.floor(finalH / itemHeight);
                var targetVideo = targetLi.eq(index).find("a").attr("data-id");
                videoController.play(targetVideo);
            });
            $(".mask2").on("click", function(e) {
                var mouseOffset = e.offsetY;
                var tempH = parseInt($(".play-sidebar").height());
                var maskH = parseInt($(this).height());
                var scroll = tools.scroller;
                var targetUl = scroll.find("ul");
                var tempTop = Math.abs(parseInt(targetUl.css("top")));
                var targetLi = targetUl.find("li");
                var itemHeight = targetLi.height();
                var finalH = tempH - maskH + mouseOffset + tempTop;
                var index = Math.floor(finalH / itemHeight);
                var targetVideo = targetLi.eq(index).find("a").attr("data-id");
                videoController.play(targetVideo);
            });
        }
        if (player) {
            player.onRegister("nextvideo", function(data) {
                //TODO: rcc_src
                try {
                    videoController.playNext({
                        rcc: data.body.data.autoPlayNext ? "B1" : "B2"
                    });
                    //B1: 自动播放下一集 | B2: 手动下一集
                    scrollToCurrentHandler();
                } catch (e) {}
            });
            player.onRegister("position", function(data) {});
            player.onModeChanged.add(function(a) {
                if (a == 3) {
                    videoController.attr("redirect", false);
                } else {
                    videoController.attr("redirect", true);
                }
            });
        }
        ea.subscribe("videoController.afterPlay", function(video) {
            var DomVideo = $("#video-" + video.id);
            DomVideo.parent().find("li").removeClass("now");
            $("#video-" + video.id).addClass("now");
        });
        var scrollToCurrentHandler = function() {
            var now = $container.find("li.now");
            if (now.length) {
                var h = now.outerHeight();
                tools.scroller.scrollTo($container.find("li.now").position().top - 2 * h);
            }
        };
        tools.afterResize = function() {
            scrollToCurrentHandler();
        };
        var mod = new Mod({
            $wrap: $wrap || $("#player-sidebar-demo"),
            $container: $container,
            renderWrap: function($wrap) {
                $wrap.empty().append($wrap_preload);
            },
            render: function($container, videos) {
                log("[render videos]", videos);
                var html = _.map(videos, function(video) {
                    return video.render(template_video);
                }).join("");
                $container.find("ul").empty().append(html);
                tools.containerResize($container, $wrap_preload.find("div.numbox").height());
            }
        });
        mod.init();
        var firstLoad = 1;
        loadData(page, function(page) {
            renderGroup(page);
        });
        function loadData(page, callbacks) {
            var param = {
                pid: current_webcfg.get("pid"),
                page: page,
                maxPage: maxPage || "",
                autoType: autoType || ""
            };
            if (firstLoad) {
                param.highlight = current_webcfg.get("id");
                // page传null，用highlight定位id所在分页
                firstLoad = 0;
            }
            Data.collection(param, function(data) {
                if (!data.err) {
                    page = data.data.page;
                    total = data.data.total;
                    maxPage = data.data.maxPage;
                    autoType = data.data.autoType;
                    videoController.empty();
                    var videos = _.map(data.data.list, function(n) {
                        var video = new Video(n);
                        videoController.push(video, {
                            isPlaying: current_webcfg.get("id") == n.id
                        });
                        return video;
                    });
                    mod.loadData(videos);
                    if (callbacks && typeof callbacks == "function") {
                        callbacks(page);
                    } else if (callbacks) {
                        callbacks.fire();
                        callbacks.empty();
                        callbacks = null;
                    }
                } else {}
            });
        }
        function renderGroup(page) {
            if (pageSize >= total) {
                $wrap_preload.find("div.numbox").hide();
                tools.containerResize($container, 0);
                return;
            } else {
                $wrap_preload.find("div.numbox").show();
                tools.containerResize($container, $wrap_preload.find("div.numbox").height());
            }
            var groupController = new GroupController(groupCreater.group_episode(page, pageSize, total), {
                eventAggregator: ea,
                $container: $wrap_preload.find("div.subnum"),
                $containerMore: $wrap_preload.find("div.morenum"),
                render: function($container, data) {
                    $container.append(_.template("<% _.each(data, function(n, i){%>" + '<a href="javascript:;" title="" <% if(n.active){print(\'class="now"\')} %>><%= n.title %></a>' + "<% }); %>")({
                        data: data
                    }));
                    return $container.find("a:last");
                },
                renderMore: function($containerMore, data) {
                    $containerMore.append(_.template("<% _.each(data, function(n, i){%>" + '<a href="javascript:;" title="<%= n.title %>" <% if(n.active){print(\'class="now"\')} %>><%= n.title %></a>' + "<% }); %>")({
                        data: data
                    }));
                }
            });
            groupController.init({
                page: page
            });
            ea.subscribe("changePage", function(group, callbacks) {
                $container.append('<div class="loading" style="background:#333;position:absolute; top:0px; text-align:center; width:100%; height:100%; opacity: .7; filter:alpha(opacity=70)"><span style="position:absolute; width:100%; top:49%; left:0; color:#fff">加载中...</span></div>');
                callbacks.add(function() {
                    $container.find("div.loading").remove();
                });
                loadData(group.page, callbacks);
            });
        }
    }
    /*剧集DEMO*/
    function renderEpisode($wrap, player, tools) {
        var ea = new EventAggregator();
        var template_container = "" + '<div class="module-video-num-1408">' + '<div class="plist">' + '<h3 title="<%= title %>"><%= title %></h3>' + '<div class="tabcon">' + '<div class="episode-wrap" data-scroller-class="pnums">' + '<div class="numbox">' + '<div class="subnum cf"></div>' + '<div class="morenum cf"></div>' + "</div>" + '<div class="pnums">' + '<ul class="cf"><!-- template_item --></ul>' + "</div>" + "</div>" + "</div>" + "</div><!-- plist end -->" + "</div>";
        var template_video = '<li  id="video-<%= id %>" class="<% if(isPlaying){ %>now <% }%>"><a href="<%= url %>" data-id="<%= id %>" title="<%= title %>"><%= Number(epTitle) == epTitle ? epTitle : epIndex %><% if(isTrailer){ %><i class="forecast"></i><% } %></a></li>';
        var videoController = new VideoController("episode", {
            eventAggregator: ea,
            redirect: true
        });
        var tempFunc = _.template(template_container);
        var $wrap_preload = $(tempFunc({
            title: current_webcfg.get("p_title")
        }));
        var $container = $wrap_preload.find("div.pnums");
        var page, total, pageSize;
        $container.on("click", "a", function(e) {
            e.preventDefault();
            var btn = $(this);
            if (!btn.parent().hasClass("now")) {
                var id = $(this).attr("data-id");
                videoController.play(id);
            }
        });
        if (player) {
            player.onRegister("nextvideo", function(data) {
                //TODO: rcc_src
                try {
                    videoController.playNext({
                        rcc: data.body.data.autoPlayNext ? "B1" : "B2"
                    });
                    //B1: 自动播放下一集 | B2: 手动下一集
                    scrollToCurrentHandler();
                } catch (e) {}
            });
            player.onRegister("position", function(data) {});
            player.onModeChanged.add(function(a) {
                if (a == 3) {
                    videoController.attr("redirect", false);
                } else {
                    videoController.attr("redirect", true);
                }
            });
        }
        ea.subscribe("videoController.afterPlay", function(video) {
            var DomVideo = $("#video-" + video.id);
            DomVideo.parent().find("li").removeClass("now");
            $("#video-" + video.id).addClass("now");
        });
        var scrollToCurrentHandler = function() {
            var now = $container.find("li.now");
            if (now.length) {
                var h = now.outerHeight();
                tools.scroller.scrollTo(now.position().top - 2 * h);
            }
        };
        tools.afterResize = function() {
            scrollToCurrentHandler();
        };
        var mod = new Mod({
            $wrap: $wrap || $("#player-sidebar-juji"),
            $container: $container,
            renderWrap: function($wrap) {
                $wrap.empty().append($wrap_preload);
            },
            render: function($container, videos) {
                log("[render videos]", videos);
                var html = _.map(videos, function(video) {
                    return video.render(template_video);
                }).join("");
                $container.find("ul").empty().append(html);
                tools.containerResize($container, $wrap_preload.find("div.numbox").height());
            }
        });
        mod.init();
        var callbacks = $.Callbacks();
        loadData(null, function(page, pageSize, total) {
            renderGroup(page, pageSize, total);
        });
        function loadData(page, callbacks) {
            var param = {
                pid: current_webcfg.get("pid"),
                page: page
            };
            if (page == null) {
                param.highlight = current_webcfg.get("id");
            }
            Data.episode(param, function(data) {
                if (!data.err) {
                    videoController.empty();
                    var startIndex = data.data.pageSize * (data.data.page - 1);
                    var videos = _.map(data.data.list, function(n) {
                        var video = new Video(n);
                        startIndex += 1;
                        videoController.push(video, {
                            epIndex: startIndex,
                            isPlaying: current_webcfg.get("id") == n.id
                        });
                        return video;
                    });
                    mod.loadData(videos);
                    var data = data.data;
                    if (callbacks && typeof callbacks == "function") {
                        //第一次加载进这里
                        callbacks(data.page, data.pageSize, data.total);
                    } else if (callbacks) {
                        callbacks.fire();
                    }
                }
            });
        }
        function renderGroup(page, pageSize, total) {
            if (pageSize >= total) {
                $wrap_preload.find("div.numbox").hide();
                tools.containerResize($container, $wrap_preload.find("div.numbox").height());
                return;
            } else {
                $wrap_preload.find("div.numbox").show();
                tools.containerResize($container, $wrap_preload.find("div.numbox").height());
            }
            var groupController = new GroupController(groupCreater.group_episode(page, pageSize, total), {
                eventAggregator: ea,
                $container: $wrap_preload.find("div.subnum"),
                $containerMore: $wrap_preload.find("div.morenum"),
                render: function($container, data) {
                    $container.append(_.template("<% _.each(data, function(n, i){%>" + '<a href="javascript:;" title="" <% if(n.active){print(\'class="now"\')} %>><%= n.title %></a>' + "<% }); %>")({
                        data: data
                    }));
                    return $container.find("a:last");
                },
                renderMore: function($containerMore, data) {
                    $containerMore.append(_.template("<% _.each(data, function(n, i){%>" + '<a href="javascript:;" title="<%= n.title %>" <% if(n.active){print(\'class="now"\')} %>><%= n.title %></a>' + "<% }); %>"), {
                        data: data
                    });
                }
            });
            groupController.init({
                page: page
            });
            ea.subscribe("changePage", function(group, callbacks) {
                $container.append('<div class="loading" style="background:#333;position:absolute; top:0px; text-align:center; width:100%; height:100%; opacity: .7; filter:alpha(opacity=70)"><span style="position:absolute; width:100%; top:49%; left:0; color:#fff">加载中...</span></div>');
                page = group.page;
                callbacks.add(function() {
                    $container.find("div.loading").remove();
                });
                loadData(group.page, callbacks);
            });
        }
    }
    function renderSports($wrap, player) {
        var $tab = $wrap.find("h3:first").after('<div class="tabs cf">' + '<a href="javascript:;" title="互动讨论">互动讨论</a><a href="javascript:;" title="节目单" class="now"><i class="ic1"></i></a>' + "</div>").next();
        var container = $wrap.find("div.tabcon");
        var $tabs = $tab.find("a");
        container.prepend('<div class="newTemplate" style="display:none; color:#fff">newTemplate</div>');
        $tab.on("click", "a", function(e) {
            var i = $(this).index();
            $tabs.removeClass("now").eq(i).addClass("now");
            container.children().hide().eq(i).show();
        });
    }
    var ProgramList = function(option) {
        this.opt = $.extend({
            $wrap: $("#player-sidebar"),
            player: player
        }, option || {});
        this.tools = {};
        this.tabs = {};
        this.build();
    };
    ProgramList.prototype = {
        build: function() {
            var self = this, $wrap = this.opt.$wrap, player = this.opt.player;
            switch (webcfg.playType) {
              case "living":
                renderLiving($wrap, player, this.tools);
                break;

              case "episode":
                renderEpisode($wrap, player, this.tools);
                break;

              case "collection":
                renderCollection($wrap, player, this.tools);
                break;

              case "sports":
                //renderLiving($wrap, player);
                //直播地址：http://aplus.pptv.com/api/ssports
                // renderSports($wrap);
                break;

              default:
                break;
            }
            /*指定默认容器*/
            this.$currentContainer = $wrap.find("div.tabcon").children().eq(0);
            /*定义滚动条高度设置*/
            var HC = this.HC = this.heightController = heightCtrl();
            //这个项目的wrap是parent元素
            HC.height("total", this.opt.$wrap.parent());
            HC.height("title", this.opt.$wrap.find("h3"));
            HC.height("numbox", this.opt.$wrap.find("div.numbox"));
            var containerResize = this.tools.containerResize = function($cont, height, name) {
                if (!$cont.is(":hidden")) {
                    var opt = {};
                    var height = HC.count();
                    opt.wheelPixel = 48;
                    // opt.animate = true;
                    if (height) {
                        opt.maxHeight = height;
                    }
                    self.tools.scroller = $cont.ppScroller(opt).scroll();
                    //带name的是新增tab传进来的，不带name是节目单传进来的
                    !name && self.tools.afterResize && self.tools.afterResize();
                }
            };
            var resizeSideBar = function() {
                // height: player - topAd
                self._reScroller($wrap.find(".tabs .now").attr("title"));
            };
            $.subscribe1("player.resize", resizeSideBar);
        },
        appendTab: function(name, factory) {
            var icon = arguments[2];
            this.addTab({
                name: name,
                factory: factory,
                icon: icon
            });
        },
        prependTab: function(name, factory) {
            this.addTab({
                name: name,
                factory: factory,
                method: "prepend"
            });
        },
        addTab: function(option) {
            this._initTab();
            var self = this;
            var o = $.extend({
                name: "未命名",
                factory: $.noop,
                method: "append"
            }, option || {});
            var $c_tab = this.opt.$wrap.find("div.tabs");
            var $c_container = this.opt.$wrap.find("div.tabcon");
            var $newTab = $('<a href="javascript:;" title="' + o.name + '">' + (o.icon || o.name) + "</a>");
            var $newCont = $('<div style="display:none;"><div></div></div>');
            $c_tab[o.method]($newTab);
            $c_container[o.method]($newCont);
            this.tabs[o.name] = {
                factory: o.factory,
                $container: $newCont,
                $tab: $newTab,
                rendered: false,
                onActive: $.Callbacks()
            };
            var tools = {
                containerResize: function() {
                    self._reScroller(o.name);
                },
                onActive: function(fn) {
                    self.tabs[o.name].onActive.add(fn);
                }
            };
            var init = function(e) {
                var i = $(this).index();
                self.tabs[o.name].rendered = true;
                o.factory($newCont.children(), tools);
                $newTab.off("click", init);
            };
            // $newTab.on('click', init);
            init();
        },
        _reScroller: function(name) {
            var $cur = this.$currentContainer;
            var $scrollerWrap;
            if ($cur.attr("data-scroller-class")) {
                $scrollerWrap = $cur.find("div." + $cur.attr("data-scroller-class"));
            } else {
                $scrollerWrap = $cur;
            }
            //console.log(222,$scrollerWrap, this.heightController.count());
            this.tools.containerResize($scrollerWrap, this.heightController.count(), name);
        },
        _activeTab: function(i, title) {
            this.$currentContainer = this.$tabCon.children().eq(i);
            if (this.tabs[title]) {
                this.tabs[title].onActive.fire();
                this._reScroller(title);
            }
        },
        _initTab: function() {
            if (!this._tabCreated) {
                this._tabCreated = 1;
                var self = this;
                var $wrap = this.opt.$wrap;
                var menuHtml = "";
                if (webcfg && webcfg.type === 4) {
                    //直播节目单用icon
                    menuHtml = '<div class="tabs cf"><a href="javascript:;" title="节目单" class="now"><i class="ic1"></i></a></div>';
                } else {
                    //点播节目单用文字
                    menuHtml = '<div class="tabs cf"><a href="javascript:;" title="节目单" class="now">节目单</a></div>';
                }
                var $tab = $wrap.find("h3:first").after(menuHtml).next();
                var $container = this.$tabCon = $wrap.find("div.tabcon");
                $tab.on("click", "a", function(e) {
                    var i = $(this).index();
                    var title = $(this).attr("title");
                    $tab.children().removeClass("now").eq(i).addClass("now");
                    $container.children().hide().eq(i).show();
                    self._activeTab(i, title);
                });
                this.HC.height("tabs", this.opt.$wrap.find("div.tabs"));
            }
        }
    };
    return ProgramList;
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

define("app/pc/index/video", [ "core/underscore/1.8.3/underscore", "core/jquery/1.8.3/jquery" ], function(require, exports) {
    var _ = require("core/underscore/1.8.3/underscore");
    var $ = require("core/jquery/1.8.3/jquery");
    var player = window.player;
    function Video(info) {
        _.extend(this, {
            id: null,
            isTrailer: false
        }, info);
        //在this上加个备份，方便调用
        if (this.stime && this.etime) {
            this.ctx = {
                stime: this.stime,
                etime: this.etime
            };
        }
    }
    _.extend(Video.prototype, {
        // setParent: function(group){
        // 	if(group && group.constructor == VideoQueueController){
        // 		this._group = group;
        // 	}else{
        // 		throw('wrong group constructor!');
        // 	}
        // }
        attribute: function() {
            var arg = arguments;
            if (arg.length == 1) {
                var a1 = arg[0];
                if (typeof arg == "string") {
                    return this[a1];
                } else if (typeof arg == "object") {
                    var obj = {};
                    _.each(a1, function(v, n) {
                        obj[n] = v;
                    });
                    _.extend(this, obj);
                }
            } else {
                this[arg[0]] = arg[1];
            }
        },
        render: function(template) {
            //underscore 1.8 改了接口
            return _.template(template)(this);
        },
        play: function(callback, opt) {
            var options = _.extend({
                link: this.url
            }, opt);
            if (player) {
                log("[player.goToAndPlay(" + this.id + ")]", options, this);
                if (player.goToAndPlay) {
                    var id = options.id || this.id;
                    player.goToAndPlay(id, options);
                    $.publish("webcfg.change", [ "id", id ]);
                }
                callback && callback();
            } else {
                throw "player is not define!";
            }
        }
    });
    return Video;
});

define("app/pc/index/video-controller", [ "core/underscore/1.8.3/underscore", "core/jquery/1.8.3/jquery", "app/pc/index/video" ], function(require, exports) {
    var _ = require("core/underscore/1.8.3/underscore");
    var $ = require("core/jquery/1.8.3/jquery");
    var Video = require("app/pc/index/video");
    function VideoController() {
        this.initialize.apply(this, arguments);
    }
    _.extend(VideoController.prototype, {
        initialize: function(name, options) {
            var self = this;
            this.name = name;
            this.videos = [];
            _.extend(this, {
                redirect: false,
                redirectTarget: "_self"
            }, options || {});
            this.eventAggregator && this.eventAggregator.subscribe("playCurrentPage", function() {
                if (self.videos.length) {
                    self.play(self.videos[0]);
                }
            });
        },
        attr: function(attr, value) {
            if (this[attr]) {
                this[attr] = value;
            }
        },
        push: function(video, opt) {
            if (this._check(video)) {
                var opt = _.extend(opt || {}, {
                    _index: this.videos.length
                });
                this.videos[this.videos.length] = video;
                video.attribute(opt);
                if (video.isPlaying) {
                    this.currentVideo = video;
                }
                video.attribute && video.attribute("group", this);
            }
        },
        setCurVideo: function(video) {
            var v = _.find(this.videos, function(n) {
                return video == n;
            });
            if (v) {
                this.currentVideo = v;
                this.find(video.id).attribute("isPlaying", true);
            }
        },
        last: function() {
            return this.videos[this.videos.length - 1];
        },
        first: function() {
            return this.videos[0];
        },
        nextVideo: function(video) {
            var video = video || this.currentVideo;
            if (this._check(video)) {
                if (this.last() == video) {
                    return null;
                }
                var index = _.indexOf(this.videos, video);
                return this.videos[index + 1];
            }
        },
        find: function(id, type) {
            var type = type || "id";
            return _.find(this.videos, function(n) {
                if (typeof type == "string") {
                    return n[type] == id;
                } else {
                    return type(n, id);
                }
            });
        },
        _check: function(video) {
            if (video && video.constructor == Video) {
                return true;
            } else {
                log("video", video);
                throw "wrong video constructor!";
                return false;
            }
        },
        empty: function() {
            this.videos = [];
        },
        play: function(id, options) {
            var self = this;
            var options = options || {};
            var rcc = options.rcc || "B3";
            //播放来源，播放页右侧节目单
            var video;
            var id = id || this.currentVideo;
            if (id) {
                if (typeof id == "object") {
                    video = id;
                } else {
                    video = this.find(id);
                }
                if (this.redirect) {
                    //TODO：不加延迟会出现在ff下连续跳转两次的bug,暂时无法找到问题更本原因
                    var url = video.url.replace(/&?rcc_src=\w\d/, "");
                    url += (url.indexOf("?") > -1 ? "&" : "?") + "rcc_src=" + rcc;
                    setTimeout(function() {
                        window.location.href = url;
                    }, 10);
                } else {
                    video.play(function() {
                        var current = self.find(true, "isPlaying");
                        if (current) {
                            current.attribute("isPlaying", false);
                        }
                        video.isPlaying = true;
                        self.currentVideo = video;
                        self.eventAggregator && self.eventAggregator.publish("videoController.afterPlay", video);
                    });
                }
            }
        },
        playFirst: function(options) {
            if (this.videos.length) {
                this.play(this.videos[0], options);
            }
        },
        playNext: function(options) {
            var nextVideo = this.nextVideo();
            var self = this;
            log("[VideoController.playNext]", nextVideo);
            if (nextVideo) {
                this.play(nextVideo, options);
            } else {
                // 播放下一页第一集 openNextPage -> playCurrentPage
                this.eventAggregator && this.eventAggregator.publish("openNextPage", function() {
                    self.playFirst(options);
                });
            }
        },
        each: function(fn, args, scope) {
            _.each(this.videos, function(video) {
                var arguments = [ video ].concat(args || []);
                fn.apply(scope, arguments);
            });
        }
    });
    return VideoController;
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

define("app/pc/index/living-controller", [ "core/underscore/1.8.3/underscore", "core/jquery/1.8.3/jquery", "app/pc/index/video-controller", "app/pc/index/video" ], function(require, exports) {
    var _ = require("core/underscore/1.8.3/underscore");
    var $ = require("core/jquery/1.8.3/jquery");
    var VideoController = require("app/pc/index/video-controller");
    function LivingController() {
        this.initialize.apply(this, arguments);
    }
    // LivingController.prototype = videoController;
    LivingController.constructor = VideoController;
    _.extend(LivingController.prototype, VideoController.prototype, {
        initialize: function() {
            this.livingId = current_webcfg.get("id");
            VideoController.prototype.initialize.apply(this, arguments);
        },
        play: function(startTime, isLiving) {
            var self = this;
            var video;
            if (startTime) {
                if (typeof startTime == "object") {
                    video = startTime;
                } else {
                    video = this.find(startTime, "stime");
                }
                if (!isLiving) {
                    // 这里要保证getCurTime的返回值不是异步（播放页初始的Play是play/index.js启动的，保证了这里getCurTime同步执行）
                    this.eventAggregator.publish("videoController.getCurTime", function(live, posi) {
                        // console.log('live:', live);
                        // console.log('posi:', posi);
                        // console.log('vetime:', video.etime, video);
                        isLiving = live <= video.etime;
                    });
                }
                log("[LivingController.play]isLiving:" + isLiving);
                var pl, reg, swf;
                if (video.subscribe && video.subscribe.link) {
                    reg = video.subscribe.link.match(/\/(\w+)\.html/);
                    if (reg.length > 1) {
                        pl = reg[1];
                    }
                    swf = "http://player.pptv.com/v/" + pl + ".swf";
                }
                var option = {
                    id: this.livingId,
                    title: video.title,
                    link: video.subscribe.link,
                    pl: pl,
                    swf: swf
                };
                $.extend(option, isLiving ? {
                    isVod: 0
                } : {
                    ctx: video.ctx,
                    isVod: 1
                });
                video.play(function() {
                    var current = self.find(true, "isPlaying");
                    if (current) {
                        current.attribute("isPlaying", false);
                    }
                    video.isPlaying = true;
                    self.currentVideo = video;
                    self.eventAggregator && self.eventAggregator.publish("videoController.afterPlay", video);
                }, option);
            }
        },
        playNext: function() {
            var self = this;
            var nextVideo = this.nextVideo();
            log("[VideoController.playNext] nextVideo:", nextVideo);
            if (nextVideo) {
                this.play(nextVideo);
            } else {
                // 播放下一页第一集 openNextPage -> playCurrentPage
                this.eventAggregator && this.eventAggregator.publish("openNextPage", function(index) {
                    self.playFirst();
                    /*index == 0 ,说明自动播放到第一页，即播放到零点以后的节目，刷新节目单分页（分页数据和分页信息自动取当天，即第二天的数据）*/
                    if (index <= 0) {
                        self.eventAggregator.publish("reflashProgram");
                    }
                });
            }
        }
    });
    return LivingController;
});

define("app/pc/index/module", [ "core/jquery/1.8.3/jquery" ], function(require, exports) {
    var $ = require("core/jquery/1.8.3/jquery");
    function Mod(option) {
        var opt = $.extend(this, {
            /*define wrap*/
            $wrap: $(),
            $container: $(),
            /*
			 * renderWrap [create wrap dom]
			 * @param $wrap
			 * @return $container
			 */
            renderWrap: $.noop,
            /*
			 * render [render container dom]
			 * @param $container
			 * @param data [object array]
			 */
            render: $.noop
        }, option);
    }
    Mod.prototype = {
        init: function() {
            var $container = this.renderWrap(this.$wrap);
            if ($container) {
                this.$container = $container;
            }
        },
        loadData: function(data) {
            this.render(this.$container, data);
        }
    };
    return Mod;
});