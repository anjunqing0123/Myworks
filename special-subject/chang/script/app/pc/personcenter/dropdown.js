/*! 一唱成名 create by ErickSong */
define("app/pc/personcenter/dropdown", [ "core/jquery/1.8.3/jquery", "./mediator", "../../../util/scroller/scroller", "core/underscore/1.8.3/underscore", "../../../util/event/event-mouse-wheel", "../../../util/scroller/scroller.css" ], function(require, module, exports) {
    var $ = require("core/jquery/1.8.3/jquery");
    var mediator = require("./mediator");
    mediator.installTo(dropdown.prototype);
    require("../../../util/scroller/scroller");
    //ie6 bug fix
    var IE6 = !window.XMLHttpRequest;
    function dropdown(options) {
        var defaults = {
            container: ".input-dropdown",
            dropIcon: ".dropdown-icon",
            expandWrap: ".dropdown-expand",
            selectItem: "li",
            activeClass: "active",
            hoverClass: "hover-active",
            curval: ".curval",
            maxHeight: "300",
            dataOpt: "",
            animate: true
        };
        this.opt = $.extend({}, defaults, options);
        this.container = $(this.opt.container);
        this.dropIcon = this.container.find(this.opt.dropIcon);
        this.expandWrap = this.container.find(this.opt.expandWrap);
        this.curval = this.container.find(this.opt.curval);
        this.curIndex = 0;
        // 关联下一个dropdown
        this.nextDropdown = null;
        // 关联前一个dropdown
        this.prevDropdown = null;
        this.scroller = null;
        this.isopen = false;
        var doc = $(document);
        var self = this;
        this.on("open", function() {
            //todo
            var tempNextDropDown = this.nextDropdown;
            while (!!tempNextDropDown) {
                tempNextDropDown.trigger("hide");
                tempNextDropDown = tempNextDropDown.nextDropdown;
            }
            var tempPrevDropDown = this.prevDropdown;
            while (!!tempPrevDropDown) {
                tempPrevDropDown.trigger("hide");
                tempPrevDropDown = tempPrevDropDown.prevDropdown;
            }
            //重置hover的状态
            self.expandWrap.find("." + self.opt.hoverClass).removeClass(self.opt.hoverClass);
            self.show();
            self.isopen = true;
            doc.on("click.dropdown", function(e) {
                var target = $(e.target);
                var tempClass = self.opt.container;
                if (typeof tempClass == "object") {
                    tempClass = defaults.container;
                }
                if (target.parents(tempClass).length == 0) {
                    self.trigger("hide");
                    doc.off("click.dropdown");
                }
            });
        });
        this.on("hide", function() {
            self.hide();
            self.isopen = false;
            doc.off("click.dropdown");
        });
        this.container.on("click", this.opt.dropIcon, function(e) {
            self.isopen ? self.trigger("hide") : self.trigger("open");
        });
        this.on("reset", function(searchVal) {
            self.reset(searchVal);
        });
        this.container.on("click", this.opt.selectItem, function() {
            var obj = $(this);
            var searchVal = obj.html();
            var activeClass = self.opt.activeClass;
            var tempIndex = obj.index();
            if (self.curIndex == tempIndex) {
                self.trigger("hide");
                return false;
            }
            self.curIndex = tempIndex;
            obj.siblings().removeClass(activeClass);
            obj.addClass(activeClass);
            self.trigger("hide");
            self.curval.html(searchVal);
            self.curval.attr("title", searchVal);
            var dataOpt = self.opt.dataOpt;
            if (dataOpt) {
                self.curval.attr(dataOpt, obj.attr(dataOpt));
            }
            self.request("afterSelect", searchVal);
            self.nextDropdown && self.nextDropdown.trigger("reset", searchVal);
        });
        this.container.on("mouseenter", this.opt.selectItem, function(e) {
            var obj = $(this);
            var activeClass = self.opt.hoverClass;
            obj.siblings().removeClass(activeClass);
            obj.addClass(activeClass);
        });
    }
    $.extend(dropdown.prototype, {
        show: function() {
            var option = {
                wheelPixel: 5,
                maxHeight: this.opt.maxHeight,
                horizontal: false,
                autoWrap: false
            };
            if (!this.opt.animate) {
                this.expandWrap.stop(true, true);
                this.expandWrap.css({
                    visibility: "hidden",
                    display: "block"
                });
                var tempHeight = this.expandWrap.find("ul").height();
                if (this.scroller == null && tempHeight > this.opt.maxHeight) {
                    this.scroller = this.expandWrap.ppScroller(option).scroll();
                    var items = this.expandWrap.find(this.opt.selectItem);
                    this.scroller.scrollTo(items.eq(this.curIndex).position().top);
                }
                this.expandWrap.css({
                    visibility: "visible",
                    display: "block"
                });
            } else {
                this.expandWrap.stop(true, true);
                this.expandWrap.css({
                    visibility: "hidden",
                    display: "block"
                });
                var tempHeight = this.expandWrap.find("ul").height();
                if (this.scroller == null && tempHeight > this.opt.maxHeight) {
                    this.scroller = this.expandWrap.ppScroller(option).scroll();
                    var items = this.expandWrap.find(this.opt.selectItem);
                    this.scroller.scrollTo(items.eq(this.curIndex).position().top);
                }
                this.expandWrap.css({
                    visibility: "visible",
                    display: "none"
                });
                this.expandWrap.fadeIn();
            }
        },
        hide: function() {
            var self = this;
            if (!this.opt.animate) {
                this.expandWrap.addClass("hidden");
            } else {
                this.expandWrap.stop(true, true).fadeOut();
            }
        },
        reset: function(searchVal) {
            //模板需要优化
            var searchList = [];
            var tempPrev = this.prevDropdown;
            while (tempPrev != null) {
                searchList.unshift(tempPrev.curval.html());
                tempPrev = tempPrev.prevDropdown;
            }
            this.empty();
            var tempHtml = "<ul>";
            var tempCount = 0;
            this.curIndex = 0;
            !!this.scroller && !this.scroller.destory();
            this.scroller = null;
            if (searchList.length == 0) {
                //第一个tab
                var tempVal = this.curval.html();
                for (key in this.opt.groupDataArr) {
                    if (tempVal == "" && tempCount == 0) {
                        tempHtml += '<li class="' + this.opt.activeClass + '">' + key + "</li>";
                        this.curval.html(key);
                        this.curval.attr("title", key);
                    } else {
                        if (tempVal == key) {
                            tempHtml += '<li class="' + this.opt.activeClass + '">' + key + "</li>";
                            this.curval.html(key);
                            this.curval.attr("title", key);
                            //console.log('count',tempCount);
                            this.curIndex = tempCount;
                        } else {
                            tempHtml += "<li>" + key + "</li>";
                        }
                    }
                    tempCount++;
                }
                tempHtml += "</ul>";
                this.expandWrap.html(tempHtml);
            } else {
                var finalval = this.opt.groupDataArr;
                for (var i = 0; i < searchList.length; i++) {
                    finalval = finalval[searchList[i]];
                }
                if ($.isArray(finalval)) {
                    //判断生日类型
                    var isSpec = false;
                    if (searchList[1] == "02") {
                        var validateVal = searchList[0];
                        if (validateVal % 4 == 0 && validateVal % 100 != 0 || validateVal % 400 == 0) {
                            isSpec = true;
                        }
                    }
                    for (var i = 0; i < finalval.length; i++) {
                        if (i == 0) {
                            tempHtml += '<li class="' + this.opt.activeClass + '">' + finalval[i] + "</li>";
                            this.curval.html(finalval[i]);
                            this.curval.attr("title", finalval[i]);
                        } else {
                            tempHtml += "<li>" + finalval[i] + "</li>";
                        }
                    }
                    if (isSpec) {
                        tempHtml += "<li>" + 29 + "</li>";
                    }
                    tempHtml += "</ul>";
                    this.expandWrap.html(tempHtml);
                    if (this.container.hasClass("hidden")) {
                        this.container.removeClass("hidden");
                    }
                } else if (typeof finalval == "undefined") {
                    tempHtml += "</ul>";
                    this.curval.html("");
                    this.curval.removeAttr("title");
                    this.container.addClass("hidden");
                } else {
                    var isNum = false;
                    for (var key in finalval) {
                        if (!isNaN(parseInt(key))) {
                            isNum = true;
                            break;
                        }
                    }
                    if (!isNum) {
                        for (var key in finalval) {
                            if (tempCount == 0) {
                                tempHtml += '<li class="' + this.opt.activeClass + '">' + key + "</li>";
                                this.curval.html(key);
                                this.curval.attr("title", key);
                            } else {
                                tempHtml += "<li>" + key + "</li>";
                            }
                            tempCount++;
                        }
                    } else {
                        var resultArr = [];
                        for (var key in finalval) {
                            resultArr.push(key);
                        }
                        resultArr.sort(function(a, b) {
                            return parseInt(a, 10) - parseInt(b, 10);
                        });
                        for (var i = 0; i < resultArr.length; i++) {
                            if (i == 0) {
                                tempHtml += '<li class="' + this.opt.activeClass + '">' + resultArr[i] + "</li>";
                                this.curval.html(resultArr[i]);
                                this.curval.attr("title", resultArr[i]);
                            } else {
                                tempHtml += "<li>" + resultArr[i] + "</li>";
                            }
                        }
                    }
                    tempHtml += "</ul>";
                    this.expandWrap.html(tempHtml);
                    if (this.container.hasClass("hidden")) {
                        this.container.removeClass("hidden");
                    }
                }
            }
            if (!!IE6) {
                var containerWidth = this.container.width();
                if (this.expandWrap.width() < containerWidth) {
                    this.expandWrap.width(containerWidth);
                }
            }
            if (this.nextDropdown != null) {
                this.nextDropdown.reset();
            }
        },
        empty: function() {
            this.expandWrap.html("");
        },
        request: function(type) {
            if (typeof this.opt[type] == "function") {
                this.opt[type].apply(this, arguments);
            }
        }
    });
    return {
        create: function(options) {
            return new dropdown(options);
        }
    };
});

