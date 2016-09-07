/*! 一唱成名 create by ErickSong */
define("app/pc/index/group-controller", [ "core/jquery/1.8.3/jquery", "core/underscore/1.8.3/underscore", "../../../util/function/delay" ], function(require, exports) {
    var $ = require("core/jquery/1.8.3/jquery");
    var _ = require("core/underscore/1.8.3/underscore");
    var delay = require("../../../util/function/delay");
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
