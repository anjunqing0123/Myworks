/*! 一唱成名 create by ErickSong */
define("app/pc/canvaslib/Handler", [ "./config", "./tool/env", "./tool/event", "./mixin/Eventful", "./tool/util", "./dep/excanvas", "./tool/vector", "./tool/matrix" ], function(require, exports, module) {
    /**
 * Handler控制模块
 * @module zrender/Handler
 * @author Kener (@Kener-林峰, kener.linfeng@gmail.com)
 *         errorrik (errorrik@gmail.com)
 *
 */
    // TODO mouseover 只触发一次
    "use strict";
    var config = require("./config");
    var env = require("./tool/env");
    var eventTool = require("./tool/event");
    var util = require("./tool/util");
    var vec2 = require("./tool/vector");
    var mat2d = require("./tool/matrix");
    var EVENT = config.EVENT;
    var Eventful = require("./mixin/Eventful");
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
