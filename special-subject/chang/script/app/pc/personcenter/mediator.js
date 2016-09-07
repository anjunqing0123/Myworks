/*! 一唱成名 create by ErickSong */
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
