/*! 一唱成名 create by ErickSong */
define("app/pc/playpage/programList", [ "core/jquery/1.8.3/jquery", "../index/group", "core/underscore/1.8.3/underscore", "../index/group-controller", "../../../util/function/delay", "../../../util/event/event-aggregator", "../../../util/loader/loader", "../../../util/log/log", "../../../util/platform/plt", "../../../util/browser/browser", "../../../util/net/urlquery", "../../../util/linkcfg/interfaceurl", "../../../util/scroller/scroller", "../../../util/event/event-mouse-wheel", "../../../util/scroller/scroller.css" ], function(require, exports) {
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
    var Group = require("../index/group");
    var GroupController = require("../index/group-controller");
    var EventAggregator = require("../../../util/event/event-aggregator");
    var loader = require("../../../util/loader/loader");
    var urls = require("../../../util/linkcfg/interfaceurl");
    require("../../../util/scroller/scroller");
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
