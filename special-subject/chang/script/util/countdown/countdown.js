/*! 一唱成名 create by ErickSong */
/* 
* @Author: WhiteWang
* @Date:   2015-09-17 09:59:17
* @Last Modified by:   weifengwang
* @Last Modified time: 2015-09-23 09:58:24
*/
//jquery插件，点击按钮后，给按钮覆盖一层dom，默认10秒后才能再次点击
//样式需要CSS定义
define("util/countdown/countdown", [ "../eventpause/eventpause" ], function(require) {
    return function($) {
        require("../eventpause/eventpause")($);
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