define("app/pc/personcenter/mediator", [ "core/jquery/1.8.3/jquery" ], function(require, exports) {
    var $ = require("core/jquery/1.8.3/jquery"), slice = [].slice, separator = /\s+/, protos;
    // 根据条件过滤出事件handlers.
    function findHandlers(arr, name, callback, context) {
        return $.grep(arr, function(handler) {
            return handler && (!name || handler.e === name) && (!callback || handler.cb === callback || handler.cb._cb === callback) && (!context || handler.ctx === context);
        });
    }
    function eachEvent(events, callback, iterator) {
        // 不支持对象，只支持多个event用空格隔开
        $.each((events || "").split(separator), function(_, key) {
            iterator(key, callback);
        });
    }
    function triggerHanders(events, args) {
        var stoped = false, i = -1, len = events.length, handler;
        while (++i < len) {
            handler = events[i];
            if (handler.cb.apply(handler.ctx2, args) === false) {
                stoped = true;
                break;
            }
        }
        return !stoped;
    }
    protos = {
        on: function(name, callback, context) {
            var me = this, set;
            if (!callback) {
                return this;
            }
            set = this._events || (this._events = []);
            eachEvent(name, callback, function(name, callback) {
                var handler = {
                    e: name
                };
                handler.cb = callback;
                handler.ctx = context;
                handler.ctx2 = context || me;
                handler.id = set.length;
                set.push(handler);
            });
            return this;
        },
        once: function(name, callback, context) {
            var me = this;
            if (!callback) {
                return me;
            }
            eachEvent(name, callback, function(name, callback) {
                var once = function() {
                    me.off(name, once);
                    return callback.apply(context || me, arguments);
                };
                once._cb = callback;
                me.on(name, once, context);
            });
            return me;
        },
        off: function(name, cb, ctx) {
            var events = this._events;
            if (!events) {
                return this;
            }
            if (!name && !cb && !ctx) {
                this._events = [];
                return this;
            }
            eachEvent(name, cb, function(name, cb) {
                $.each(findHandlers(events, name, cb, ctx), function() {
                    delete events[this.id];
                });
            });
            return this;
        },
        trigger: function(type) {
            var args, events, allEvents;
            if (!this._events || !type) {
                return this;
            }
            args = slice.call(arguments, 1);
            events = findHandlers(this._events, type);
            allEvents = findHandlers(this._events, "all");
            return triggerHanders(events, args) && triggerHanders(allEvents, arguments);
        }
    };
    return $.extend({
        installTo: function(obj) {
            return $.extend(obj, protos);
        }
    }, protos);
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
